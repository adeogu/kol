from __future__ import annotations

import json
import os
from typing import Any

import httpx


def strip_code_fence(value: str) -> str:
    text = value.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2:
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def parse_json_like(value: str) -> dict[str, Any]:
    cleaned = strip_code_fence(value)
    parsed = json.loads(cleaned)
    if isinstance(parsed, dict):
        return parsed
    return {}


def normalize_extracted_fields(raw: dict[str, Any]) -> dict[str, str | None]:
    def clean(value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    return {
        "license_number": clean(raw.get("license_number")),
        "holder_name": clean(raw.get("holder_name")),
        "expiry_date": clean(raw.get("expiry_date")),
        "license_type": clean(raw.get("license_type")),
        "county": clean(raw.get("county")),
    }


def extract_with_openai(license_image_url: str) -> dict[str, str | None]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {}

    model = os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini")
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Extract Irish hunting license details from the image. "
                        "Return strict JSON with keys: license_number, holder_name, "
                        "expiry_date, license_type, county."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract the fields."},
                        {
                            "type": "image_url",
                            "image_url": {"url": license_image_url},
                        },
                    ],
                },
            ],
        },
        timeout=20.0,
    )
    response.raise_for_status()
    payload = response.json()
    message_content = (
        payload.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    )
    raw = parse_json_like(message_content if isinstance(message_content, str) else "{}")
    return normalize_extracted_fields(raw)


def extract_license_fields(license_image_url: str) -> dict[str, str | None]:
    try:
        return extract_with_openai(license_image_url)
    except (json.JSONDecodeError, httpx.HTTPError, KeyError, TypeError, ValueError):
        return {}
