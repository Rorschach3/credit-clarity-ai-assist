-- Fix critical security vulnerability: Remove overly permissive dispute_letter policies
-- Keep only the secure user-specific policy

-- Drop the overly permissive policies that use 'true' conditions
DROP POLICY IF EXISTS "Allow authenticated users to delete their own dispute letters" ON public.dispute_letter;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own dispute letters" ON public.dispute_letter;
DROP POLICY IF EXISTS "Allow authenticated users to update their own dispute letters" ON public.dispute_letter;

-- The secure policy "Users can manage their own dispute letters" with (auth.uid() = user_id) condition
-- is already in place and will remain to ensure proper user-specific access control