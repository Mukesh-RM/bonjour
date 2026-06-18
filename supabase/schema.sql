CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_users ON messages(sender_id, recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

ALTER TABLE messages REPLICA IDENTITY FULL;

INSERT INTO auth_users (username) VALUES ('user1'), ('user2')
ON CONFLICT (username) DO NOTHING;

ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on auth_users"
  ON auth_users FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on messages"
  ON messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on messages"
  ON messages FOR UPDATE
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
