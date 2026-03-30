import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PenTool, FileText, Shield, Users, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const contratos = [
  { id: 1, titulo: "Contrato de Prestação de Serviços", cliente: "Tech Solutions LTDA", status: "assinado", data: "28/03/2026", signatarios: 2 },
  { id: 2, titulo: "Aditivo Contratual", cliente: "Comércio ABC ME", status: "aguardando", data: "27/03/2026", signatarios: 1 },
  { id: 3, titulo: "Procuração Eletrônica", cliente: "Indústria Metal SA", status: "assinado", data: "25/03/2026", signatarios: 3 },
  { id: 4, titulo: "Termo de Responsabilidade", cliente: "Serviços Pro LTDA", status: "aguardando", data: "24/03/2026", signatarios: 1 },
  { id: 5, titulo: "Distrato Social", cliente: "Consultoria Beta", status: "expirado", data: "15/03/2026", signatarios: 4 },
];

const recursos = [
  { icon: Shield, title: "Certificado Digital A1/A3", desc: "Integração com certificados ICP-Brasil para assinatura qualificada", status: "Configurado" },
  { icon: FileText, title: "Assinatura em Lote", desc: "Assine múltiplos documentos de uma vez com certificado digital", status: "Disponível" },
  { icon: CheckCircle2, title: "Validade Jurídica", desc: "Documentos assinados com validade legal conforme MP 2.200-2", status: "Ativo" },
  { icon: Users, title: "Múltiplos Signatários", desc: "Fluxo de assinatura com vários participantes e ordem definida", status: "Ativo" },
];

export default function Assinatura() {
  const assinados = contratos.filter(c => c.status === "assinado").length;
  const aguardando = contratos.filter(c => c.status === "aguardando").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <PenTool className="w-8 h-8 text-primary" /> Assinatura Digital
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{contratos.length} documentos • {assinados} assinados • {aguardando} aguardando</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total Documentos</p><p className="text-2xl font-bold font-display text-primary">{contratos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Assinados</p><p className="text-2xl font-bold font-display text-primary">{assinados}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Aguardando</p><p className="text-2xl font-bold font-display text-primary">{aguardando}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Taxa Conclusão</p><p className="text-2xl font-bold font-display text-primary">{Math.round((assinados / contratos.length) * 100)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display">Documentos Recentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contratos.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {c.status === "assinado" ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Clock className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.titulo}</p>
                    <p className="text-xs text-muted-foreground">{c.cliente} • {c.signatarios} signatários • {c.data}</p>
                  </div>
                </div>
                <Badge variant={c.status === "assinado" ? "default" : c.status === "aguardando" ? "outline" : "destructive"} className="text-[10px]">
                  {c.status === "assinado" ? "Assinado" : c.status === "aguardando" ? "Aguardando" : "Expirado"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {recursos.map(r => (
          <Card key={r.title}>
            <CardContent className="p-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><r.icon className="w-5 h-5 text-primary" /></div>
              <div>
                <div className="flex items-center gap-2"><p className="font-medium text-sm">{r.title}</p><Badge className="text-[10px]">{r.status}</Badge></div>
                <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
