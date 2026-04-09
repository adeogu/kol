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
