from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable


SUPPORTED_LICENSE_TYPES = {"GAME", "DEER", "VERMIN", "MIXED"}


@dataclass
class VerificationResult:
    status: str
    confidence_score: float
    reasons: list[str]


def normalize_license_number(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip().upper().replace(" ", "")
    return normalized or None


def looks_like_irish_license_number(value: str | None) -> bool:
    if not value:
        return False
    if value.startswith("NARGC-") and len(value) >= 10:
        return True
    if value.startswith("IE-") and len(value) >= 8:
        return True
    return value.isalnum() and 6 <= len(value) <= 20


def parse_iso_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def is_supported_license_type(value: str | None) -> bool:
    if not value:
        return False
    return value.strip().upper() in SUPPORTED_LICENSE_TYPES


def evaluate_license(
    *,
    license_number: str | None,
    holder_name: str | None,
    expiry_date: str | None,
    license_type: str | None,
    required_checks: Iterable[str] | None = None,
) -> VerificationResult:
    checks = set(required_checks or {"license_number", "holder_name", "expiry_date", "license_type"})
    reasons: list[str] = []

    normalized_number = normalize_license_number(license_number)
    expiry = parse_iso_date(expiry_date)
    normalized_type = license_type.strip().upper() if license_type else None
    normalized_name = holder_name.strip() if holder_name else None

    if "license_number" in checks and not looks_like_irish_license_number(normalized_number):
        reasons.append("Invalid or missing license number format.")

    if "holder_name" in checks and not normalized_name:
        reasons.append("Missing holder name.")

    if "expiry_date" in checks:
        if not expiry:
            reasons.append("Missing or invalid expiry date.")
        elif expiry <= date.today():
            reasons.append("License has expired.")

    if "license_type" in checks and not is_supported_license_type(normalized_type):
        reasons.append("Unsupported or missing license type.")

    if not reasons:
        return VerificationResult(status="VERIFIED", confidence_score=0.98, reasons=[])

    hard_failures = {"Invalid or missing license number format.", "License has expired."}
    if any(reason in hard_failures for reason in reasons):
        return VerificationResult(status="REJECTED", confidence_score=0.2, reasons=reasons)

    return VerificationResult(status="NEEDS_REVIEW", confidence_score=0.45, reasons=reasons)
