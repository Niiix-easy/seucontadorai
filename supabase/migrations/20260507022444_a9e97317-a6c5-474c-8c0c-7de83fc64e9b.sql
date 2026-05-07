-- Corrigindo avisos do linter definindo search_path
ALTER FUNCTION public.generate_nfe_access_key(TEXT, TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.trg_nfe_access_key() SET search_path = public;