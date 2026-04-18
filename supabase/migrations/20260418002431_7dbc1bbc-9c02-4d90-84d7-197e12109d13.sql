-- Tabela de notas fiscais de serviço (NFS-e)
CREATE TABLE public.nfse_emitidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  codigo_verificacao TEXT,
  cnpj_prestador TEXT,
  razao_prestador TEXT,
  cnpj_tomador TEXT,
  razao_tomador TEXT,
  municipio_prestacao TEXT,
  codigo_servico TEXT,
  discriminacao TEXT NOT NULL,
  valor_servicos NUMERIC NOT NULL DEFAULT 0,
  valor_deducoes NUMERIC NOT NULL DEFAULT 0,
  base_calculo NUMERIC NOT NULL DEFAULT 0,
  iss_aliquota NUMERIC NOT NULL DEFAULT 0,
  iss_valor NUMERIC NOT NULL DEFAULT 0,
  pis_valor NUMERIC NOT NULL DEFAULT 0,
  cofins_valor NUMERIC NOT NULL DEFAULT 0,
  inss_valor NUMERIC NOT NULL DEFAULT 0,
  ir_valor NUMERIC NOT NULL DEFAULT 0,
  csll_valor NUMERIC NOT NULL DEFAULT 0,
  valor_liquido NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'autorizada',
  data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nfse_emitidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nfse"
ON public.nfse_emitidas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_nfse_emitidas_updated_at
BEFORE UPDATE ON public.nfse_emitidas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar client_id e data_emissao em nfe_emitidas
ALTER TABLE public.nfe_emitidas 
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS data_emissao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();