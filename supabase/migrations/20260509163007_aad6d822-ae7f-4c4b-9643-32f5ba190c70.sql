-- Table for user preferences (saved filters)
CREATE TABLE public.fiscal_user_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    preference_key TEXT NOT NULL, -- 'backlog_filters' or 'audit_filters'
    preference_name TEXT NOT NULL, -- label for the saved filter
    filters JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, preference_key, preference_name)
);

-- Table for scheduled reports
CREATE TABLE public.fiscal_scheduled_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- 'backlog' or 'audit'
    format TEXT NOT NULL, -- 'pdf', 'csv', 'xlsx'
    frequency TEXT NOT NULL, -- 'daily', 'weekly'
    filters JSONB NOT NULL,
    email_recipients TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Policies for fiscal_user_preferences
CREATE POLICY "Users can manage their own preferences"
ON public.fiscal_user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policies for fiscal_scheduled_reports
CREATE POLICY "Users can manage their own scheduled reports"
ON public.fiscal_scheduled_reports
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_fiscal_user_preferences_updated_at
BEFORE UPDATE ON public.fiscal_user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiscal_scheduled_reports_updated_at
BEFORE UPDATE ON public.fiscal_scheduled_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();