ALTER TABLE public.fiscal_export_logs 
ADD COLUMN zip_hash TEXT,
ADD COLUMN expected_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN audit_events JSONB DEFAULT '[]'::jsonb;

-- Update RLS policies if necessary (usually not needed if already enabled for the table)
