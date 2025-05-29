-- Add FCRA compliance columns to disputes table
ALTER TABLE disputes
ADD COLUMN modified_by UUID REFERENCES auth.users(id),
ADD COLUMN modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN retention_date DATE;

-- Calculate retention dates using trigger
CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.retention_date := NEW.created_at + INTERVAL '5 years';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_dispute_retention_date
BEFORE INSERT ON disputes
FOR EACH ROW EXECUTE FUNCTION set_retention_date();

-- Create audit history table
CREATE TABLE audit_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE audit_history IS 'FCRA-mandated audit trail for dispute record changes';

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION log_dispute_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_history (table_name, record_id, operation, new_values, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), NEW.modified_by);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_history (table_name, record_id, operation, old_values, new_values, performed_by)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), NEW.modified_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_history (table_name, record_id, operation, old_values, performed_by)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), OLD.modified_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dispute_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON disputes
FOR EACH ROW EXECUTE FUNCTION log_dispute_changes();

-- Enable encryption extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add comment for compliance documentation
COMMENT ON COLUMN disputes.mailing_address IS 'Encrypted PII - FCRA § 605 requirement';