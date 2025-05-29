-- Create initial disputes table
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users NOT NULL,
    credit_report_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('pending', 'under_review', 'resolved')),
    mailing_address TEXT NOT NULL
);

COMMENT ON TABLE disputes IS 'Main table for tracking credit report disputes';
COMMENT ON COLUMN disputes.mailing_address IS 'Encrypted PII field for user mailing address';