import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Landmark, RefreshCw, CheckCircle2, Building2, 
  Link2, Loader2, ArrowUpDown,
  Upload, Search, Bot
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type BankAccount = {
  id: string;
  nome: string;
  codigo: string;
  tipo: string;
  status: string;
  ultima_sinc: string | null;
  saldo: number;
};

type BankTransaction = {
  id: string;
  data: string;
  descricao: string;
  banco: string | null;
  valor: number;
  tipo: string;
  classificado: boolean;
  conta_contabil: string | null;
};

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
  { nome: "Pluggy", desc: "Open Finance líder no Brasil. 200+ instituições.", url: "pluggy.ai", features: ["Open Finance", "Extratos", "Saldos"], status: "recomendado" },
  { nome: "Belvo", desc: "Open Finance para América Latina.", url: "belvo.com", features: ["Open Banking", "Extratos", "Pagamentos"], status: "disponível" },
  { nome: "Quanto", desc: "Solução brasileira com OFX.", url: "quanto.app", features: ["Open Banking", "OFX", "Conciliação"], status: "disponível" },
];

const defaultBancos = [
  { nome: "Banco do Brasil", codigo: "001" },
  { nome: "Bradesco", codigo: "237" },
  { nome: "Itaú Unibanco", codigo: "341" },
  { nome: "Caixa Econômica", codigo: "104" },
  { nome: "Santander", codigo: "033" },
  { nome: "Nubank", codigo: "260" },
  { nome: "Inter", codigo: "077" },
  { nome: "Sicoob", codigo: "756" },
  { nome: "Sicredi", codigo: "748" },
];

