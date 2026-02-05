-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "Published listings are viewable by everyone"
  ON listings FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Landowners can view own drafts"
  ON listings FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Landowners can insert own listings"
  ON listings FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'LANDOWNER'
    )
  );

CREATE POLICY "Landowners can update own listings"
  ON listings FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Landowners can delete own listings"
  ON listings FOR DELETE USING (owner_id = auth.uid());

-- Bookings
CREATE POLICY "Hunters can view own bookings"
  ON bookings FOR SELECT USING (hunter_id = auth.uid());

CREATE POLICY "Landowners can view bookings for their listings"
  ON bookings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = bookings.listing_id
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "Hunters can create bookings"
  ON bookings FOR INSERT WITH CHECK (
    hunter_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'HUNTER')
  );

CREATE POLICY "Landowners can update booking status"
  ON bookings FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = bookings.listing_id
      AND listings.owner_id = auth.uid()
    )
  );

-- Reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Hunters can create reviews for their bookings"
  ON reviews FOR INSERT WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.hunter_id = auth.uid()
    )
  );

-- Conversations
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT USING (
    hunter_id = auth.uid() OR landowner_id = auth.uid()
  );

CREATE POLICY "Hunters can create conversations"
  ON conversations FOR INSERT WITH CHECK (
    hunter_id = auth.uid()
  );

-- Messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.hunter_id = auth.uid() OR conversations.landowner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND (conversations.hunter_id = auth.uid() OR conversations.landowner_id = auth.uid())
    )
  );

-- Favorites
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete favorites"
  ON favorites FOR DELETE USING (user_id = auth.uid());

-- Storage policies
CREATE POLICY "Public read access for huntstay buckets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('listing-images', 'licenses', 'verifications'));

CREATE POLICY "Authenticated users can upload to huntstay buckets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('listing-images', 'licenses', 'verifications')
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  USING (auth.uid() = owner);

CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (auth.uid() = owner);
