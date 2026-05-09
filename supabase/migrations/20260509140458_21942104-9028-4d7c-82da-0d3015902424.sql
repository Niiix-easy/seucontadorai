-- Enable pg_cron if available and create the job
-- This assumes the project has pg_cron enabled
SELECT cron.schedule(
    'fiscal-retry-worker',
    '*/5 * * * *',
    $$ SELECT net.http_post(
        url := (SELECT value FROM (SELECT Deno.env.get('SUPABASE_URL') as value) x) || '/functions/v1/fiscal-worker',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT value FROM (SELECT Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as value) x) || '"}'::jsonb
    ) $$
);
