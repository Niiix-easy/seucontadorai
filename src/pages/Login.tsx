import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Chrome, ShieldCheck, ArrowLeft, Sparkles, BarChart3, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

const features = [
  { icon: Sparkles, title: "IA Integrada", desc: "Modelos de última geração para automatizar tarefas contábeis" },
  { icon: BarChart3, title: "15+ Módulos", desc: "Contábil, Fiscal, Folha, CRM, BI e muito mais" },
  { icon: Shield, title: "Segurança Total", desc: "Dados criptografados e certificados digitais" },
  { icon: Zap, title: "100% Cloud", desc: "Acesse de qualquer lugar, a qualquer hora" },
];

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [crc, setCrc] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/dashboard");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
      } else {
        if (!crc.trim()) {
          toast.error("CRC é obrigatório para criar conta");
          setLoading(false);
          return;
        }
        const { error, data: signUpData } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { crc: crc.trim() } }
        });
        if (error) throw error;
        if (signUpData.user) {
          await supabase.from("profiles").update({ crc: crc.trim() }).eq("user_id", signUpData.user.id);
        }
        toast.success("Conta criada com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Erro ao conectar com Google");
      }
    } catch {
      toast.error("Erro ao conectar com Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel — immersive brand */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        
        {/* Glow orbs */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-white/8 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-primary-foreground tracking-tight">
              Seu Contador IA
            </span>
          </div>

          {/* Hero */}
          <div className="space-y-8">
            <div>
              <h1 className="font-display text-4xl xl:text-5xl font-bold text-primary-foreground leading-tight">
                Contabilidade do futuro,{" "}
                <span className="text-white/70">hoje.</span>
              </h1>
              <p className="text-primary-foreground/70 text-lg mt-4 max-w-sm leading-relaxed">
                Automatize seu escritório contábil com inteligência artificial de última geração.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white/[0.08] backdrop-blur-sm border border-white/[0.12] rounded-xl p-4 hover:bg-white/[0.12] transition-colors duration-300"
                >
                  <f.icon className="w-5 h-5 text-primary-foreground/80 mb-2.5" />
                  <p className="text-sm font-semibold text-primary-foreground">{f.title}</p>
                  <p className="text-xs text-primary-foreground/55 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-primary-foreground/40">
            © 2026 Seu Contador IA · Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px] space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Seu Contador IA</span>
          </div>

          {/* Header */}
          <div className="text-center space-y-1.5">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Entre para acessar seu escritório contábil" : "Comece a automatizar seu escritório hoje"}
            </p>
          </div>

          {/* Google button */}
          <Button
            variant="outline"
            className="w-full h-12 gap-3 text-sm font-medium border-border/60 hover:bg-accent/50 transition-all duration-200"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Chrome className="w-5 h-5" />
            Continuar com Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground/60 font-medium tracking-wider">ou</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-11 h-12 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="crc" className="text-sm font-medium">CRC (Registro no Conselho) *</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input
                    id="crc"
                    placeholder="Ex: SP-123456/O"
                    value={crc}
                    onChange={e => setCrc(e.target.value)}
                    className="pl-11 h-12 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                {isLogin && (
                  <Link to="/reset-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                    Esqueceu a senha?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 bg-muted/30 border-border/50 focus:bg-background transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Carregando...
                </span>
              ) : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          {/* Toggle auth mode */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </p>

          {/* Back */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
