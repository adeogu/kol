from datetime import date, timedelta

from app.validators import (
    evaluate_license,
    is_supported_license_type,
    looks_like_irish_license_number,
    normalize_license_number,
    parse_iso_date,
)


def test_normalize_license_number_trims_and_compacts() -> None:
    assert normalize_license_number(" nargc-123 45 ") == "NARGC-12345"
    assert normalize_license_number("   ") is None
    assert normalize_license_number(None) is None


def test_looks_like_irish_license_number_variants() -> None:
    assert looks_like_irish_license_number("NARGC-12345")
    assert looks_like_irish_license_number("IE-123456")
    assert looks_like_irish_license_number("A1B2C3D4")
    assert not looks_like_irish_license_number("abc")
    assert not looks_like_irish_license_number(None)


def test_parse_iso_date() -> None:
    today = date.today().isoformat()
    assert parse_iso_date(today) == date.today()
    assert parse_iso_date("not-a-date") is None
    assert parse_iso_date(None) is None


def test_supported_license_type() -> None:
    assert is_supported_license_type("game")
    assert is_supported_license_type("DEER")
    assert not is_supported_license_type("fishing")
    assert not is_supported_license_type(None)


def test_evaluate_license_verified() -> None:
    future = (date.today() + timedelta(days=365)).isoformat()
    result = evaluate_license(
        license_number="NARGC-12345",
        holder_name="Jane Hunter",
        expiry_date=future,
        license_type="GAME",
    )
    assert result.status == "VERIFIED"
    assert result.reasons == []


def test_evaluate_license_rejected_for_expired() -> None:
    past = (date.today() - timedelta(days=1)).isoformat()
    result = evaluate_license(
        license_number="NARGC-12345",
        holder_name="Jane Hunter",
        expiry_date=past,
        license_type="GAME",
    )
    assert result.status == "REJECTED"
    assert "License has expired." in result.reasons


def test_evaluate_license_needs_review_for_missing_soft_fields() -> None:
    future = (date.today() + timedelta(days=365)).isoformat()
    result = evaluate_license(
        license_number="NARGC-12345",
        holder_name=None,
        expiry_date=future,
        license_type="GAME",
    )
    assert result.status == "NEEDS_REVIEW"
    assert "Missing holder name." in result.reasons


def test_evaluate_license_rejected_for_bad_number() -> None:
    future = (date.today() + timedelta(days=365)).isoformat()
    result = evaluate_license(
        license_number="x",
        holder_name="Jane Hunter",
        expiry_date=future,
        license_type="GAME",
    )
    assert result.status == "REJECTED"
    assert "Invalid or missing license number format." in result.reasons
