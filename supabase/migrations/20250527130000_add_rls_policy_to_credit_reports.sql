-- Enable Row Level Security on credit_reports table
ALTER TABLE credit_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert their own credit reports
CREATE POLICY "Allow authenticated users to insert their own credit reports"
ON credit_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);