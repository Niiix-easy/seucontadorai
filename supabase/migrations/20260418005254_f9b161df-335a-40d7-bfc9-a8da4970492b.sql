-- Add cancellation + correction fields
ALTER TABLE public.nfe_emitidas
  ADD COLUMN IF NOT EXISTS cancelada_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS cce_texto text,
  ADD COLUMN IF NOT EXISTS cce_data timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cce_sequencia integer DEFAULT 0;

ALTER TABLE public.nfse_emitidas
  ADD COLUMN IF NOT EXISTS cancelada_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

-- Events history table
CREATE TABLE IF NOT EXISTS public.nf_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nfe_id uuid REFERENCES public.nfe_emitidas(id) ON DELETE CASCADE,
  nfse_id uuid REFERENCES public.nfse_emitidas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'cancelamento', 'cce', 'denegacao'
  descricao text,
  protocolo text,
  sequencia integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nf_eventos_tipo_check CHECK (tipo IN ('cancelamento','cce','denegacao','reenvio')),
  CONSTRAINT nf_eventos_one_ref CHECK ((nfe_id IS NOT NULL)::int + (nfse_id IS NOT NULL)::int = 1)
);

ALTER TABLE public.nf_eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own nf eventos" ON public.nf_eventos;
CREATE POLICY "Users manage own nf eventos"
ON public.nf_eventos
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nf_eventos_user ON public.nf_eventos(user_id);
CREATE INDEX IF NOT EXISTS idx_nf_eventos_nfe ON public.nf_eventos(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nf_eventos_nfse ON public.nf_eventos(nfse_id);

-- Storage bucket for digital certificates (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificados', 'certificados', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own cert" ON storage.objects;
CREATE POLICY "Users upload own cert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificados' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users read own cert" ON storage.objects;
CREATE POLICY "Users read own cert"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificados' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own cert" ON storage.objects;
CREATE POLICY "Users delete own cert"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificados' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own cert" ON storage.objects;
CREATE POLICY "Users update own cert"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificados' AND auth.uid()::text = (storage.foldername(name))[1]);