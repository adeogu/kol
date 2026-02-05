-- Allow participants to mark messages as read
DROP POLICY IF EXISTS "Users can mark messages read" ON messages;

CREATE POLICY "Users can mark messages read"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.hunter_id = auth.uid() OR conversations.landowner_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.hunter_id = auth.uid() OR conversations.landowner_id = auth.uid())
    )
  );
