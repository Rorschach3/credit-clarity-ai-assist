-- Fix the remaining security issues from the linter

-- 1. Add RLS policies for test tables that now have RLS enabled but no policies
CREATE POLICY "Users can manage their own experian test data" 
ON public.experian_test 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tradeline test data" 
ON public.tradeline_test 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Fix function search paths for security
ALTER FUNCTION public.has_role(check_role text) SET search_path = '';
ALTER FUNCTION public.log_credit_transaction() SET search_path = '';
ALTER FUNCTION public.fetch_tradelines() SET search_path = '';
ALTER FUNCTION public.update_user_profile_timestamp() SET search_path = '';
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SET search_path = '';
ALTER FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer, filter jsonb) SET search_path = '';
ALTER FUNCTION public.update_last_modified() SET search_path = '';
ALTER FUNCTION public.prevent_inactive_update() SET search_path = '';
ALTER FUNCTION public.log_dispute_changes() SET search_path = '';
ALTER FUNCTION public.handle_new_user_role() SET search_path = '';
ALTER FUNCTION public.can_upload_dispute_packet(userid uuid) SET search_path = '';
ALTER FUNCTION public.set_retention_date() SET search_path = '';
ALTER FUNCTION public.parse_flexible_date(p_date_string text) SET search_path = '';
ALTER FUNCTION public.calculate_tradeline_similarity(creditor1 text, account1 text, date1 text, bureau1 text, creditor2 text, account2 text, date2 text, bureau2 text) SET search_path = '';