ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles
SET onboarding_completed = TRUE
WHERE onboarding_completed = FALSE
  AND (
    COALESCE(county, '') <> ''
    OR COALESCE(phone, '') <> ''
    OR COALESCE(identity_document_url, '') <> ''
    OR COALESCE(license_document_url, '') <> ''
    OR (
      jsonb_typeof(COALESCE(hunting_preferences, '[]'::jsonb)) = 'array'
      AND jsonb_array_length(COALESCE(hunting_preferences, '[]'::jsonb)) > 0
    )
  );
