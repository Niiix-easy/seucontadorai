import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Landmark, RefreshCw, CheckCircle2, Building2, DollarSign, 
  Link2, Settings, ExternalLink, Loader2, ArrowUpDown,
  Upload, FileText, Search, Bot, XCircle, Download
} from "lucide-react";
import { toast } from "sonner";

type Banco = {
  nome: string;
  codigo: string;
  tipo: string;
  status: "conectado" | "pendente" | "erro";
  ultimaSinc: string;
  saldo: number;
};

type Transacao = {
  id: string;
  data: string;
  desc: string;
  banco: string;
  valor: number;
  tipo: "credito" | "debito";
  classificado: boolean;
  contaContabil?: string;
};

const bancosInit: Banco[] = [
  { nome: "Banco do Brasil", codigo: "001", tipo: "Extrato OFX", status: "conectado", ultimaSinc: "30/03/2026 14:00", saldo: 125400 },
  { nome: "Bradesco", codigo: "237", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 13:30", saldo: 89750 },
  { nome: "Itaú Unibanco", codigo: "341", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 12:00", saldo: 234100 },
  { nome: "Caixa Econômica", codigo: "104", tipo: "Extrato OFX", status: "conectado", ultimaSinc: "29/03/2026 23:00", saldo: 67890 },
  { nome: "Santander", codigo: "033", tipo: "API Open Banking", status: "pendente", ultimaSinc: "—", saldo: 0 },
  { nome: "Nubank", codigo: "260", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 14:15", saldo: 45320 },
  { nome: "Inter", codigo: "077", tipo: "API Open Banking", status: "conectado", ultimaSinc: "30/03/2026 10:00", saldo: 18900 },
];

const transacoesInit: Transacao[] = [
  { id: "1", data: "30/03/2026", desc: "TED Recebida — Cliente ABC", banco: "Itaú", valor: 8500, tipo: "credito", classificado: true, contaContabil: "1.1.1.01 - Banco c/ Movimento" },
  { id: "2", data: "30/03/2026", desc: "Pag. Fornecedor XYZ", banco: "BB", valor: -3200, tipo: "debito", classificado: true, contaContabil: "2.1.1.01 - Fornecedores" },
  { id: "3", data: "29/03/2026", desc: "Aluguel Escritório", banco: "Bradesco", valor: -4500, tipo: "debito", classificado: true, contaContabil: "3.1.2.01 - Aluguéis" },
  { id: "4", data: "29/03/2026", desc: "PIX Recebido — Honorários", banco: "Nubank", valor: 2800, tipo: "credito", classificado: false },
  { id: "5", data: "28/03/2026", desc: "DAS Simples Nacional", banco: "BB", valor: -1890, tipo: "debito", classificado: true, contaContabil: "2.1.3.01 - Tributos a Pagar" },
  { id: "6", data: "28/03/2026", desc: "Rendimento Aplicação", banco: "Itaú", valor: 156.45, tipo: "credito", classificado: false },
  { id: "7", data: "27/03/2026", desc: "Energia Elétrica", banco: "Bradesco", valor: -890, tipo: "debito", classificado: false },
  { id: "8", data: "27/03/2026", desc: "Prolabore Sócio", banco: "BB", valor: -5000, tipo: "debito", classificado: false },
];

const contasContabeis = [
  "1.1.1.01 - Banco c/ Movimento",
  "1.1.2.01 - Clientes a Receber",
  "2.1.1.01 - Fornecedores",
  "2.1.3.01 - Tributos a Pagar",
  "3.1.1.01 - Receita de Serviços",
  "3.1.2.01 - Aluguéis",
  "3.1.3.01 - Despesas Administrativas",
  "3.1.4.01 - Folha de Pagamento",
  "4.1.1.01 - Receitas Financeiras",
  "4.1.2.01 - Despesas Financeiras",
];

const agregadores = [
  { nome: "Pluggy", desc: "Infraestrutura Open Finance líder no Brasil. 200+ instituições.", url: "pluggy.ai", features: ["Open Finance", "Extratos", "Saldos", "Investimentos"], status: "recomendado" },
  { nome: "Belvo", desc: "Plataforma Open Finance para América Latina.", url: "belvo.com", features: ["Open Banking", "Extratos", "Identidade", "Pagamentos"], status: "disponível" },
  { nome: "Quanto", desc: "Solução brasileira de Open Banking com OFX.", url: "quanto.app", features: ["Open Banking", "OFX", "Conciliação"], status: "disponível" },
];

export default function Bancos() {
  const [bancos] = useState<Banco[]>(bancosInit);
  const [transacoes, setTransacoes] = useState<Transacao[]>(transacoesInit);
  const [conectando, setConectando] = useState(false);
  const [search, setSearch] = useState("");
  const [importingOFX, setImportingOFX] = useState(false);
  const [classificandoIA, setClassificandoIA] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<string | null>(null);
  const [transacaoClassificar, setTransacaoClassificar] = useState<string | null>(null);
  const ofxInputRef = useRef<HTMLInputElement>(null);

  const conectados = bancos.filter(b => b.status === "conectado").length;
  const saldoTotal = bancos.reduce((s, b) => s + b.saldo, 0);
  const classificadas = transacoes.filter(t => t.classificado).length;
  const pendentes = transacoes.filter(t => !t.classificado);

  const filteredTransacoes = transacoes.filter(t =>
    t.desc.toLowerCase().includes(search.toLowerCase()) ||
    t.banco.toLowerCase().includes(search.toLowerCase())
  );

  const handleConectar = () => {
    setConectando(true);
    setTimeout(() => {
      setConectando(false);
      toast.success("Conta bancária conectada via Open Banking!");
    }, 2000);
  };

  const handleImportOFX = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".ofx") && !file.name.toLowerCase().endsWith(".ofc")) {
      toast.error("Formato inválido. Aceitos: .ofx ou .ofc");
      return;
    }
    setImportingOFX(true);
    setTimeout(() => {
      const novasTransacoes: Transacao[] = [
        { id: crypto.randomUUID(), data: "31/03/2026", desc: `Importado OFX — ${file.name}`, banco: "Importação", valor: 0, tipo: "credito", classificado: false },
      ];
      setTransacoes(prev => [...novasTransacoes, ...prev]);
      setImportingOFX(false);
      toast.success(`Extrato OFX importado: ${file.name}`);
      if (ofxInputRef.current) ofxInputRef.current.value = "";
    }, 1500);
  };

  const handleClassificarIA = () => {
    setClassificandoIA(true);
    setTimeout(() => {
      setTransacoes(prev => prev.map(t => {
        if (t.classificado) return t;
        let conta = "3.1.3.01 - Despesas Administrativas";
        if (t.desc.toLowerCase().includes("honorário") || t.desc.toLowerCase().includes("serviço")) conta = "3.1.1.01 - Receita de Serviços";
        if (t.desc.toLowerCase().includes("rendimento") || t.desc.toLowerCase().includes("aplicação")) conta = "4.1.1.01 - Receitas Financeiras";
        if (t.desc.toLowerCase().includes("energia") || t.desc.toLowerCase().includes("luz")) conta = "3.1.3.01 - Despesas Administrativas";
        if (t.desc.toLowerCase().includes("prolabore") || t.desc.toLowerCase().includes("salário")) conta = "3.1.4.01 - Folha de Pagamento";
        return { ...t, classificado: true, contaContabil: conta };
      }));
      setClassificandoIA(false);
      toast.success("IA classificou todas as transações pendentes!");
    }, 2500);
  };

  const handleConciliar = (id: string) => {
    if (!contaSelecionada) {
      setTransacaoClassificar(id);
      return;
    }
    setTransacoes(prev => prev.map(t =>
      t.id === id ? { ...t, classificado: true, contaContabil: contaSelecionada } : t
    ));
    setContaSelecionada(null);
    setTransacaoClassificar(null);
    toast.success("Transação conciliada!");
  };

  const handleConciliarComConta = () => {
    if (!transacaoClassificar || !contaSelecionada) return;
    setTransacoes(prev => prev.map(t =>
      t.id === transacaoClassificar ? { ...t, classificado: true, contaContabil: contaSelecionada } : t
    ));
    setContaSelecionada(null);
    setTransacaoClassificar(null);
    toast.success("Transação conciliada com conta contábil!");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-primary" /> Integração Bancária & Conciliação
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{conectados}/{bancos.length} bancos conectados • Saldo total: R$ {saldoTotal.toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => toast.success("Sincronizando extratos...")}>
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Bancos Conectados</p><p className="text-2xl font-bold font-display text-primary">{conectados}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Saldo Total</p><p className="text-2xl font-bold font-display text-primary">R$ {(saldoTotal / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Transações (mês)</p><p className="text-2xl font-bold font-display text-primary">{transacoes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Conciliadas</p><p className="text-2xl font-bold font-display text-primary">{classificadas}/{transacoes.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="conciliacao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="conciliacao">Conciliação Bancária</TabsTrigger>
          <TabsTrigger value="bancos">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="transacoes">Todas as Transações</TabsTrigger>
          <TabsTrigger value="importar">Importar OFX</TabsTrigger>
          <TabsTrigger value="openbanking">Open Banking</TabsTrigger>
        </TabsList>

        {/* Conciliação - Aba principal */}
        <TabsContent value="conciliacao">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-primary" /> Conciliação Bancária</CardTitle>
                  <CardDescription>Classifique transações com contas contábeis — manualmente ou com IA</CardDescription>
                </div>
                <Button
                  onClick={handleClassificarIA}
                  disabled={classificandoIA || pendentes.length === 0}
                  className="gap-2"
                  variant={pendentes.length > 0 ? "default" : "outline"}
                >
                  {classificandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {classificandoIA ? "Classificando..." : `Classificar com IA (${pendentes.length})`}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-primary/30"><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Total no Período</p><p className="text-2xl font-bold font-display text-primary">{transacoes.length}</p></CardContent></Card>
                <Card className="border-emerald-500/30"><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Conciliadas</p><p className="text-2xl font-bold font-display text-emerald-600">{classificadas}</p></CardContent></Card>
                <Card className="border-amber-500/30"><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Pendentes</p><p className="text-2xl font-bold font-display text-amber-600">{pendentes.length}</p></CardContent></Card>
              </div>

              {pendentes.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Transações pendentes de conciliação:</p>
                  {pendentes.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.desc}</p>
                        <p className="text-xs text-muted-foreground">{t.data} • {t.banco} • <span className={t.valor >= 0 ? "text-primary" : "text-destructive"}>{t.valor >= 0 ? "+" : ""}R$ {Math.abs(t.valor).toLocaleString("pt-BR")}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(v) => { setContaSelecionada(v); setTransacaoClassificar(t.id); }}>
                          <SelectTrigger className="w-[220px] h-8 text-xs"><SelectValue placeholder="Conta contábil..." /></SelectTrigger>
                          <SelectContent>
                            {contasContabeis.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" className="text-xs gap-1 h-8" onClick={() => handleConciliar(t.id)}>
                          <CheckCircle2 className="w-3 h-3" /> Conciliar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-medium text-emerald-600">Todas as transações foram conciliadas! ✅</p>
                </div>
              )}

              {/* Conciliadas recentes */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Últimas conciliações:</p>
                {transacoes.filter(t => t.classificado).slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div>
                      <p className="text-sm">{t.desc}</p>
                      <p className="text-xs text-muted-foreground">{t.data} • {t.banco}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-medium ${t.valor >= 0 ? "text-primary" : "text-destructive"}`}>
                        {t.valor >= 0 ? "+" : ""}R$ {Math.abs(t.valor).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{t.contaContabil}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contas Bancárias */}
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
                      {b.status === "conectado" ? "✓ Conectado" : "Pendente"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Todas as Transações */}
        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">Extrato Consolidado</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar transação..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8 text-xs" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="text-left py-3 px-4">Data</th><th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Banco</th><th className="text-right py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">Conta Contábil</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr></thead>
                <tbody>{filteredTransacoes.map(t => (
                  <tr key={t.id} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm text-muted-foreground">{t.data}</td>
                    <td className="py-3 px-4 text-sm font-medium">{t.desc}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{t.banco}</td>
                    <td className={`py-3 px-4 text-sm text-right font-mono font-medium ${t.valor >= 0 ? "text-primary" : "text-destructive"}`}>
                      {t.valor >= 0 ? "+" : ""}R$ {Math.abs(t.valor).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{t.contaContabil || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      {t.classificado ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Badge variant="outline" className="text-[10px]">Pendente</Badge>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Importar OFX */}
        <TabsContent value="importar">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Importar Extrato OFX</CardTitle>
              <CardDescription>Importe extratos bancários no formato OFX/OFC para conciliação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Banco de Origem</Label>
                    <Select>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione o banco" /></SelectTrigger>
                      <SelectContent>
                        {bancos.map(b => <SelectItem key={b.codigo} value={b.codigo}>{b.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Período de Referência</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <Input type="date" />
                      <Input type="date" />
                    </div>
                  </div>
                  <div>
                    <Label>Arquivo OFX</Label>
                    <Input
                      ref={ofxInputRef}
                      type="file"
                      accept=".ofx,.ofc"
                      onChange={handleImportOFX}
                      className="mt-1.5 cursor-pointer"
                    />
                  </div>
                  <Button disabled={importingOFX} className="gap-2 w-full">
                    {importingOFX ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {importingOFX ? "Importando..." : "Importar Extrato"}
                  </Button>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30 space-y-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground text-sm">Como exportar OFX do seu banco:</p>
                  <p>1. Acesse o Internet Banking</p>
                  <p>2. Vá em Extrato → Exportar</p>
                  <p>3. Selecione formato OFX (Open Financial Exchange)</p>
                  <p>4. Escolha o período desejado e baixe o arquivo</p>
                  <p>5. Faça o upload aqui</p>
                  <div className="pt-2 border-t mt-3">
                    <p className="font-medium text-foreground">Bancos compatíveis:</p>
                    <p>BB, Bradesco, Itaú, Caixa, Santander, Sicoob, Sicredi, Banrisul e outros</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Open Banking */}
        <TabsContent value="openbanking">
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" /> Conectar via Open Banking</CardTitle>
                <CardDescription>Conecte contas automaticamente via Open Finance Brasil (Resolução BCB nº 32/2020)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><Label>Agregador</Label>
                      <Select defaultValue="pluggy">
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pluggy">Pluggy (Recomendado)</SelectItem>
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
                    <p>3. Autorize o compartilhamento de dados</p>
                    <p>4. Os dados são sincronizados automaticamente a cada hora</p>
                    <p className="mt-2 text-[10px]">Regulamentado pelo Banco Central — dados protegidos pela LGPD</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm font-medium">Agregadores Open Finance:</p>
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
                    <Button variant="outline" size="sm" onClick={() => toast.info(`Configure a chave API da ${ag.nome} em Admin > APIs`)}>Configurar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog classificar transação */}
      <Dialog open={!!transacaoClassificar && !!contaSelecionada} onOpenChange={() => { setTransacaoClassificar(null); setContaSelecionada(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Conciliação</DialogTitle>
            <DialogDescription>
              Classificar transação com a conta contábil: <strong>{contaSelecionada}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransacaoClassificar(null); setContaSelecionada(null); }}>Cancelar</Button>
            <Button onClick={handleConciliarComConta}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
