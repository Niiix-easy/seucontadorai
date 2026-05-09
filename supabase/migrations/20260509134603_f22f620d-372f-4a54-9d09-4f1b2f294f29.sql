-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the retry worker to run every 15 minutes
-- Replace <PROJECT_REF> with the actual project ref or use a placeholder
-- For Lovable Cloud, we can use the local net.http_post
SELECT cron.schedule(
  'fiscal-retry-worker',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/fiscal-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claim.role', true) || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
