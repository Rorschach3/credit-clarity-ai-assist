-- Fix critical security vulnerability: Add RLS policies to tradeline_analytics table
-- This table contains sensitive credit analysis data that must be restricted to the user who owns it

-- Enable Row Level Security on tradeline_analytics table
ALTER TABLE public.tradeline_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view only their own credit analytics data
CREATE POLICY "Users can view their own tradeline analytics"
ON public.tradeline_analytics
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to insert their own credit analytics data
CREATE POLICY "Users can insert their own tradeline analytics"
ON public.tradeline_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own credit analytics data
CREATE POLICY "Users can update their own tradeline analytics"
ON public.tradeline_analytics
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own credit analytics data
CREATE POLICY "Users can delete their own tradeline analytics"
ON public.tradeline_analytics
FOR DELETE
USING (auth.uid() = user_id);