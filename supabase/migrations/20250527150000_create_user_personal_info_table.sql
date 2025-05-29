-- Migration to create user_personal_info table
CREATE TABLE IF NOT EXISTS public.user_personal_info (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  phone text,
  email text NOT NULL,
  ssn_last_four text,
  updated_at timestamp with time zone DEFAULT now()
);