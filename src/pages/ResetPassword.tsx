import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email de recuperação enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Bot className="w-8 h-8 text-primary" />
            <span className="font-display text-2xl font-bold">Seu Contador IA</span>
          </div>
          <h2 className="font-display text-2xl font-bold">Recuperar senha</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {sent ? "Verifique sua caixa de entrada" : "Informe seu email para receber o link de recuperação"}
          </p>
        </div>

        {sent ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-4">
            <Mail className="w-12 h-12 text-primary mx-auto" />
            <p className="text-sm">Enviamos um link de recuperação para <strong>{email}</strong>. Verifique também a pasta de spam.</p>
            <Button variant="outline" className="gap-2" asChild>
              <Link to="/login"><ArrowLeft className="w-4 h-4" /> Voltar ao login</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Voltar ao login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
