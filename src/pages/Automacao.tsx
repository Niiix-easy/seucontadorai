import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Zap, Bot, FileText, Banknote, Clock, CheckCircle2, Play, Pause } from "lucide-react";
import { toast } from "sonner";

const automacoes = [
  { id: 1, nome: "Classificação Contábil Automática", desc: "IA classifica lançamentos contábeis por histórico e padrões", tipo: "IA", status: true, execucoes: 1247, ultimaExec: "30/03/2026 14:30" },
  { id: 2, nome: "Conciliação Bancária", desc: "Concilia extratos bancários com lançamentos automaticamente", tipo: "Financeiro", status: true, execucoes: 856, ultimaExec: "30/03/2026 08:00" },
  { id: 3, nome: "Importação de Extratos OFX", desc: "Importa automaticamente extratos no formato OFX/QIF", tipo: "Bancário", status: true, execucoes: 423, ultimaExec: "29/03/2026 23:00" },
  { id: 4, nome: "Lançamentos Recorrentes", desc: "Gera lançamentos mensais automaticamente (aluguel, internet, etc)", tipo: "Contábil", status: false, execucoes: 189, ultimaExec: "01/03/2026 00:01" },
  { id: 5, nome: "Alerta de Obrigações", desc: "Notifica sobre prazos de obrigações acessórias", tipo: "Fiscal", status: true, execucoes: 67, ultimaExec: "30/03/2026 09:00" },
  { id: 6, nome: "Backup Automático de XMLs", desc: "Backup diário de todos os XMLs fiscais para storage", tipo: "Segurança", status: true, execucoes: 365, ultimaExec: "30/03/2026 03:00" },
  { id: 7, nome: "Verificação de Duplicatas", desc: "IA verifica lançamentos duplicados antes de contabilizar", tipo: "IA", status: true, execucoes: 2340, ultimaExec: "30/03/2026 14:45" },
  { id: 8, nome: "Geração de DAS (Simples Nacional)", desc: "Calcula e gera guias DAS automaticamente", tipo: "Fiscal", status: false, execucoes: 45, ultimaExec: "20/03/2026 10:00" },
];

const tipoColors: Record<string, string> = {
  IA: "bg-purple-100 text-purple-700", Financeiro: "bg-blue-100 text-blue-700",
  Bancário: "bg-green-100 text-green-700", Contábil: "bg-amber-100 text-amber-700",
  Fiscal: "bg-red-100 text-red-700", Segurança: "bg-gray-100 text-gray-700",
};

export default function Automacao() {
  const [items, setItems] = useState(automacoes);

  const toggle = (id: number) => {
    setItems(prev => prev.map(a => a.id === id ? { ...a, status: !a.status } : a));
    const item = items.find(a => a.id === id);
    toast.success(`${item?.nome} ${item?.status ? "desativada" : "ativada"}!`);
  };

  const executar = (nome: string) => {
    toast.success(`Executando "${nome}"...`);
  };

  const ativas = items.filter(a => a.status).length;
  const totalExecucoes = items.reduce((s, a) => s + a.execucoes, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <Zap className="w-8 h-8 text-primary" /> Automação Contábil
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{ativas}/{items.length} automações ativas • {totalExecucoes.toLocaleString("pt-BR")} execuções</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Automações Ativas</p><p className="text-2xl font-bold font-display text-primary">{ativas}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total Execuções</p><p className="text-2xl font-bold font-display text-primary">{totalExecucoes.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Com IA</p><p className="text-2xl font-bold font-display text-primary">{items.filter(a => a.tipo === "IA").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Tempo Economizado</p><p className="text-2xl font-bold font-display text-primary">~{Math.round(totalExecucoes * 2 / 60)}h</p></CardContent></Card>
      </div>

      <div className="grid gap-3">
        {items.map(a => (
          <Card key={a.id} className={`transition-opacity ${!a.status ? "opacity-60" : ""}`}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.status ? "bg-primary/10" : "bg-muted"}`}>
                  {a.tipo === "IA" ? <Bot className="w-5 h-5 text-primary" /> : a.tipo === "Financeiro" || a.tipo === "Bancário" ? <Banknote className="w-5 h-5 text-primary" /> : a.tipo === "Fiscal" ? <FileText className="w-5 h-5 text-primary" /> : <Zap className="w-5 h-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{a.nome}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tipoColors[a.tipo] || "bg-muted"}`}>{a.tipo}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {a.execucoes} execuções</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.ultimaExec}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => executar(a.nome)} disabled={!a.status}>
                  <Play className="w-3 h-3" /> Executar
                </Button>
                <Switch checked={a.status} onCheckedChange={() => toggle(a.id)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
