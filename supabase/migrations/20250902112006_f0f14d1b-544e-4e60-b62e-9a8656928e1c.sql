-- Fix security for tradeline_analytics view
-- Since tradeline_analytics is a view based on the tradelines table,
-- and tradelines already has proper RLS policies, the view inherits that security.
-- However, we need to ensure the view respects RLS by making it a security invoker view.

-- Drop the existing view
DROP VIEW IF EXISTS public.tradeline_analytics;

-- Recreate the view with explicit security invoker behavior
-- This ensures the view respects the RLS policies of the underlying tradelines table
CREATE VIEW public.tradeline_analytics 
WITH (security_invoker = true)
AS
SELECT 
    tradelines.user_id,
    tradelines.credit_bureau,
    tradelines.extraction_method,
    count(*) AS total_tradelines,
    count(*) FILTER (WHERE (tradelines.is_negative = true)) AS negative_tradelines,
    count(*) FILTER (WHERE (tradelines.duplicate_of IS NOT NULL)) AS duplicates_found,
    avg(tradelines.similarity_score) FILTER (WHERE (tradelines.similarity_score IS NOT NULL)) AS avg_similarity_score,
    min(tradelines.created_at) AS first_processed,
    max(tradelines.created_at) AS last_processed
FROM tradelines
GROUP BY tradelines.user_id, tradelines.credit_bureau, tradelines.extraction_method;