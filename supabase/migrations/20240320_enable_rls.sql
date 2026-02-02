-- Migration: Enable Row Level Security and implement owner-based policies
-- This script follows a "default-deny" posture.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Enable RLS on all tables in the public schema and FORCE it.
    -- FORCE RLS ensures that even table owners (if they are not superusers)
    -- are subject to RLS policies.
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tablename);
    END LOOP;

    -- 2. Clean up existing permissive policies to ensure a fresh start.
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. Default-Deny: Revoke all from anon role.
-- This ensures that if RLS is accidentally disabled, the anon role still has no access.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 4. Grant limited access to authenticated role.
-- Authenticated users need to be able to interact with the tables, but RLS will filter the rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 5. SPECIFIC POLICIES

-- PROFILES: Users can only see and edit their own profile.
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- CONVERSATIONS: Users can only see and manage conversations they created.
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- MESSAGES: Users can only see and manage messages in their conversations.
-- This policy assumes messages table has a user_id or we check via the conversation_id.
-- If messages has user_id:
CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Note: In a production scenario with shared conversations, the MESSAGES policy
-- would join on the conversations table to check membership.
-- For this implementation, we enforce direct ownership.
