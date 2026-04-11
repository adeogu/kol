from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_verify_license_verified() -> None:
    future = (date.today() + timedelta(days=365)).isoformat()
    response = client.post(
        "/verify-license",
        json={
            "hunter_id": "hunter-1",
            "license_image_url": "https://example.com/license.jpg",
            "declared_license_number": "NARGC-12345",
            "holder_name": "Jane Hunter",
            "expiry_date": future,
            "license_type": "GAME",
            "county": "Donegal",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "VERIFIED"
    assert payload["extracted_fields"]["license_number"] == "NARGC-12345"
    assert payload["reasons"] == []


def test_verify_license_needs_review_missing_fields() -> None:
    future = (date.today() + timedelta(days=365)).isoformat()
    response = client.post(
        "/verify-license",
        json={
            "hunter_id": "hunter-2",
            "license_image_url": "https://example.com/license.jpg",
            "declared_license_number": "NARGC-12345",
            "expiry_date": future,
            "license_type": "GAME",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "NEEDS_REVIEW"
    assert "Missing holder name." in payload["reasons"]


def test_verify_license_rejected_bad_format() -> None:
    future = (date.today() + timedelta(days=365)).isoformat()
    response = client.post(
        "/verify-license",
        json={
            "hunter_id": "hunter-3",
            "license_image_url": "https://example.com/license.jpg",
            "declared_license_number": "x",
            "holder_name": "John Hunter",
            "expiry_date": future,
            "license_type": "GAME",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "REJECTED"
    assert "Invalid or missing license number format." in payload["reasons"]


def test_verify_license_payload_validation() -> None:
    response = client.post(
        "/verify-license",
        json={
            "hunter_id": "hunter-4",
            "license_image_url": "not-a-url",
        },
    )
    assert response.status_code == 422


def test_verify_license_uses_ai_extracted_fields_when_missing(monkeypatch) -> None:
    future = (date.today() + timedelta(days=120)).isoformat()

    def fake_extract(_image_url: str) -> dict[str, str | None]:
        return {
            "license_number": "NARGC-98765",
            "holder_name": "AI Hunter",
            "expiry_date": future,
            "license_type": "GAME",
            "county": "Sligo",
        }

    monkeypatch.setattr("app.main.extract_license_fields", fake_extract)
    response = client.post(
        "/verify-license",
        json={
            "hunter_id": "hunter-5",
            "license_image_url": "https://example.com/license.jpg",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "VERIFIED"
    assert payload["extracted_fields"]["holder_name"] == "AI Hunter"
