-- Fix critical RLS security vulnerabilities

-- 1. Fix conflicting and overly permissive policies on profiles table
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create consistent, secure policies for profiles table
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix overly permissive dispute_letter policies
DROP POLICY IF EXISTS "Allow authenticated users to delete their own dispute letters" ON public.dispute_letter;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own dispute letters" ON public.dispute_letter;
DROP POLICY IF EXISTS "Allow authenticated users to update their own dispute letters" ON public.dispute_letter;

-- Replace with secure user-specific policies
CREATE POLICY "Users can insert their own dispute letters"
ON public.dispute_letter
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dispute letters"
ON public.dispute_letter
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dispute letters"
ON public.dispute_letter
FOR DELETE
USING (auth.uid() = user_id);