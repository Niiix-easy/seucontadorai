
CREATE TABLE public.token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  model text,
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  cost_estimate numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token usage" ON public.token_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token usage" ON public.token_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all token usage" ON public.token_usage
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_token_usage_user ON public.token_usage(user_id);
CREATE INDEX idx_token_usage_created ON public.token_usage(created_at);
