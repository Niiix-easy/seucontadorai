ALTER TABLE public.fiscal_export_logs 
ADD COLUMN csv_hash TEXT,
ADD COLUMN pdf_hash TEXT,
ADD COLUMN validation_divergence BOOLEAN DEFAULT FALSE,
ADD COLUMN technical_log_url TEXT;

-- Update existing records
UPDATE public.fiscal_export_logs SET validation_divergence = FALSE WHERE validation_divergence IS NULL;