-- Remove old constraint
ALTER TABLE public.fiscal_configurations DROP CONSTRAINT IF EXISTS fiscal_configurations_user_id_key;

-- Add new unique constraint
ALTER TABLE public.fiscal_configurations ADD CONSTRAINT fiscal_configurations_user_id_uf_env_key UNIQUE (user_id, uf, environment);
