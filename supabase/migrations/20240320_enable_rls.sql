-- Row Level Security (RLS) Configuration Script
-- Target: All existing tables in the public schema
-- Logic: Default-deny with owner-based access patterns

-- 1. Enable RLS on all existing tables in the 'public' schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
        RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
    END LOOP;
END $$;

-- 2. Drop existing policies to ensure a clean, controlled state
-- WARNING: This will remove any custom policies already in place.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename) || ';';
    END LOOP;
END $$;

-- 3. Specific Policies for Chat Application Tables (if they exist)

-- profiles table: Users can manage their own profile
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);';
        EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);';
        EXECUTE 'CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);';
    END IF;
END $$;

-- conversations table: Users can manage their own conversations
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
        EXECUTE 'CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);';
        EXECUTE 'CREATE POLICY "Users can create their own conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);';
        EXECUTE 'CREATE POLICY "Users can update their own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);';
        EXECUTE 'CREATE POLICY "Users can delete their own conversations" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);';
    END IF;
END $$;

-- messages table: Users can view/create messages in their own conversations
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
        EXECUTE 'CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT TO authenticated USING (
            EXISTS (
                SELECT 1 FROM public.conversations
                WHERE public.conversations.id = public.messages.conversation_id
                AND public.conversations.user_id = auth.uid()
            )
        );';
        EXECUTE 'CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.conversations
                WHERE public.conversations.id = public.messages.conversation_id
                AND public.conversations.user_id = auth.uid()
            )
        );';
    END IF;
END $$;

-- 4. Dynamic Discovery for other tables
-- Apply a standard owner-access policy for any other table containing 'user_id', 'owner_id', or 'created_by' columns.
DO $$
DECLARE
    r RECORD;
    col_name TEXT;
BEGIN
    FOR r IN (
        SELECT DISTINCT t.table_name
        FROM information_schema.tables t
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT IN ('profiles', 'conversations', 'messages')
    ) LOOP
        -- Check for common owner columns
        SELECT column_name INTO col_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = r.table_name
        AND column_name IN ('user_id', 'owner_id', 'created_by')
        LIMIT 1;

        IF col_name IS NOT NULL THEN
            EXECUTE 'CREATE POLICY "Allow owner access based on ' || col_name || '" ON public.' || quote_ident(r.table_name) || ' FOR ALL TO authenticated USING (auth.uid() = ' || quote_ident(col_name) || ');';
            RAISE NOTICE 'Applied owner access policy to table: % using column: %', r.table_name, col_name;
        ELSE
            RAISE WARNING 'Table % has no recognized owner column (user_id, owner_id, created_by). RLS enabled but no permissive policies applied.', r.table_name;
        END IF;
    END LOOP;
END $$;

-- 5. Force RLS for all tables (even for table owners/postgres role if applicable in some contexts)
-- This is a safety measure to ensure RLS is always active.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' FORCE ROW LEVEL SECURITY;';
    END LOOP;
END $$;
