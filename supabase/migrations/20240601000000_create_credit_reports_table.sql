-- 20240601000000_create_credit_reports_table.sql
CREATE TABLE credit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    encrypted_content BYTEA NOT NULL,
    encryption_key_id TEXT NOT NULL,
    report_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE credit_reports IS 'FCRA-compliant credit report storage';
COMMENT ON COLUMN credit_reports.encrypted_content IS 'AES-256-GCM encrypted report content';