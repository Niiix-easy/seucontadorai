-- Create enum for SEFAZ environments
CREATE TYPE public.sefaz_environment AS ENUM ('homologacao', 'producao');

-- Table for Fiscal Configurations
CREATE TABLE public.fiscal_configurations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uf CHAR(2) NOT NULL,
    environment public.sefaz_environment NOT NULL DEFAULT 'homologacao',
    certificate_filename TEXT,
    certificate_path TEXT, -- Path in Supabase Storage
    certificate_password_hash TEXT, -- Encrypted or hashed if necessary, but usually used in edge functions
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Table for Processed Documents (NF-e, etc)
CREATE TABLE public.processed_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g., 'NF-e'
    xml_content TEXT NOT NULL,
    signed_xml_content TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, signed, sent, authorized, rejected, error
    sefaz_response_code TEXT,
    sefaz_response_message TEXT,
    receipt_number TEXT,
    protocol_number TEXT,
    processing_log JSONB DEFAULT '[]'::jsonb,
    period_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Policies for fiscal_configurations
CREATE POLICY "Users can manage their own fiscal config"
ON public.fiscal_configurations
FOR ALL
USING (auth.uid() = user_id);

-- Policies for processed_documents
CREATE POLICY "Users can manage their own documents"
ON public.processed_documents
FOR ALL
USING (auth.uid() = user_id);

-- Create bucket for certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Storage policies for certificates
CREATE POLICY "Users can upload their own certificates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own certificates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fiscal_configurations_updated_at
BEFORE UPDATE ON public.fiscal_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processed_documents_updated_at
BEFORE UPDATE ON public.processed_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
