-- Migration: Secure Private Chats
-- Enables RLS on conversations, conversation_members, and direct_messages
-- Relies on default-deny for anonymous/authenticated roles
-- All access will be routed through server-side APIs utilizing the Service Role Key

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Drop any potentially permissive policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.conversations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Public access to conversations" ON public.conversations;
DROP POLICY IF EXISTS "Public access to conversation_members" ON public.conversation_members;
DROP POLICY IF EXISTS "Public access to direct_messages" ON public.direct_messages;
