-- Allow both participants to start conversations while validating listing ownership
DROP POLICY IF EXISTS "Hunters can create conversations" ON conversations;
DROP POLICY IF EXISTS "Participants can create conversations" ON conversations;

CREATE POLICY "Participants can create conversations"
  ON conversations FOR INSERT WITH CHECK (
    (hunter_id = auth.uid() OR landowner_id = auth.uid())
    AND EXISTS (
      SELECT 1
      FROM listings
      WHERE listings.id = listing_id
        AND listings.owner_id = landowner_id
    )
  );
