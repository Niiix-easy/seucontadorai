-- Add notification columns
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS dead_letter_alerts_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dead_letter_alerts_push BOOLEAN DEFAULT true;

-- Add suspension columns to fiscal_configurations
ALTER TABLE public.fiscal_configurations
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consecutive_validation_failures INTEGER DEFAULT 0;

-- Function to reset suspension when configuration is manually updated
CREATE OR REPLACE FUNCTION reset_fiscal_suspension()
RETURNS TRIGGER AS $$
BEGIN
    NEW.is_suspended = false;
    NEW.consecutive_validation_failures = 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reactivate when user modifies settings
CREATE TRIGGER tr_reset_fiscal_suspension
BEFORE UPDATE ON public.fiscal_configurations
FOR EACH ROW
WHEN (
    OLD.uf IS DISTINCT FROM NEW.uf OR 
    OLD.environment IS DISTINCT FROM NEW.environment OR 
    OLD.certificate_path IS DISTINCT FROM NEW.certificate_path OR
    OLD.certificate_password_encrypted IS DISTINCT FROM NEW.certificate_password_encrypted
)
EXECUTE FUNCTION reset_fiscal_suspension();