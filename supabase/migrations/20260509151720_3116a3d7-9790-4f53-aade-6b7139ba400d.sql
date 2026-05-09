-- Add throughput column to suspension states for granular control per UF/Env
ALTER TABLE public.fiscal_suspension_states 
ADD COLUMN IF NOT EXISTS throughput_per_minute INTEGER DEFAULT 5;

-- Enhance dead_letter_notifications for better reporting and summary
ALTER TABLE public.dead_letter_notifications
ADD COLUMN IF NOT EXISTS retry_count_at_failure INTEGER,
ADD COLUMN IF NOT EXISTS last_xml_url TEXT,
ADD COLUMN IF NOT EXISTS last_receipt_number TEXT;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_dead_letter_notifs_cstat ON public.dead_letter_notifications(cstat);
CREATE INDEX IF NOT EXISTS idx_dead_letter_notifs_created ON public.dead_letter_notifications(created_at);
