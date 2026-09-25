import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

const SQL_MIGRATION = `-- =============================================
-- SECRET ADMIRER - Supabase Schema Migration
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  subtitle TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'choice', 'scale')),
  options JSONB,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(is_active);

-- RESPONSES TABLE
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_choice TEXT,
  answer_scale INTEGER CHECK (answer_scale BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(question_id);

-- CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_conv_id ON conversation_members(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_user_id ON conversation_members(user_id);

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('message', 'admin', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile (not role)"
  ON profiles FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service can insert profiles"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- QUESTIONS POLICIES
CREATE POLICY "Anyone authenticated can read active questions"
  ON questions FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can read all questions"
  ON questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RESPONSES POLICIES
CREATE POLICY "Users can read own responses"
  ON responses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
  ON responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
  ON responses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own responses"
  ON responses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all responses"
  ON responses FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- CONVERSATIONS POLICIES
CREATE POLICY "Members can read their conversations"
  ON conversations FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = conversations.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all conversations"
  ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage conversations"
  ON conversations FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CONVERSATION MEMBERS POLICIES
CREATE POLICY "Members can read their memberships"
  ON conversation_members FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can read all memberships"
  ON conversation_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage memberships"
  ON conversation_members FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can join conversations"
  ON conversation_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- MESSAGES POLICIES
CREATE POLICY "Members can read conversation messages"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages as themselves"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update read status"
  ON messages FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_members
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can read all notifications"
  ON notifications FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update last_message_at on conversation
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- =============================================
-- SEED DATA - Default Questions
-- =============================================

INSERT INTO questions (text, subtitle, type, options, order_index, is_active) VALUES
('What does a perfect morning look like to you?', 'Take your time. There is no wrong answer.', 'text', NULL, 1, true),
('How do you feel about the little things in life?', 'Sunsets, coffee, handwritten notes...', 'choice', '["They mean everything to me","I appreciate them sometimes","I prefer grand gestures","I haven''t thought about it much"]', 2, true),
('If we could spend one day anywhere in the world together, where would you choose?', 'Dream freely.', 'text', NULL, 3, true),
('What kind of love story speaks to your heart?', null, 'choice', '["Slow-burning and steady","Passionate and intense","Quiet and domestic","An unexpected adventure"]', 4, true),
('How important is honesty to you in a relationship?', 'On a scale of 1 to 10.', 'scale', NULL, 5, true),
('Is there something you have always wanted someone to truly understand about you?', 'You do not have to share anything you are not comfortable with.', 'text', NULL, 6, true),
('Would you let me court you?', 'This is the question I have been working up the courage to ask.', 'choice', '["Yes, I would like that","I''m open to it","I need more time","I''m not sure yet"]', 7, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- ENABLE REALTIME
-- =============================================
-- Run this to enable realtime on tables:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
`;

export function SetupBanner() {
  const [showSQL, setShowSQL] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (dismissed) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_MIGRATION).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 shadow-sm"
      >
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">Setup Required</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Set <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> environment variables, then run the SQL migration in your Supabase project.
              </p>
              <button
                onClick={() => setShowSQL(!showSQL)}
                className="mt-1.5 text-xs text-amber-700 underline flex items-center gap-1"
              >
                {showSQL ? 'Hide' : 'Show'} SQL Migration
                {showSQL ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <AnimatePresence>
                {showSQL && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="relative">
                      <pre className="text-xs bg-stone-900 text-green-400 p-3 rounded-lg overflow-auto max-h-64 font-mono">
                        {SQL_MIGRATION}
                      </pre>
                      <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 text-xs bg-stone-700 hover:bg-stone-600 text-white px-2 py-1 rounded"
                      >
                        {copied ? '✓ Copied' : 'Copy SQL'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-amber-500 hover:text-amber-700 shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
