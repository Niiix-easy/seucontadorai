-- Table to track summary events for grouping multiple dead letters if they happen fast
CREATE TABLE IF NOT EXISTS public.dead_letter_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_summary TEXT,
  cstat_summary TEXT[], -- List of cStats in this summary
  document_ids UUID[],
  status TEXT DEFAULT 'pending', -- pending, sent, error
  channels TEXT[], -- ['email', 'push']
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Policy for dead_letter_summaries
ALTER TABLE public.dead_letter_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own dead letter summaries" ON public.dead_letter_summaries FOR SELECT USING (auth.uid() = user_id);

-- Link notifications to summaries if we want to group them
ALTER TABLE public.dead_letter_notifications ADD COLUMN IF NOT EXISTS summary_id UUID REFERENCES public.dead_letter_summaries(id);
