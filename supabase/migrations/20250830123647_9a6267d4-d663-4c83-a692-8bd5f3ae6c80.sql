-- Enable Row Level Security on all tables that have policies but RLS disabled

-- Check and enable RLS on tables with existing policies
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_report_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Also enable RLS on test tables for consistency
ALTER TABLE public.experian_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradeline_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tradeline_analytics ENABLE ROW LEVEL SECURITY;