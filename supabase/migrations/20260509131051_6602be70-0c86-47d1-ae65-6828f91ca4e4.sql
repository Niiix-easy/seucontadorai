-- Add retry and error tracking to processed_documents
ALTER TABLE public.processed_documents 
ADD COLUMN retry_count INT DEFAULT 0,
ADD COLUMN last_error TEXT,
ADD COLUMN next_retry_at TIMESTAMP WITH TIME ZONE;

-- Add encrypted password field to fiscal_configurations
-- We use a dedicated field for the encrypted version to avoid confusion with hashes
ALTER TABLE public.fiscal_configurations
ADD COLUMN certificate_password_encrypted TEXT;

-- Index for the background worker to find documents needing retry
CREATE INDEX idx_processed_docs_retry ON public.processed_documents (status, next_retry_at) 
WHERE status = 'error' OR status = 'pending';