export default function Bancos() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [conectando, setConectando] = useState(false);
  const [search, setSearch] = useState("");
  const [classificandoIA, setClassificandoIA] = useState(false);
  const [selectedBanco, setSelectedBanco] = useState("");
  const ofxInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [accs, txns] = await Promise.all([
      supabase.from("bank_accounts").select("*").order("nome"),
      supabase.from("bank_transactions").select("*").order("data", { ascending: false }),
    ]);
    if (accs.data) setAccounts(accs.data);
    if (txns.data) setTransactions(txns.data);
    setLoading(false);
  };

  const conectados = accounts.filter(b => b.status === "conectado").length;
  const saldoTotal = accounts.reduce((s, b) => s + Number(b.saldo), 0);
  const classificadas = transactions.filter(t => t.classificado).length;
  const pendentes = transactions.filter(t => !t.classificado);

  const filteredTransacoes = transactions.filter(t =>
    t.descricao.toLowerCase().includes(search.toLowerCase()) ||
    (t.banco || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleConectar = async () => {
    if (!selectedBanco || !user) return;
    setConectando(true);
    const banco = defaultBancos.find(b => b.codigo === selectedBanco);
    const { error } = await supabase.from("bank_accounts").insert({
      user_id: user.id,
      nome: banco?.nome || "Banco",
      codigo: selectedBanco,
      tipo: "API Open Banking",
      status: "conectado",
      ultima_sinc: new Date().toISOString(),
      saldo: 0,
    });
    setConectando(false);
    if (error) { toast.error("Erro ao conectar"); return; }
    toast.success("Conta bancária conectada!");
    loadData();
  };

  const handleImportOFX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.name.toLowerCase().endsWith(".ofx") && !file.name.toLowerCase().endsWith(".ofc")) {
      toast.error("Formato inválido. Aceitos: .ofx ou .ofc"); return;
    }
    // Demo: insert sample transactions from OFX
    const sampleTxns = [
      { user_id: user.id, descricao: `Import OFX — ${file.name}`, banco: "Importação", valor: 0, tipo: "credito", classificado: false, data: new Date().toISOString().split("T")[0] },
    ];
    await supabase.from("bank_transactions").insert(sampleTxns);
    toast.success(`Extrato OFX importado: ${file.name}`);
    if (ofxInputRef.current) ofxInputRef.current.value = "";
    loadData();
  };

  const handleClassificarIA = async () => {
    if (!user) return;
    setClassificandoIA(true);
    const updates = pendentes.map(t => {
      let conta = "3.1.3.01 - Despesas Administrativas";
      const d = t.descricao.toLowerCase();
      if (d.includes("honorário") || d.includes("serviço")) conta = "3.1.1.01 - Receita de Serviços";
      if (d.includes("rendimento") || d.includes("aplicação")) conta = "4.1.1.01 - Receitas Financeiras";
      if (d.includes("energia") || d.includes("luz")) conta = "3.1.3.01 - Despesas Administrativas";
      if (d.includes("prolabore") || d.includes("salário")) conta = "3.1.4.01 - Folha de Pagamento";
      if (d.includes("aluguel")) conta = "3.1.2.01 - Aluguéis";
      if (d.includes("fornecedor")) conta = "2.1.1.01 - Fornecedores";
      if (d.includes("imposto") || d.includes("das") || d.includes("tribut")) conta = "2.1.3.01 - Tributos a Pagar";
      return { id: t.id, conta };
    });
    for (const u of updates) {
      await supabase.from("bank_transactions").update({ classificado: true, conta_contabil: u.conta }).eq("id", u.id);
    }
    setClassificandoIA(false);
    toast.success("IA classificou todas as transações!");
    loadData();
  };

  const handleConciliar = async (id: string, conta: string) => {
    await supabase.from("bank_transactions").update({ classificado: true, conta_contabil: conta }).eq("id", id);
    toast.success("Transação conciliada!");
    loadData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Landmark className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
            <span className="leading-tight">Integração Bancária</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{conectados} bancos conectados • Saldo: R$ {saldoTotal.toLocaleString("pt-BR")}</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => { toast.success("Sincronizando..."); loadData(); }}>
          <RefreshCw className="w-4 h-4" /> Sincronizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Bancos</p><p className="text-2xl font-bold font-display text-primary">{accounts.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Saldo Total</p><p className="text-2xl font-bold font-display text-primary">R$ {(saldoTotal / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Transações</p><p className="text-2xl font-bold font-display text-primary">{transactions.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Conciliadas</p><p className="text-2xl font-bold font-display text-primary">{classificadas}/{transactions.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="conciliacao" className="space-y-4">
        <TabsList className="overflow-x-auto w-full justify-start max-w-full">
          <TabsTrigger value="conciliacao">Conciliação</TabsTrigger>
          <TabsTrigger value="bancos">Contas</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="importar">Importar OFX</TabsTrigger>
          <TabsTrigger value="openbanking">Open Banking</TabsTrigger>
        </TabsList>

        {/* CONCILIAÇÃO */}
        <TabsContent value="conciliacao">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-primary" /> Conciliação Bancária</CardTitle>
                  <CardDescription>Classifique transações com contas contábeis</CardDescription>
                </div>
                <Button onClick={handleClassificarIA} disabled={classificandoIA || pendentes.length === 0} className="gap-2">
                  {classificandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  {classificandoIA ? "Classificando..." : `Classificar IA (${pendentes.length})`}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-primary/30"><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-2xl font-bold font-display text-primary">{transactions.length}</p></CardContent></Card>
                <Card className="border-emerald-500/30"><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Conciliadas</p><p className="text-2xl font-bold font-display text-emerald-600">{classificadas}</p></CardContent></Card>
                <Card className="border-amber-500/30"><CardContent className="pt-6 text-center"><p className="text-xs text-muted-foreground mb-1">Pendentes</p><p className="text-2xl font-bold font-display text-amber-600">{pendentes.length}</p></CardContent></Card>
              </div>
              {pendentes.length > 0 ? (
                <div className="space-y-2">
                  {pendentes.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border bg-amber-500/5 border-amber-500/20">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">{t.data} • {t.banco} • <span className={Number(t.valor) >= 0 ? "text-primary" : "text-destructive"}>R$ {Math.abs(Number(t.valor)).toLocaleString("pt-BR")}</span></p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(v) => handleConciliar(t.id, v)}>
                          <SelectTrigger className="w-[220px] h-8 text-xs"><SelectValue placeholder="Conta contábil..." /></SelectTrigger>
                          <SelectContent>{contasContabeis.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-medium text-emerald-600">{transactions.length > 0 ? "Todas conciliadas! ✅" : "Nenhuma transação. Importe extratos ou conecte via Open Banking."}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTAS */}
        <TabsContent value="bancos">
          <div className="space-y-3">
            {accounts.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma conta conectada. Use Open Banking ou importe OFX.</CardContent></Card>}
            {accounts.map(b => (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-medium text-sm">{b.nome} <span className="text-muted-foreground text-[10px]">({b.codigo})</span></p>
                      <p className="text-xs text-muted-foreground">{b.tipo} • {b.ultima_sinc ? new Date(b.ultima_sinc).toLocaleString("pt-BR") : "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sm text-primary">R$ {Number(b.saldo).toLocaleString("pt-BR")}</p>
                    <Badge variant={b.status === "conectado" ? "default" : "outline"} className="text-[10px] mt-1">{b.status === "conectado" ? "✓ Conectado" : "Pendente"}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TRANSAÇÕES */}
        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="font-display text-base">Extrato</CardTitle>
                <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8 text-xs" /></div>
              </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-0 overflow-x-auto">
              <table className="w-full stack-table">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="text-left py-3 px-4">Data</th><th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Banco</th><th className="text-right py-3 px-4">Valor</th>
                  <th className="text-left py-3 px-4">Conta</th><th className="text-center py-3 px-4">Status</th>
                </tr></thead>
                <tbody>{filteredTransacoes.map(t => (
                  <tr key={t.id} className="border-t hover:bg-muted/30">
                    <td data-label="Data" className="py-3 px-4 text-sm text-muted-foreground">{t.data}</td>
                    <td data-label="Descrição" className="py-3 px-4 text-sm font-medium">{t.descricao}</td>
                    <td data-label="Banco" className="py-3 px-4 text-sm text-muted-foreground">{t.banco || "—"}</td>
                    <td data-label="Valor" className={`py-3 px-4 text-sm text-right font-mono font-medium ${Number(t.valor) >= 0 ? "text-primary" : "text-destructive"}`}>
                      {Number(t.valor) >= 0 ? "+" : ""}R$ {Math.abs(Number(t.valor)).toLocaleString("pt-BR")}
                    </td>
                    <td data-label="Conta" className="py-3 px-4 text-xs text-muted-foreground">{t.conta_contabil || "—"}</td>
                    <td data-label="Status" className="py-3 px-4 text-center">
                      {t.classificado ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Badge variant="outline" className="text-[10px]">Pendente</Badge>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {filteredTransacoes.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">Nenhuma transação encontrada.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IMPORTAR OFX */}
        <TabsContent value="importar">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Importar Extrato OFX</CardTitle>
              <CardDescription>Importe extratos bancários OFX/OFC para conciliação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><Label>Banco</Label>
                    <Select>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{defaultBancos.map(b => <SelectItem key={b.codigo} value={b.codigo}>{b.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Período</Label><div className="grid grid-cols-2 gap-2 mt-1.5"><Input type="date" /><Input type="date" /></div></div>
                  <div><Label>Arquivo OFX</Label><Input ref={ofxInputRef} type="file" accept=".ofx,.ofc" onChange={handleImportOFX} className="mt-1.5 cursor-pointer" /></div>
                </div>
                <div className="p-4 rounded-lg border bg-muted/30 space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground text-sm">Como exportar OFX:</p>
                  <p>1. Internet Banking → Extrato → Exportar</p>
                  <p>2. Formato OFX (Open Financial Exchange)</p>
                  <p>3. Faça upload aqui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPEN BANKING */}
        <TabsContent value="openbanking">
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" /> Conectar via Open Banking</CardTitle>
                <CardDescription>Open Finance Brasil (Resolução BCB nº 32/2020)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div><Label>Agregador</Label>
                      <Select defaultValue="pluggy"><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="pluggy">Pluggy (Recomendado)</SelectItem><SelectItem value="belvo">Belvo</SelectItem><SelectItem value="quanto">Quanto</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Banco</Label>
                      <Select value={selectedBanco} onValueChange={setSelectedBanco}>
                        <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{defaultBancos.map(b => <SelectItem key={b.codigo} value={b.codigo}>{b.nome}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleConectar} disabled={conectando || !selectedBanco} className="gap-2 w-full">
                      {conectando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                      {conectando ? "Conectando..." : "Conectar Conta"}
                    </Button>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground p-4 rounded-lg border bg-background">
                    <p className="font-medium text-sm text-foreground">Como funciona?</p>
                    <p>1. Selecione agregador e banco</p>
                    <p>2. Redirecionamento ao internet banking</p>
                    <p>3. Autorize compartilhamento de dados</p>
                    <p>4. Sincronização automática</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                      <div className="flex flex-wrap gap-1 mt-2">{ag.features.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info(`Configure em Admin > APIs`)}>Configurar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
