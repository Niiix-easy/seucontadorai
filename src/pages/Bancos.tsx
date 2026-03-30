import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Landmark, RefreshCw, CheckCircle2, Building2, DollarSign, 
  Link2, Settings, ExternalLink, Loader2, ArrowUpDown
} from "lucide-react";
import { toast } from "sonner";

const bancos = [
  { nome: "Banco do Brasil", codigo: "001", tipo: "Extrato OFX", status: "conectado", ultimaSinc: "30/03/2026 14:00", saldo: 125400 },
  { nome: "Bradesco", codigo: "237", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 13:30", saldo: 89750 },
  { nome: "Itaú Unibanco", codigo: "341", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 12:00", saldo: 234100 },
  { nome: "Caixa Econômica", codigo: "104", tipo: "Extrato OFX", status: "conectado", ultimaSinc: "29/03/2026 23:00", saldo: 67890 },
  { nome: "Santander", codigo: "033", tipo: "API Open Banking", status: "pendente", ultimaSinc: "—", saldo: 0 },
  { nome: "Nubank", codigo: "260", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 14:15", saldo: 45320 },
  { nome: "Inter", codigo: "077", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 10:00", saldo: 18900 },
];

const transacoes = [
  { data: "30/03/2026", desc: "TED Recebida — Cliente ABC", banco: "Itaú", valor: 8500, tipo: "credito", classificado: true },
  { data: "30/03/2026", desc: "Pag. Fornecedor XYZ", banco: "BB", valor: -3200, tipo: "debito", classificado: true },
  { data: "29/03/2026", desc: "Aluguel Escritório", banco: "Bradesco", valor: -4500, tipo: "debito", classificado: true },
  { data: "29/03/2026", desc: "PIX Recebido — Honorários", banco: "Nubank", valor: 2800, tipo: "credito", classificado: false },
  { data: "28/03/2026", desc: "DAS Simples Nacional", banco: "BB", valor: -1890, tipo: "debito", classificado: true },
  { data: "28/03/2026", desc: "Rendimento Aplicação", banco: "Itaú", valor: 156.45, tipo: "credito", classificado: false },
];

const agregadores = [
  { 
    nome: "Pluggy", desc: "Infraestrutura Open Finance líder no Brasil. Conexão com 200+ instituições.",
    url: "pluggy.ai", features: ["Open Finance", "Extratos", "Saldos", "Investimentos", "Cartões"],
    status: "recomendado"
  },
  { 
    nome: "Belvo", desc: "Plataforma Open Finance para América Latina. API unificada.",
    url: "belvo.com", features: ["Open Banking", "Extratos", "Identidade", "Pagamentos"],
    status: "disponível"
  },
  { 
    nome: "Quanto", desc: "Solução brasileira de Open Banking com suporte a OFX.",
    url: "quanto.app", features: ["Open Banking", "OFX", "Conciliação"],
    status: "disponível"
  },
];

export default function Bancos() {
  const [conectando, setConectando] = useState(false);
  const conectados = bancos.filter(b => b.status === "conectado").length;
  const saldoTotal = bancos.reduce((s, b) => s + b.saldo, 0);
  const classificadas = transacoes.filter(t => t.classificado).length;

  const handleConectar = () => {
    setConectando(true);
    setTimeout(() => {
      setConectando(false);
      toast.success("Conta bancária conectada via Open Banking!");
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-primary" /> Integração Bancária
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{conectados}/{bancos.length} bancos conectados • Saldo total: R$ {saldoTotal.toLocaleString("pt-BR")}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.success("Sincronizando extratos...")}>
          <RefreshCw className="w-4 h-4" /> Sincronizar Todos
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Bancos Conectados</p><p className="text-2xl font-bold font-display text-primary">{conectados}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Saldo Total</p><p className="text-2xl font-bold font-display text-primary">R$ {(saldoTotal / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Transações (mês)</p><p className="text-2xl font-bold font-display text-primary">{transacoes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Classificadas</p><p className="text-2xl font-bold font-display text-primary">{classificadas}/{transacoes.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="bancos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bancos">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="transacoes">Transações Recentes</TabsTrigger>
          <TabsTrigger value="openbanking">Open Banking</TabsTrigger>
          <TabsTrigger value="conciliacao">Conciliação</TabsTrigger>
        </TabsList>

        <TabsContent value="bancos">
          <div className="space-y-3">
            {bancos.map(b => (
              <Card key={b.codigo}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{b.nome} <span className="text-muted-foreground text-[10px]">({b.codigo})</span></p>
                      <p className="text-xs text-muted-foreground">{b.tipo} • Última sinc: {b.ultimaSinc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-primary">R$ {b.saldo.toLocaleString("pt-BR")}</p>
                    <Badge variant={b.status === "conectado" ? "default" : "outline"} className="text-[10px] mt-1">
                      {b.status === "conectado" ? "Conectado" : "Pendente"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="transacoes">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="text-left py-3 px-4">Data</th><th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Banco</th><th className="text-right py-3 px-4">Valor</th>
                  <th className="text-center py-3 px-4">Classificado</th>
                </tr></thead>
                <tbody>{transacoes.map((t, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm text-muted-foreground">{t.data}</td>
                    <td className="py-3 px-4 text-sm font-medium">{t.desc}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{t.banco}</td>
                    <td className={`py-3 px-4 text-sm text-right font-mono font-medium ${t.valor >= 0 ? "text-primary" : "text-destructive"}`}>
                      {t.valor >= 0 ? "+" : ""}R$ {Math.abs(t.valor).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.classificado ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <Badge variant="outline" className="text-[10px]">Pendente</Badge>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openbanking">
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" /> Conectar via Open Banking
                </CardTitle>
                <CardDescription>
                  Conecte contas bancárias automaticamente via Open Finance Brasil (Resolução BCB nº 32/2020)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><Label>Agregador</Label>
                      <Select defaultValue="pluggy">
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pluggy">Pluggy</SelectItem>
                          <SelectItem value="belvo">Belvo</SelectItem>
                          <SelectItem value="quanto">Quanto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Instituição Bancária</Label>
                      <Select>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                        <SelectContent>
                          {bancos.map(b => <SelectItem key={b.codigo} value={b.codigo}>{b.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleConectar} disabled={conectando} className="gap-2 w-full">
                      {conectando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      {conectando ? "Conectando..." : "Conectar Conta"}
                    </Button>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground p-4 rounded-lg border bg-background">
                    <p className="font-medium text-sm text-foreground mb-2">Como funciona?</p>
                    <p>1. Selecione o agregador e o banco</p>
                    <p>2. Você será redirecionado para o internet banking</p>
                    <p>3. Autorize o compartilhamento de dados (extratos e saldos)</p>
                    <p>4. Os dados são sincronizados automaticamente</p>
                    <p className="mt-2 text-[10px]">Regulamentado pelo Banco Central do Brasil — seus dados estão protegidos pela LGPD</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-sm font-medium">Agregadores Open Finance Disponíveis</p>
              {agregadores.map(ag => (
                <Card key={ag.nome}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm font-display">{ag.nome}</p>
                          {ag.status === "recomendado" && <Badge className="text-[10px]">Recomendado</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{ag.desc}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-1">{ag.url}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ag.features.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast.info(`Configure a chave API da ${ag.nome} no painel Admin > APIs`)}>
                        Configurar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conciliacao">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-primary" /> Conciliação Bancária</CardTitle>
              <CardDescription>Concilie transações bancárias com lançamentos contábeis automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Transações no Período</p><p className="text-2xl font-bold font-display text-primary">{transacoes.length}</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Conciliadas</p><p className="text-2xl font-bold font-display text-primary">{classificadas}</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Pendentes</p><p className="text-2xl font-bold font-display text-destructive">{transacoes.length - classificadas}</p></CardContent></Card>
              </div>
              <div className="space-y-2">
                {transacoes.filter(t => !t.classificado).map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                    <div>
                      <p className="text-sm font-medium">{t.desc}</p>
                      <p className="text-xs text-muted-foreground">{t.data} • {t.banco} • R$ {Math.abs(t.valor).toLocaleString("pt-BR")}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => toast.success("Transação conciliada!")}>
                      <CheckCircle2 className="w-3 h-3" /> Conciliar
                    </Button>
                  </div>
                ))}
                {classificadas === transacoes.length && (
                  <p className="text-center text-sm text-muted-foreground py-8">Todas as transações foram conciliadas! ✅</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
