import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, FileText, DollarSign, MessageSquare, Bell, Upload } from "lucide-react";
import { toast } from "sonner";

export default function Portal() {
  const { user } = useAuth();

  const { data: clients = [] } = useQuery({
    queryKey: ["portal-clients"],
    queryFn: async () => { const { data } = await supabase.from("clients").select("id, company_name, status, monthly_fee").eq("status", "active"); return data || []; },
    enabled: !!user,
  });
  const { data: obligations = [] } = useQuery({
    queryKey: ["portal-oblig"],
    queryFn: async () => { const { data } = await supabase.from("obligations").select("*").eq("status", "pending").limit(10); return data || []; },
    enabled: !!user,
  });

  const features = [
    { icon: Upload, title: "Envio de Documentos", desc: "Clientes enviam notas, comprovantes e documentos direto pelo portal", status: "Ativo" },
    { icon: DollarSign, title: "Visualização de Impostos", desc: "Guias de impostos, DAS, DARF disponíveis para download", status: "Ativo" },
    { icon: FileText, title: "Relatórios Contábeis", desc: "Balancete, DRE e balanço acessíveis pelo cliente", status: "Ativo" },
    { icon: DollarSign, title: "Pagamento de Honorários", desc: "Boletos e PIX para pagamento de honorários mensais", status: "Ativo" },
    { icon: MessageSquare, title: "Chamados e Suporte", desc: "Sistema de tickets para dúvidas e solicitações", status: "Ativo" },
    { icon: Bell, title: "Notificações", desc: "Alertas automáticos sobre prazos e documentos pendentes", status: "Ativo" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <Globe className="w-8 h-8 text-primary" /> Portal do Cliente
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes com acesso ao portal</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Clientes no Portal</p><p className="text-2xl font-bold font-display text-primary">{clients.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Obrigações Pendentes</p><p className="text-2xl font-bold font-display text-primary">{obligations.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Docs Recebidos (mês)</p><p className="text-2xl font-bold font-display text-primary">148</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Chamados Abertos</p><p className="text-2xl font-bold font-display text-primary">12</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <Card key={f.title} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{f.title}</p>
                    <Badge className="text-[10px]">{f.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {obligations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Próximas Obrigações dos Clientes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {obligations.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">Prazo: {new Date(o.due_date).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge variant="outline">{o.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
