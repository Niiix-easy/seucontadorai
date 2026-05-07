-- Revoga permissão de execução pública (anon/authenticated) para as funções SECURITY DEFINER
-- Isso força o uso apenas em contextos controlados (triggers ou chamadas diretas com role adequada)

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- O linter do Supabase geralmente reclama de funções que podem ser chamadas via API REST/PostgREST
-- Ao revogar o EXECUTE para roles anon e authenticated, resolvemos os avisos 0028 e 0029.
