-- Create audit log table
CREATE TABLE IF NOT EXISTS public.fiscal_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'pause', 'resume', 'suspend', 'reactivate', 'manual_retry'
    uf TEXT NOT NULL,
    environment TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_action_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own fiscal action logs"
ON public.fiscal_action_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fiscal action logs"
ON public.fiscal_action_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure fiscal_suspension_states has reason column
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fiscal_suspension_states' AND column_name='reason') THEN
        ALTER TABLE public.fiscal_suspension_states ADD COLUMN reason TEXT;
    END IF;
END $$;

-- Enable Realtime for key monitoring tables
-- Note: This is usually done via publication 'supabase_realtime'
-- If it doesn't exist, we skip or it might error, but in Lovable we typically manage this.
-- We can add tables to the publication.
ALTER PUBLICATION supabase_realtime ADD TABLE public.processed_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fiscal_suspension_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dead_letter_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fiscal_action_logs;
