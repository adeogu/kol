# License Verification Service

## Local setup

Use Python 3.12 or 3.13 for the smoothest dependency install.

```powershell
cd services/license-verification
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Run tests

```powershell
python -m pytest --cov=app --cov-branch --cov-fail-under=100
```

## Run service

```powershell
python -m uvicorn app.main:app --reload --port 8001
```

## Notes

- If you are on Python 3.14 and install fails with native build errors, install Python 3.12 and use that interpreter for this service.
- For local app integration, set:
  - `LICENSE_VERIFICATION_SERVICE_URL=http://localhost:8001`
  - `LICENSE_VERIFICATION_FALLBACK_MODE=verify_valid` (optional dev fallback)
- Optional AI extraction settings:
  - `OPENAI_API_KEY=...` enables image field extraction with GPT-4o compatible chat completions.
  - `OPENAI_VISION_MODEL=gpt-4o-mini` (optional override; defaults to this).
