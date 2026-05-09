-- Track dead-letter notification queue
CREATE TABLE IF NOT EXISTS public.dead_letter_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.processed_documents(id) ON DELETE CASCADE,
    cstat TEXT,
    xmotivo TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, error
    channels TEXT[], -- ['email', 'push']
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Suspension states per UF and environment
CREATE TABLE IF NOT EXISTS public.fiscal_suspension_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    uf CHAR(2) NOT NULL,
    environment TEXT NOT NULL,
    is_suspended BOOLEAN DEFAULT false,
    consecutive_failures INTEGER DEFAULT 0,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, uf, environment)
);

-- Add global settings for reactivation
ALTER TABLE public.fiscal_configurations 
ADD COLUMN IF NOT EXISTS auto_retry_on_reactivation BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reactivation_throughput INTEGER DEFAULT 5;

-- Enable RLS
ALTER TABLE public.dead_letter_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_suspension_states ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "Users can view their own dead-letter notifications" ON public.dead_letter_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own suspension states" ON public.fiscal_suspension_states FOR SELECT USING (auth.uid() = user_id);

-- Fix search path for previously created function
ALTER FUNCTION public.reset_fiscal_suspension() SET search_path = public;