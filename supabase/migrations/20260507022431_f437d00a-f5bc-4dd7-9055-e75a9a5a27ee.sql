-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para notificações
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Função para gerar chave de acesso NF-e (mock simplificado do padrão SEFAZ)
-- Padrão: UF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + numero(9) + tpEmis(1) + cNF(8) + cDV(1)
CREATE OR REPLACE FUNCTION public.generate_nfe_access_key(
  p_uf TEXT,
  p_cnpj TEXT,
  p_serie TEXT,
  p_numero TEXT
) RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_cnpj_clean TEXT;
  v_serie_pad TEXT;
  v_numero_pad TEXT;
  v_cnf TEXT;
  v_key_base TEXT;
BEGIN
  v_date := to_char(now(), 'YYMM');
  v_cnpj_clean := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  -- Padding CNPJ para 14 dígitos
  v_cnpj_clean := lpad(v_cnpj_clean, 14, '0');
  v_serie_pad := lpad(p_serie, 3, '0');
  v_numero_pad := lpad(p_numero, 9, '0');
  -- Código numérico aleatório (8 dígitos)
  v_cnf := floor(random() * 90000000 + 10000000)::text;
  
  -- UF fixo 35 (SP) se não vier mapeado corretamente para código IBGE no mock
  v_key_base := '35' || v_date || v_cnpj_clean || '55' || v_serie_pad || v_numero_pad || '1' || v_cnf;
  
  -- Digito verificador (simplificado para o mock: último dígito do random)
  RETURN v_key_base || floor(random() * 10)::text;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar chave de acesso se estiver nula
CREATE OR REPLACE FUNCTION public.trg_nfe_access_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chave_acesso IS NULL THEN
    NEW.chave_acesso := public.generate_nfe_access_key(
      COALESCE(NEW.uf_destino, 'SP'),
      COALESCE(NEW.cnpj_emitente, '00000000000000'),
      NEW.serie,
      NEW.numero
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nfe_before_insert_key
BEFORE INSERT ON public.nfe_emitidas
FOR EACH ROW
EXECUTE FUNCTION public.trg_nfe_access_key();