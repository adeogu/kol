ALTER TABLE booking_license_snapshots
  ADD COLUMN IF NOT EXISTS license_document_url TEXT;
