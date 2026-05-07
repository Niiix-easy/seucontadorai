-- Corrigindo as funções SECURITY DEFINER com search_path explícito (resolvendo avisos do linter)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;

-- Garantindo que a tabela de notificações suporte as novas funcionalidades
-- (A tabela notifications já existe no Lovable Cloud, mas vamos garantir as colunas necessárias)

DO $$ 
BEGIN
    -- Adiciona coluna de link se não existir
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notifications' AND COLUMN_NAME = 'link') THEN
        ALTER TABLE public.notifications ADD COLUMN link TEXT;
    END IF;

    -- Adiciona coluna metadata para filtros específicos se necessário
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notifications' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Cria índice para performance no contador de não lidas do dashboard
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE (read = false);

-- Garante que RLS está habilitado e políticas estão corretas
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para ver apenas as próprias notificações
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Política para atualizar o status de lida
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
