
-- Tabela de certificados digitais
CREATE TABLE public.certificados_digitais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'A1',
  cnpj TEXT,
  razao_social TEXT,
  validade DATE,
  status TEXT NOT NULL DEFAULT 'valido',
  emissor TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certificados_digitais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own certificados" ON public.certificados_digitais
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela de NF-e emitidas
CREATE TABLE public.nfe_emitidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero TEXT NOT NULL,
  serie TEXT NOT NULL DEFAULT '1',
  chave_acesso TEXT,
  cnpj_emitente TEXT,
  cnpj_destinatario TEXT,
  razao_destinatario TEXT,
  natureza_operacao TEXT,
  uf_destino TEXT,
  valor_produtos NUMERIC NOT NULL DEFAULT 0,
  valor_icms NUMERIC NOT NULL DEFAULT 0,
  valor_ipi NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'autorizada',
  integrador TEXT,
  info_complementares TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nfe_emitidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own nfe" ON public.nfe_emitidas
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela de itens da NF-e
CREATE TABLE public.nfe_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nfe_id UUID NOT NULL REFERENCES public.nfe_emitidas(id) ON DELETE CASCADE,
  numero_item INTEGER NOT NULL DEFAULT 1,
  descricao TEXT NOT NULL,
  ncm TEXT,
  cfop TEXT,
  unidade TEXT NOT NULL DEFAULT 'UN',
  quantidade NUMERIC NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  icms_aliquota NUMERIC NOT NULL DEFAULT 0,
  ipi_aliquota NUMERIC NOT NULL DEFAULT 0,
  pis_aliquota NUMERIC NOT NULL DEFAULT 0,
  cofins_aliquota NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.nfe_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage nfe itens via nfe" ON public.nfe_itens
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.nfe_emitidas WHERE id = nfe_itens.nfe_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.nfe_emitidas WHERE id = nfe_itens.nfe_id AND user_id = auth.uid())
  );

-- Tabela de transações bancárias
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  banco TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'credito',
  classificado BOOLEAN NOT NULL DEFAULT false,
  conta_contabil TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bank transactions" ON public.bank_transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tabela de contas bancárias
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  codigo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Extrato OFX',
  status TEXT NOT NULL DEFAULT 'pendente',
  ultima_sinc TIMESTAMP WITH TIME ZONE,
  saldo NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own bank accounts" ON public.bank_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER update_certificados_updated_at BEFORE UPDATE ON public.certificados_digitais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
