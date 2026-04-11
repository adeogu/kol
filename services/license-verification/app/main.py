from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, HttpUrl

from .ai_extract import extract_license_fields
from .validators import evaluate_license, normalize_license_number

app = FastAPI(title="HuntStay License Verification Service", version="0.1.0")


class VerifyLicenseRequest(BaseModel):
    hunter_id: str
    license_image_url: HttpUrl
    declared_license_number: str | None = None
    holder_name: str | None = None
    expiry_date: str | None = None
    license_type: str | None = None
    county: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/verify-license")
def verify_license(payload: VerifyLicenseRequest) -> dict:
    extracted = extract_license_fields(str(payload.license_image_url))

    license_number = payload.declared_license_number or extracted.get("license_number")
    holder_name = payload.holder_name or extracted.get("holder_name")
    expiry_date = payload.expiry_date or extracted.get("expiry_date")
    license_type = payload.license_type or extracted.get("license_type")
    county = payload.county or extracted.get("county")

    normalized_number = normalize_license_number(license_number)
    result = evaluate_license(
        license_number=normalized_number,
        holder_name=holder_name,
        expiry_date=expiry_date,
        license_type=license_type,
    )

    return {
        "status": result.status,
        "confidence_score": result.confidence_score,
        "extracted_fields": {
            "license_number": normalized_number,
            "holder_name": holder_name,
            "expiry_date": expiry_date,
            "license_type": license_type,
            "county": county,
        },
        "reasons": result.reasons,
    }
