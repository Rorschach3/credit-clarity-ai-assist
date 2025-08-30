-- Fix critical security vulnerability: Add RLS policies to tradeline_analytics table
-- This table contains sensitive user credit analysis data that was completely unprotected

-- Enable Row Level Security on tradeline_analytics table
ALTER TABLE public.tradeline_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own analytics data
CREATE POLICY "Users can view their own tradeline analytics"
ON public.tradeline_analytics
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own analytics data
CREATE POLICY "Users can insert their own tradeline analytics"
ON public.tradeline_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own analytics data
CREATE POLICY "Users can update their own tradeline analytics"
ON public.tradeline_analytics
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to delete their own analytics data
CREATE POLICY "Users can delete their own tradeline analytics"
ON public.tradeline_analytics
FOR DELETE
USING (auth.uid() = user_id);