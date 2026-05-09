-- Ativar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remover job anterior se existir de forma segura
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fiscal-retry-job') THEN
        PERFORM cron.unschedule('fiscal-retry-job');
    END IF;
END $$;

-- Agendar novo job para rodar a cada 1 minuto
SELECT cron.schedule(
  'fiscal-retry-job',
  '* * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ghvfzwehyysldzxuvhez.supabase.co/functions/v1/fiscal-scheduler',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM (SELECT current_setting('app.settings.service_role_key', true) as value) s WHERE value IS NOT NULL)
      ),
      body:=jsonb_build_object()
    ) as request_id;
  $$
);