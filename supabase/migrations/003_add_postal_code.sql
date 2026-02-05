ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

CREATE INDEX IF NOT EXISTS idx_listings_postal_code ON listings (postal_code);
