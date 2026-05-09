-- Add missing columns to processed_documents
ALTER TABLE public.processed_documents 
ADD COLUMN IF NOT EXISTS uf CHAR(2) DEFAULT 'SP',
ADD COLUMN IF NOT EXISTS environment TEXT DEFAULT 'homologacao';

-- Add is_paused to fiscal_configurations
ALTER TABLE public.fiscal_configurations 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Add is_paused to fiscal_suspension_states
ALTER TABLE public.fiscal_suspension_states 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- Ensure constraints for environment
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'processed_documents_environment_check') THEN
        ALTER TABLE public.processed_documents ADD CONSTRAINT processed_documents_environment_check CHECK (environment IN ('homologacao', 'producao'));
    END IF;
END $$;
