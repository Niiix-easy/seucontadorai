-- Add more status options to processed_documents if not already there
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'document_status' AND e.enumlabel = 'failed_permanently') THEN
        ALTER TYPE document_status ADD VALUE 'failed_permanently';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Type doesn't exist, we'll create it or handle it in the table definition
        NULL;
END $$;

-- Add config fields for retries
ALTER TABLE public.fiscal_configurations 
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS retry_delay_minutes INTEGER DEFAULT 15;

-- Add a column to track if a document is currently being processed by the worker to avoid double processing
ALTER TABLE public.processed_documents
ADD COLUMN IF NOT EXISTS is_processing BOOLEAN DEFAULT false;

-- Add index for the worker to find documents efficiently
CREATE INDEX IF NOT EXISTS idx_docs_to_retry ON public.processed_documents (status, next_retry_at) 
WHERE status = 'error' OR status = 'pending';
