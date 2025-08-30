-- Fix critical security vulnerability: Secure tradeline_analytics view
-- Since this is a view, we need to recreate it with proper security context
-- The view aggregates sensitive user financial data and must respect user boundaries

-- Drop the existing view
DROP VIEW IF EXISTS public.tradeline_analytics;

-- Recreate the view with explicit security context
-- This ensures the view respects RLS policies from the underlying tradelines table
CREATE VIEW public.tradeline_analytics 
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
    tradelines.user_id,
    tradelines.credit_bureau,
    tradelines.extraction_method,
    count(*) AS total_tradelines,
    count(*) FILTER (WHERE tradelines.is_negative = true) AS negative_tradelines,
    count(*) FILTER (WHERE tradelines.duplicate_of IS NOT NULL) AS duplicates_found,
    avg(tradelines.similarity_score) FILTER (WHERE tradelines.similarity_score IS NOT NULL) AS avg_similarity_score,
    min(tradelines.created_at) AS first_processed,
    max(tradelines.created_at) AS last_processed
FROM tradelines
GROUP BY tradelines.user_id, tradelines.credit_bureau, tradelines.extraction_method;

-- Add comment explaining the security model
COMMENT ON VIEW public.tradeline_analytics IS 'Aggregated tradeline analytics - security enforced through underlying tradelines table RLS policies';