import json

import httpx

from app import ai_extract


def test_strip_code_fence_variants() -> None:
    assert ai_extract.strip_code_fence('{"ok": true}') == '{"ok": true}'
    assert (
        ai_extract.strip_code_fence('```json\n{"ok": true}\n```')
        == '{"ok": true}'
    )
    assert ai_extract.strip_code_fence("```") == ""
    assert ai_extract.strip_code_fence("```json\n{\"ok\": true}") == '{"ok": true}'


def test_parse_json_like_and_normalize() -> None:
    parsed = ai_extract.parse_json_like('{"license_number":" NARGC-12345 "}')
    assert parsed == {"license_number": " NARGC-12345 "}
    assert ai_extract.parse_json_like("[]") == {}
    normalized = ai_extract.normalize_extracted_fields(
        {
            "license_number": " NARGC-12345 ",
            "holder_name": None,
            "expiry_date": "2027-01-01",
            "license_type": " GAME ",
            "county": "",
        }
    )
    assert normalized == {
        "license_number": "NARGC-12345",
        "holder_name": None,
        "expiry_date": "2027-01-01",
        "license_type": "GAME",
        "county": None,
    }


def test_extract_with_openai_without_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    assert ai_extract.extract_with_openai("https://example.com/license.jpg") == {}


def test_extract_with_openai_success(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_VISION_MODEL", "gpt-4o-mini")

    class Response:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(
                                {
                                    "license_number": "NARGC-12345",
                                    "holder_name": "Jane Hunter",
                                    "expiry_date": "2027-09-01",
                                    "license_type": "GAME",
                                    "county": "Mayo",
                                }
                            )
                        }
                    }
                ]
            }

    def fake_post(*args, **kwargs):  # noqa: ANN002, ANN003
        assert kwargs["json"]["model"] == "gpt-4o-mini"
        return Response()

    monkeypatch.setattr(ai_extract.httpx, "post", fake_post)

    extracted = ai_extract.extract_with_openai("https://example.com/license.jpg")
    assert extracted["license_number"] == "NARGC-12345"
    assert extracted["county"] == "Mayo"


def test_extract_license_fields_handles_failures(monkeypatch) -> None:
    def fail(_url: str) -> dict[str, str | None]:
        raise httpx.HTTPError("boom")

    monkeypatch.setattr(ai_extract, "extract_with_openai", fail)
    assert ai_extract.extract_license_fields("https://example.com/license.jpg") == {}

    monkeypatch.setattr(
        ai_extract,
        "extract_with_openai",
        lambda _url: {"license_number": "NARGC-12345"},
    )
    assert ai_extract.extract_license_fields("https://example.com/license.jpg") == {
        "license_number": "NARGC-12345"
    }
