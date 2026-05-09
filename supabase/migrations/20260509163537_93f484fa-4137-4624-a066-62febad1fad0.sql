-- Table for tracking scheduled export executions
CREATE TABLE public.fiscal_export_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_id UUID REFERENCES public.fiscal_scheduled_reports(id) ON DELETE SET NULL,
    report_type TEXT NOT NULL, -- 'backlog' or 'audit'
    format TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error'
    error_message TEXT,
    recipients TEXT[] NOT NULL,
    filters JSONB NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_export_logs ENABLE ROW LEVEL SECURITY;

-- Policies for fiscal_export_logs
CREATE POLICY "Users can view their own export logs"
ON public.fiscal_export_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own export logs"
ON public.fiscal_export_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for filtering
CREATE INDEX idx_fiscal_export_logs_user_date ON public.fiscal_export_logs(user_id, created_at DESC);