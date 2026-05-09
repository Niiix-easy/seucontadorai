-- First, unschedule if it exists
SELECT cron.unschedule('fiscal-retry-worker');

-- Re-schedule with actual values
SELECT cron.schedule(
    'fiscal-retry-worker',
    '*/5 * * * *',
    $$ SELECT net.http_post(
        url := 'https://ghvfzwehyysldzxuvhez.supabase.co/functions/v1/fiscal-worker',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodmZ6d2VoeXlzbGR6eHV2aGV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4NDAxMywiZXhwIjoyMDkwNDYwMDEzfQ.MVtLHGmgQY3hBVzKFvfDHbv-Aj1Q72gWynWAxOvUf0A"}'::jsonb
    ) $$
);
