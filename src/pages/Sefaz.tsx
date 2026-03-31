import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, Search, CheckCircle2, Globe, FileCode, RefreshCw,
  Send, Eye, Loader2, Receipt, Plus, Trash2, Package, Calculator
} from "lucide-react";
import { toast } from "sonner";

type ItemNFe = {
  id: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  icmsAliquota: number;
  ipiAliquota: number;
  pisAliquota: number;
  cofinsAliquota: number;
};

const servicos = [
  { nome: "NF-e — Emissão", webservice: "NfeAutorizacao4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Consulta", webservice: "NfeConsultaProtocolo4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Cancelamento", webservice: "NfeCancelamento", status: "online", uf: "Nacional" },
  { nome: "NF-e — Inutilização", webservice: "NfeInutilizacao4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Carta Correção", webservice: "RecepcaoEvento", status: "online", uf: "Nacional" },
  { nome: "CT-e — Emissão", webservice: "CteRecepcaoSinc", status: "online", uf: "Nacional" },
  { nome: "MDF-e — Manifesto", webservice: "MDFeRecepcaoSinc", status: "online", uf: "Nacional" },
  { nome: "NFS-e Nacional", webservice: "NfseRecepcionarRps", status: "online", uf: "Nacional" },
  { nome: "Manifestação Destinatário", webservice: "RecepcaoEvento", status: "online", uf: "Nacional" },
];

const consultas = [
  { tipo: "Consulta CNPJ", endpoint: "receitaws.com.br/v1/cnpj/{cnpj}", desc: "Receita Federal — dados cadastrais", status: "ativo" },
  { tipo: "Consulta CPF", endpoint: "api.cpf.gov.br/v1/{cpf}", desc: "Receita Federal — situação cadastral", status: "ativo" },
  { tipo: "Simples Nacional", endpoint: "portaldatransparencia.gov.br/simples", desc: "PGDAS-D e DAS", status: "ativo" },
  { tipo: "Situação Fiscal", endpoint: "cav.receita.fazenda.gov.br", desc: "e-CAC — pendências", status: "ativo" },
  { tipo: "Certidão Negativa", endpoint: "servicos.receita.fazenda.gov.br", desc: "CND Federal e FGTS", status: "ativo" },
];

type NFeEmitida = {
  numero: string;
  serie: string;
  chave: string;
  destinatario: string;
  valor: number;
  status: "autorizada" | "cancelada" | "denegada";
  data: string;
  itens: number;
};

const nfesDemo: NFeEmitida[] = [
  { numero: "000.123.456", serie: "1", chave: "35260312345678000190550010001234561234567890", destinatario: "Tech Solutions LTDA", valor: 15800, status: "autorizada", data: "30/03/2026", itens: 3 },
  { numero: "000.123.455", serie: "1", chave: "35260312345678000190550010001234551234567889", destinatario: "Comércio ABC ME", valor: 8500, status: "autorizada", data: "29/03/2026", itens: 2 },
  { numero: "000.123.454", serie: "1", chave: "35260312345678000190550010001234541234567888", destinatario: "Indústria Metal SA", valor: 32000, status: "cancelada", data: "28/03/2026", itens: 5 },
  { numero: "000.123.453", serie: "1", chave: "35260312345678000190550010001234531234567887", destinatario: "Serviços Pro LTDA", valor: 4200, status: "autorizada", data: "27/03/2026", itens: 1 },
];

const integradores = [
  { nome: "Oobj / Avalara Brasil", desc: "Líder em mensageria fiscal, +36M DFe. SaaS e In House.", url: "oobj.com.br", features: ["NF-e", "NFS-e", "CT-e", "MDF-e", "Contingência", "Cálculo tributário"] },
  { nome: "Focus NFe", desc: "API REST simples para emissão de documentos fiscais.", url: "focusnfe.com.br", features: ["NF-e", "NFS-e", "NFC-e", "CT-e", "API REST"] },
  { nome: "Tecnospeed", desc: "Plataforma completa de automação fiscal.", url: "tecnospeed.com.br", features: ["NF-e", "NFS-e", "Boletos", "SPED", "eSocial"] },
  { nome: "Webmania", desc: "API de emissão de notas fiscais.", url: "webmaniabr.com", features: ["NF-e", "NFC-e", "NFS-e", "API simples"] },
];

