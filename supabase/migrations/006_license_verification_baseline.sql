-- License verification baseline for compliance gate
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS license_status TEXT
  CHECK (license_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW'))
  DEFAULT 'UNVERIFIED';

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS license_verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS license_expiry_date DATE;

UPDATE profiles
SET license_status = CASE
  WHEN license_verified = TRUE THEN 'VERIFIED'
  ELSE 'UNVERIFIED'
END
WHERE license_status IS NULL;

CREATE TABLE IF NOT EXISTS hunter_license_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  license_document_url TEXT,
  extracted_license_number TEXT,
  extracted_holder_name TEXT,
  extracted_license_type TEXT,
  extracted_county TEXT,
  extracted_expiry_date DATE,
  confidence_score NUMERIC(3,2),
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW')),
  reasons JSONB DEFAULT '[]'::jsonb,
  raw_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS booking_license_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  hunter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  landowner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  license_number TEXT,
  holder_name TEXT,
  license_type TEXT,
  county TEXT,
  expiry_date DATE,
  status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'REJECTED', 'NEEDS_REVIEW', 'UNVERIFIED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  revoked_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE hunter_license_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_license_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hunters can view own license verifications" ON hunter_license_verifications;
CREATE POLICY "Hunters can view own license verifications"
  ON hunter_license_verifications FOR SELECT
  USING (hunter_id = auth.uid());

DROP POLICY IF EXISTS "Hunters can insert own license verifications" ON hunter_license_verifications;
CREATE POLICY "Hunters can insert own license verifications"
  ON hunter_license_verifications FOR INSERT
  WITH CHECK (hunter_id = auth.uid());

DROP POLICY IF EXISTS "Participants can view booking license snapshots" ON booking_license_snapshots;
CREATE POLICY "Participants can view booking license snapshots"
  ON booking_license_snapshots FOR SELECT
  USING (hunter_id = auth.uid() OR landowner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
