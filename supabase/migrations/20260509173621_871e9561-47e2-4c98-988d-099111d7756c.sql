ALTER TABLE public.fiscal_export_logs 
ADD COLUMN csv_count INTEGER DEFAULT 0,
ADD COLUMN pdf_count INTEGER DEFAULT 0,
ADD COLUMN technical_log JSONB DEFAULT '{}',
ADD COLUMN stage_counts JSONB DEFAULT '{}',
ADD COLUMN full_error_details TEXT,
ADD COLUMN resend_status TEXT;

-- Update existing records if any
UPDATE public.fiscal_export_logs 
SET csv_count = record_count, pdf_count = record_count 
WHERE record_count IS NOT NULL AND csv_count = 0;