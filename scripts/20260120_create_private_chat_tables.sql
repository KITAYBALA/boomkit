-- Tables for Private and Group Chat system

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT, -- Null for 1:1, string for group
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id) -- ID of the creator
);

-- 2. Conversation Members table
CREATE TABLE IF NOT EXISTS conversation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

-- 3. Direct Messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES users(id),
    sender_username TEXT NOT NULL,
    message TEXT NOT NULL,
    inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Conversations: Only members or Owner can see/interact
CREATE POLICY "Members can see their conversations" ON conversations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'owner')
);

CREATE POLICY "Anyone can create a conversation" ON conversations
FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- Conversation Members
CREATE POLICY "Members can see other members in their chats" ON conversation_members
FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members sub WHERE sub.conversation_id = conversation_members.conversation_id AND sub.user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'owner')
);

CREATE POLICY "Creator can add members" ON conversation_members
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND created_by = auth.uid()::text)
    OR auth.uid()::text = user_id -- Allow self-join on creation
);

-- Direct Messages
CREATE POLICY "Members can read messages" ON direct_messages
FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'owner')
);

CREATE POLICY "Members can send messages" ON direct_messages
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = conversation_id AND user_id = auth.uid()::text)
);