const cfopComuns = [
  "5102 - Venda merc. adq. terceiros",
  "5405 - Venda merc. adq. ST",
  "5949 - Outra saída não especificada",
  "6102 - Venda merc. interestadual",
  "5101 - Venda prod. estabelecimento",
  "6101 - Venda prod. interestadual",
];

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function Sefaz() {
  const [search, setSearch] = useState("");
  const [emitindo, setEmitindo] = useState(false);
  const [itens, setItens] = useState<ItemNFe[]>([{
    id: crypto.randomUUID(), descricao: "", ncm: "", cfop: "5102",
    unidade: "UN", quantidade: 1, valorUnitario: 0,
    icmsAliquota: 18, ipiAliquota: 0, pisAliquota: 1.65, cofinsAliquota: 7.6
  }]);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
  const [nfeDetalhe, setNfeDetalhe] = useState<NFeEmitida | null>(null);

  const filteredServicos = servicos.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));

  const addItem = () => {
    setItens(prev => [...prev, {
      id: crypto.randomUUID(), descricao: "", ncm: "", cfop: "5102",
      unidade: "UN", quantidade: 1, valorUnitario: 0,
      icmsAliquota: 18, ipiAliquota: 0, pisAliquota: 1.65, cofinsAliquota: 7.6
    }]);
  };

  const removeItem = (id: string) => {
    if (itens.length <= 1) { toast.error("NF-e deve ter pelo menos 1 item"); return; }
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ItemNFe>) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const totalProdutos = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario), 0);
  const totalICMS = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario * i.icmsAliquota / 100), 0);
  const totalIPI = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario * i.ipiAliquota / 100), 0);
  const totalNFe = totalProdutos + totalIPI;

  const handleEmitirNFe = () => {
    if (itens.some(i => !i.descricao.trim())) { toast.error("Preencha a descrição de todos os itens"); return; }
    if (totalProdutos <= 0) { toast.error("Valor total deve ser maior que zero"); return; }
    setEmitindo(true);
    setTimeout(() => {
      setEmitindo(false);
      toast.success(`NF-e emitida! Número: 000.123.457 • ${itens.length} ite${itens.length > 1 ? "ns" : "m"} • R$ ${totalNFe.toLocaleString("pt-BR")}`);
    }, 2500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> Emissor NF-e & SEFAZ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{servicos.filter(s => s.status === "online").length}/{servicos.length} serviços online • {nfesDemo.filter(n => n.status === "autorizada").length} NF-e autorizadas</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.success("Status atualizado!")}>
          <RefreshCw className="w-4 h-4" /> Verificar Status
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">WebServices</p><p className="text-2xl font-bold font-display text-primary">{servicos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NF-e Emitidas (mês)</p><p className="text-2xl font-bold font-display text-primary">{nfesDemo.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Faturamento</p><p className="text-2xl font-bold font-display text-primary">R$ {(nfesDemo.filter(n => n.status === "autorizada").reduce((s, n) => s + n.valor, 0) / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Uptime</p><p className="text-2xl font-bold font-display text-primary">99.9%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="nfe" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="nfe">Emissão NF-e</TabsTrigger>
          <TabsTrigger value="notas">Notas Emitidas</TabsTrigger>
          <TabsTrigger value="webservices">WebServices</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
          <TabsTrigger value="integradores">Integradores</TabsTrigger>
        </TabsList>

        {/* EMISSÃO NF-e COMPLETA */}
        <TabsContent value="nfe">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Emissão de NF-e</CardTitle>
                <CardDescription>Preencha os dados do emitente, destinatário e itens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emitente e Destinatário */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Emitente</p>
                    <div><Label>Integrador Fiscal</Label>
                      <Select defaultValue="oobj">
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oobj">Oobj / Avalara Brasil</SelectItem>
                          <SelectItem value="focus">Focus NFe</SelectItem>
                          <SelectItem value="tecnospeed">Tecnospeed</SelectItem>
                          <SelectItem value="direto">WebService Direto (SEFAZ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>CNPJ Emitente</Label><Input placeholder="00.000.000/0001-00" className="mt-1.5 font-mono" /></div>
                    <div><Label>Inscrição Estadual</Label><Input placeholder="000.000.000.000" className="mt-1.5 font-mono" /></div>
                    <div><Label>Natureza da Operação</Label><Input placeholder="Venda de mercadoria" className="mt-1.5" defaultValue="Venda de mercadoria adquirida de terceiros" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Série</Label><Input defaultValue="1" className="mt-1.5" /></div>
                      <div><Label>Finalidade</Label>
                        <Select defaultValue="1">
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Normal</SelectItem>
                            <SelectItem value="2">2 - Complementar</SelectItem>
                            <SelectItem value="3">3 - Ajuste</SelectItem>
                            <SelectItem value="4">4 - Devolução</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Destinatário</p>
                    <div><Label>CNPJ/CPF Destinatário</Label><Input placeholder="00.000.000/0001-00" className="mt-1.5 font-mono" /></div>
                    <div><Label>Razão Social</Label><Input placeholder="Nome do destinatário" className="mt-1.5" /></div>
                    <div><Label>Inscrição Estadual</Label><Input placeholder="Isento ou número" className="mt-1.5 font-mono" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>UF Destino</Label>
                        <Select defaultValue="SP">
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>CEP</Label><Input placeholder="00000-000" className="mt-1.5 font-mono" /></div>
                    </div>
                    <div><Label>Endereço</Label><Input placeholder="Rua, número, bairro" className="mt-1.5" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ITENS DA NF-e */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Itens da NF-e ({itens.length})</CardTitle>
                    <CardDescription>Adicione produtos/serviços com NCM, CFOP e impostos</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" onClick={addItem}>
                    <Plus className="w-4 h-4" /> Adicionar Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {itens.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-lg border space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Item {idx + 1}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-xs">Descrição do Produto/Serviço *</Label>
                        <Input
                          placeholder="Descrição detalhada do item"
                          value={item.descricao}
                          onChange={e => updateItem(item.id, { descricao: e.target.value })}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">NCM</Label>
                        <Input
                          placeholder="0000.00.00"
                          value={item.ncm}
                          onChange={e => updateItem(item.id, { ncm: e.target.value })}
                          className="mt-1 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <Label className="text-xs">CFOP</Label>
                        <Select value={item.cfop} onValueChange={v => updateItem(item.id, { cfop: v })}>
                          <SelectTrigger className="mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {cfopComuns.map(c => <SelectItem key={c.split(" ")[0]} value={c.split(" ")[0]} className="text-xs">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Unidade</Label>
                        <Select value={item.unidade} onValueChange={v => updateItem(item.id, { unidade: v })}>
                          <SelectTrigger className="mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["UN","KG","LT","MT","M2","M3","CX","PC","PAR","DZ"].map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number" min="1" step="1"
                          value={item.quantidade}
                          onChange={e => updateItem(item.id, { quantidade: Number(e.target.value) || 0 })}
                          className="mt-1 text-sm font-mono h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Valor Unitário</Label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={item.valorUnitario || ""}
                          onChange={e => updateItem(item.id, { valorUnitario: Number(e.target.value) || 0 })}
                          className="mt-1 text-sm font-mono h-9"
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Subtotal</Label>
                        <Input
                          value={`R$ ${(item.quantidade * item.valorUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                          disabled
                          className="mt-1 text-sm font-mono h-9 bg-muted/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">ICMS (%)</Label>
                        <Input type="number" min="0" step="0.01" value={item.icmsAliquota} onChange={e => updateItem(item.id, { icmsAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">IPI (%)</Label>
                        <Input type="number" min="0" step="0.01" value={item.ipiAliquota} onChange={e => updateItem(item.id, { ipiAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">PIS (%)</Label>
                        <Input type="number" min="0" step="0.01" value={item.pisAliquota} onChange={e => updateItem(item.id, { pisAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" />
                      </div>
                      <div>
                        <Label className="text-xs">COFINS (%)</Label>
                        <Input type="number" min="0" step="0.01" value={item.cofinsAliquota} onChange={e => updateItem(item.id, { cofinsAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Totais */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium">Totais da NF-e</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-mono font-bold">R$ {totalProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div><p className="text-xs text-muted-foreground">ICMS Total</p><p className="font-mono font-medium">R$ {totalICMS.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div><p className="text-xs text-muted-foreground">IPI Total</p><p className="font-mono font-medium">R$ {totalIPI.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div><p className="text-xs text-muted-foreground">Total NF-e</p><p className="font-mono font-bold text-primary text-lg">R$ {totalNFe.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações adicionais */}
                <div>
                  <Label>Informações Complementares</Label>
                  <Textarea placeholder="Observações adicionais da NF-e..." className="mt-1.5 text-sm" rows={3} />
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleEmitirNFe} disabled={emitindo} className="gap-2">
                    {emitindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {emitindo ? "Emitindo via SEFAZ..." : "Emitir NF-e"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setShowXmlPreview(true)}>
                    <Eye className="w-4 h-4" /> Pré-visualizar XML
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={addItem}>
                    <Plus className="w-4 h-4" /> Adicionar Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NOTAS EMITIDAS */}
        <TabsContent value="notas">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="text-left py-3 px-4">Número</th>
                  <th className="text-left py-3 px-4">Destinatário</th>
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-center py-3 px-4">Itens</th>
                  <th className="text-right py-3 px-4">Valor</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-center py-3 px-4">Ações</th>
                </tr></thead>
                <tbody>{nfesDemo.map((nfe, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-mono">{nfe.numero}</td>
                    <td className="py-3 px-4 text-sm font-medium">{nfe.destinatario}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{nfe.data}</td>
                    <td className="py-3 px-4 text-sm text-center">{nfe.itens}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono font-medium text-primary">R$ {nfe.valor.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={nfe.status === "autorizada" ? "default" : "destructive"} className="text-[10px]">
                        {nfe.status === "autorizada" ? "Autorizada" : "Cancelada"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setNfeDetalhe(nfe)}>
                        <Eye className="w-3 h-3 mr-1" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WEBSERVICES */}
        <TabsContent value="webservices">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar serviço..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <div className="space-y-3">
            {filteredServicos.map(s => (
              <Card key={s.nome}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-medium text-sm">{s.nome}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{s.webservice} • {s.uf}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/50 text-primary flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CONSULTAS */}
        <TabsContent value="consultas">
          <div className="space-y-3">
            {consultas.map(c => (
              <Card key={c.tipo}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileCode className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-medium text-sm">{c.tipo}</p>
                      <p className="text-xs text-muted-foreground">{c.desc}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.endpoint}</p>
                    </div>
                  </div>
                  <Badge className="text-[10px]">Ativo</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* INTEGRADORES */}
        <TabsContent value="integradores">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Integradores fiscais abstraem a complexidade dos WebServices da SEFAZ. Configure a chave API em Admin &gt; APIs.
            </p>
            {integradores.map(int => (
              <Card key={int.nome}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm font-display">{int.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{int.desc}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">{int.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {int.features.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info(`Configure a chave API da ${int.nome} em Admin > APIs`)}>Configurar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* XML Preview Dialog */}
      <Dialog open={showXmlPreview} onOpenChange={setShowXmlPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Pré-visualização XML NF-e</DialogTitle>
            <DialogDescription>Estrutura XML que será enviada à SEFAZ</DialogDescription>
          </DialogHeader>
          <pre className="bg-muted/50 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00">
    <ide>
      <natOp>Venda de mercadoria</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>123457</nNF>
      <tpEmis>1</tpEmis>
      <finNFe>1</finNFe>
    </ide>
    <emit>
      <CNPJ>00000000000100</CNPJ>
      <IE>000000000000</IE>
    </emit>
    <dest>
      <CNPJ>00000000000100</CNPJ>
    </dest>
${itens.map((item, idx) => `    <det nItem="${idx + 1}">
      <prod>
        <cProd>${idx + 1}</cProd>
        <xProd>${item.descricao || "Item " + (idx + 1)}</xProd>
        <NCM>${item.ncm || "00000000"}</NCM>
        <CFOP>${item.cfop}</CFOP>
        <uCom>${item.unidade}</uCom>
        <qCom>${item.quantidade}</qCom>
        <vUnCom>${item.valorUnitario.toFixed(2)}</vUnCom>
        <vProd>${(item.quantidade * item.valorUnitario).toFixed(2)}</vProd>
      </prod>
      <imposto>
        <ICMS><ICMS00><pICMS>${item.icmsAliquota}</pICMS></ICMS00></ICMS>
        <IPI><pIPI>${item.ipiAliquota}</pIPI></IPI>
        <PIS><pPIS>${item.pisAliquota}</pPIS></PIS>
        <COFINS><pCOFINS>${item.cofinsAliquota}</pCOFINS></COFINS>
      </imposto>
    </det>`).join("\n")}
    <total>
      <vProd>${totalProdutos.toFixed(2)}</vProd>
      <vICMS>${totalICMS.toFixed(2)}</vICMS>
      <vIPI>${totalIPI.toFixed(2)}</vIPI>
      <vNF>${totalNFe.toFixed(2)}</vNF>
    </total>
  </infNFe>
</NFe>`}
          </pre>
        </DialogContent>
      </Dialog>

      {/* NF-e Detail Dialog */}
      <Dialog open={!!nfeDetalhe} onOpenChange={() => setNfeDetalhe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">NF-e {nfeDetalhe?.numero}</DialogTitle>
          </DialogHeader>
          {nfeDetalhe && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Número</p><p className="font-mono">{nfeDetalhe.numero}</p></div>
                <div><p className="text-xs text-muted-foreground">Série</p><p>{nfeDetalhe.serie}</p></div>
                <div><p className="text-xs text-muted-foreground">Destinatário</p><p className="font-medium">{nfeDetalhe.destinatario}</p></div>
                <div><p className="text-xs text-muted-foreground">Data</p><p>{nfeDetalhe.data}</p></div>
                <div><p className="text-xs text-muted-foreground">Itens</p><p>{nfeDetalhe.itens}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-mono font-bold text-primary">R$ {nfeDetalhe.valor.toLocaleString("pt-BR")}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={nfeDetalhe.status === "autorizada" ? "default" : "destructive"} className="text-[10px]">
                    {nfeDetalhe.status === "autorizada" ? "Autorizada" : "Cancelada"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chave de Acesso</p>
                <p className="font-mono text-[10px] bg-muted/50 p-2 rounded mt-1 break-all">{nfeDetalhe.chave}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
