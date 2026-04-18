import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { FileText, Package, Briefcase, Plus, Trash2, Receipt, Download, Ban, FileEdit, MoreVertical, History, Eye } from "lucide-react";
import { toast } from "sonner";
import { gerarPDFNFe, gerarPDFNFSe } from "@/lib/pdf-notas";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import HistoricoEventos from "@/components/HistoricoEventos";

type Item = {
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  icms_aliquota: number;
  ipi_aliquota: number;
  pis_aliquota: number;
  cofins_aliquota: number;
};

const novoItem = (): Item => ({
  descricao: "",
  ncm: "",
  cfop: "5102",
  unidade: "UN",
  quantidade: 1,
  valor_unitario: 0,
  icms_aliquota: 18,
  ipi_aliquota: 0,
  pis_aliquota: 1.65,
  cofins_aliquota: 7.6,
});

export default function NotasFiscais() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openProduto, setOpenProduto] = useState(false);
  const [openServico, setOpenServico] = useState(false);

  // Cancel/CC-e dialogs
  const [cancelTarget, setCancelTarget] = useState<{ id: string; tipo: "nfe" | "nfse"; numero: string } | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cceTarget, setCceTarget] = useState<{ id: string; numero: string; sequencia: number } | null>(null);
  const [cceTexto, setCceTexto] = useState("");
  const [detalheTarget, setDetalheTarget] = useState<{ id: string; tipo: "nfe" | "nfse"; numero: string; serie: string } | null>(null);

  // NF-e (produto) form
  const [nfeClient, setNfeClient] = useState("");
  const [nfeNumero, setNfeNumero] = useState("");
  const [nfeNatureza, setNfeNatureza] = useState("Venda de mercadoria");
  const [nfeUf, setNfeUf] = useState("SP");
  const [nfeInfo, setNfeInfo] = useState("");
  const [itens, setItens] = useState<Item[]>([novoItem()]);

  // NFS-e (serviço) form
  const [nfseClient, setNfseClient] = useState("");
  const [nfseNumero, setNfseNumero] = useState("");
  const [nfseCodigo, setNfseCodigo] = useState("");
  const [nfseDiscriminacao, setNfseDiscriminacao] = useState("");
  const [nfseValor, setNfseValor] = useState(0);
  const [nfseDeducoes, setNfseDeducoes] = useState(0);
  const [nfseIss, setNfseIss] = useState(5);
  const [nfseMunicipio, setNfseMunicipio] = useState("São Paulo");

  const { data: clients = [] } = useQuery({
    queryKey: ["nf-clients"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, company_name, cnpj")
        .eq("status", "active")
        .order("company_name");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: nfes = [] } = useQuery({
    queryKey: ["nfe-emitidas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nfe_emitidas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: nfses = [] } = useQuery({
    queryKey: ["nfse-emitidas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nfse_emitidas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Cálculos NF-e
  const totalProdutos = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const totalIcms = itens.reduce((s, i) => s + (i.quantidade * i.valor_unitario * i.icms_aliquota) / 100, 0);
  const totalIpi = itens.reduce((s, i) => s + (i.quantidade * i.valor_unitario * i.ipi_aliquota) / 100, 0);
  const totalNfe = totalProdutos + totalIpi;

  // Cálculos NFS-e
  const baseCalc = Math.max(0, nfseValor - nfseDeducoes);
  const issValor = (baseCalc * nfseIss) / 100;
  const valorLiquido = nfseValor - issValor;

  const addItem = () => setItens([...itens, novoItem()]);
  const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItens(itens.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const resetNfe = () => {
    setNfeClient("");
    setNfeNumero("");
    setNfeNatureza("Venda de mercadoria");
    setNfeUf("SP");
    setNfeInfo("");
    setItens([novoItem()]);
  };

  const resetNfse = () => {
    setNfseClient("");
    setNfseNumero("");
    setNfseCodigo("");
    setNfseDiscriminacao("");
    setNfseValor(0);
    setNfseDeducoes(0);
    setNfseIss(5);
  };

  const emitirNfe = async () => {
    if (!user) return;
    if (!nfeClient || !nfeNumero || itens.length === 0 || itens.some(i => !i.descricao)) {
      toast.error("Preencha cliente, número e ao menos um item com descrição");
      return;
    }
    const cliente = clients.find(c => c.id === nfeClient);
    const { data: nfe, error } = await supabase
      .from("nfe_emitidas")
      .insert({
        user_id: user.id,
        client_id: nfeClient,
        numero: nfeNumero,
        serie: "1",
        natureza_operacao: nfeNatureza,
        uf_destino: nfeUf,
        cnpj_destinatario: cliente?.cnpj || "",
        razao_destinatario: cliente?.company_name || "",
        info_complementares: nfeInfo,
        valor_produtos: totalProdutos,
        valor_icms: totalIcms,
        valor_ipi: totalIpi,
        valor_total: totalNfe,
        status: "autorizada",
      })
      .select()
      .single();

    if (error || !nfe) {
      toast.error("Erro ao emitir NF-e: " + error?.message);
      return;
    }

    const itensInsert = itens.map((it, idx) => ({
      nfe_id: nfe.id,
      numero_item: idx + 1,
      descricao: it.descricao,
      ncm: it.ncm,
      cfop: it.cfop,
      unidade: it.unidade,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
      icms_aliquota: it.icms_aliquota,
      ipi_aliquota: it.ipi_aliquota,
      pis_aliquota: it.pis_aliquota,
      cofins_aliquota: it.cofins_aliquota,
    }));

    const { error: itensError } = await supabase.from("nfe_itens").insert(itensInsert);
    if (itensError) {
      toast.error("NF-e criada, mas houve erro ao salvar itens: " + itensError.message);
    } else {
      toast.success(`NF-e nº ${nfeNumero} emitida com sucesso!`);
    }
    queryClient.invalidateQueries({ queryKey: ["nfe-emitidas"] });
    resetNfe();
    setOpenProduto(false);
  };

  const emitirNfse = async () => {
    if (!user) return;
    if (!nfseClient || !nfseNumero || !nfseDiscriminacao || nfseValor <= 0) {
      toast.error("Preencha cliente, número, discriminação e valor do serviço");
      return;
    }
    const cliente = clients.find(c => c.id === nfseClient);
    const { error } = await supabase.from("nfse_emitidas").insert({
      user_id: user.id,
      client_id: nfseClient,
      numero: nfseNumero,
      serie: "1",
      cnpj_tomador: cliente?.cnpj || "",
      razao_tomador: cliente?.company_name || "",
      municipio_prestacao: nfseMunicipio,
      codigo_servico: nfseCodigo,
      discriminacao: nfseDiscriminacao,
      valor_servicos: nfseValor,
      valor_deducoes: nfseDeducoes,
      base_calculo: baseCalc,
      iss_aliquota: nfseIss,
      iss_valor: issValor,
      valor_liquido: valorLiquido,
      status: "autorizada",
    });

    if (error) {
      toast.error("Erro ao emitir NFS-e: " + error.message);
      return;
    }
    toast.success(`NFS-e nº ${nfseNumero} emitida com sucesso!`);
    queryClient.invalidateQueries({ queryKey: ["nfse-emitidas"] });
    resetNfse();
    setOpenServico(false);
  };

  const totalNfeMes = nfes.reduce((s, n: any) => s + Number(n.valor_total || 0), 0);
  const totalNfseMes = nfses.reduce((s, n: any) => s + Number(n.valor_servicos || 0), 0);

  // PDF / Cancel / CC-e handlers
  const downloadNfePdf = async (nfe: any) => {
    const { data: itens } = await supabase
      .from("nfe_itens")
      .select("*")
      .eq("nfe_id", nfe.id)
      .order("numero_item");
    gerarPDFNFe({ ...nfe, itens: itens || [] });
  };

  const downloadNfsePdf = (nfse: any) => gerarPDFNFSe(nfse);

  const confirmarCancelamento = async () => {
    if (!cancelTarget || !user) return;
    if (cancelMotivo.trim().length < 15) {
      toast.error("Motivo deve ter no mínimo 15 caracteres (exigência SEFAZ)");
      return;
    }
    const table = cancelTarget.tipo === "nfe" ? "nfe_emitidas" : "nfse_emitidas";
    const { error } = await supabase
      .from(table)
      .update({
        status: "cancelada",
        cancelada_em: new Date().toISOString(),
        motivo_cancelamento: cancelMotivo,
      })
      .eq("id", cancelTarget.id);
    if (error) {
      toast.error("Erro ao cancelar: " + error.message);
      return;
    }
    await supabase.from("nf_eventos").insert({
      user_id: user.id,
      [cancelTarget.tipo === "nfe" ? "nfe_id" : "nfse_id"]: cancelTarget.id,
      tipo: "cancelamento",
      descricao: cancelMotivo,
    });
    toast.success(`${cancelTarget.tipo === "nfe" ? "NF-e" : "NFS-e"} ${cancelTarget.numero} cancelada`);
    queryClient.invalidateQueries({ queryKey: [`${cancelTarget.tipo}-emitidas`] });
    setCancelTarget(null);
    setCancelMotivo("");
  };

  const confirmarCce = async () => {
    if (!cceTarget || !user) return;
    if (cceTexto.trim().length < 15) {
      toast.error("Texto da correção deve ter no mínimo 15 caracteres");
      return;
    }
    const novaSeq = (cceTarget.sequencia || 0) + 1;
    const { error } = await supabase
      .from("nfe_emitidas")
      .update({
        cce_texto: cceTexto,
        cce_data: new Date().toISOString(),
        cce_sequencia: novaSeq,
      })
      .eq("id", cceTarget.id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    await supabase.from("nf_eventos").insert({
      user_id: user.id,
      nfe_id: cceTarget.id,
      tipo: "cce",
      descricao: cceTexto,
      sequencia: novaSeq,
    });
    toast.success(`Carta de correção #${novaSeq} registrada para NF-e ${cceTarget.numero}`);
    queryClient.invalidateQueries({ queryKey: ["nfe-emitidas"] });
    setCceTarget(null);
    setCceTexto("");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" /> Notas Fiscais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Emissão de NF-e (produtos) e NFS-e (serviços)
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openProduto} onOpenChange={setOpenProduto}>
            <DialogTrigger asChild>
              <Button><Package className="w-4 h-4" /> Emitir NF-e</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Emitir Nota Fiscal de Produto (NF-e)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente (destinatário)</Label>
                    <Select value={nfeClient} onValueChange={setNfeClient}>
                      <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número da NF</Label>
                    <Input value={nfeNumero} onChange={e => setNfeNumero(e.target.value)} placeholder="Ex.: 000001" />
                  </div>
                  <div>
                    <Label>Natureza da operação</Label>
                    <Input value={nfeNatureza} onChange={e => setNfeNatureza(e.target.value)} />
                  </div>
                  <div>
                    <Label>UF destino</Label>
                    <Input value={nfeUf} onChange={e => setNfeUf(e.target.value.toUpperCase())} maxLength={2} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base">Itens</Label>
                    <Button size="sm" variant="outline" onClick={addItem}>
                      <Plus className="w-4 h-4" /> Item
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {itens.map((it, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                          {itens.length > 1 && (
                            <Button size="sm" variant="ghost" onClick={() => removeItem(idx)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <Input placeholder="Descrição" value={it.descricao} onChange={e => updateItem(idx, { descricao: e.target.value })} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input placeholder="NCM" value={it.ncm} onChange={e => updateItem(idx, { ncm: e.target.value })} />
                          <Input placeholder="CFOP" value={it.cfop} onChange={e => updateItem(idx, { cfop: e.target.value })} />
                          <Input placeholder="Un" value={it.unidade} onChange={e => updateItem(idx, { unidade: e.target.value })} />
                          <Input type="number" placeholder="Qtd" value={it.quantidade} onChange={e => updateItem(idx, { quantidade: Number(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input type="number" step="0.01" placeholder="Valor unit." value={it.valor_unitario} onChange={e => updateItem(idx, { valor_unitario: Number(e.target.value) })} />
                          <Input type="number" step="0.01" placeholder="ICMS %" value={it.icms_aliquota} onChange={e => updateItem(idx, { icms_aliquota: Number(e.target.value) })} />
                          <Input type="number" step="0.01" placeholder="IPI %" value={it.ipi_aliquota} onChange={e => updateItem(idx, { ipi_aliquota: Number(e.target.value) })} />
                          <div className="text-right text-sm font-mono pt-2">
                            Subtotal: <span className="font-semibold">R$ {(it.quantidade * it.valor_unitario).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Textarea placeholder="Informações complementares" value={nfeInfo} onChange={e => setNfeInfo(e.target.value)} rows={2} />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50">
                  <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-mono font-semibold">R$ {totalProdutos.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">ICMS</p><p className="font-mono font-semibold">R$ {totalIcms.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">IPI</p><p className="font-mono font-semibold">R$ {totalIpi.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total NF</p><p className="font-mono font-bold text-primary">R$ {totalNfe.toFixed(2)}</p></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenProduto(false)}>Cancelar</Button>
                <Button onClick={emitirNfe}>Emitir NF-e</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={openServico} onOpenChange={setOpenServico}>
            <DialogTrigger asChild>
              <Button variant="outline"><Briefcase className="w-4 h-4" /> Emitir NFS-e</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Emitir Nota Fiscal de Serviço (NFS-e)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Cliente (tomador)</Label>
                    <Select value={nfseClient} onValueChange={setNfseClient}>
                      <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Número da NFS-e</Label>
                    <Input value={nfseNumero} onChange={e => setNfseNumero(e.target.value)} placeholder="Ex.: 000001" />
                  </div>
                  <div>
                    <Label>Município de prestação</Label>
                    <Input value={nfseMunicipio} onChange={e => setNfseMunicipio(e.target.value)} />
                  </div>
                  <div>
                    <Label>Código de serviço (LC 116)</Label>
                    <Input value={nfseCodigo} onChange={e => setNfseCodigo(e.target.value)} placeholder="Ex.: 17.19" />
                  </div>
                </div>

                <div>
                  <Label>Discriminação dos serviços</Label>
                  <Textarea value={nfseDiscriminacao} onChange={e => setNfseDiscriminacao(e.target.value)} rows={3} placeholder="Descreva os serviços prestados" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Valor dos serviços</Label>
                    <Input type="number" step="0.01" value={nfseValor} onChange={e => setNfseValor(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Deduções</Label>
                    <Input type="number" step="0.01" value={nfseDeducoes} onChange={e => setNfseDeducoes(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>ISS %</Label>
                    <Input type="number" step="0.01" value={nfseIss} onChange={e => setNfseIss(Number(e.target.value))} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
                  <div><p className="text-xs text-muted-foreground">Base de cálculo</p><p className="font-mono font-semibold">R$ {baseCalc.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">ISS</p><p className="font-mono font-semibold">R$ {issValor.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Valor líquido</p><p className="font-mono font-bold text-primary">R$ {valorLiquido.toFixed(2)}</p></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenServico(false)}>Cancelar</Button>
                <Button onClick={emitirNfse}>Emitir NFS-e</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">NF-e emitidas</p>
          <p className="text-2xl font-bold font-display text-primary">{nfes.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">NFS-e emitidas</p>
          <p className="text-2xl font-bold font-display text-primary">{nfses.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Total NF-e</p>
          <p className="text-2xl font-bold font-display">R$ {(totalNfeMes / 1000).toFixed(1)}k</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Total NFS-e</p>
          <p className="text-2xl font-bold font-display">R$ {(totalNfseMes / 1000).toFixed(1)}k</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="nfe">
        <TabsList>
          <TabsTrigger value="nfe"><Package className="w-4 h-4" /> NF-e (Produtos)</TabsTrigger>
          <TabsTrigger value="nfse"><Briefcase className="w-4 h-4" /> NFS-e (Serviços)</TabsTrigger>
        </TabsList>

        <TabsContent value="nfe">
          <Card>
            <CardHeader><CardTitle className="font-display">NF-e Emitidas</CardTitle><CardDescription>Histórico de notas fiscais de produto</CardDescription></CardHeader>
            <CardContent>
              {nfes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma NF-e emitida ainda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                      <th className="text-left py-2 px-3">Número</th>
                      <th className="text-left py-2 px-3 hidden md:table-cell">Destinatário</th>
                      <th className="text-left py-2 px-3 hidden lg:table-cell">Natureza</th>
                      <th className="text-right py-2 px-3">Valor</th>
                      <th className="text-center py-2 px-3">Status</th>
                      <th className="w-10"></th>
                    </tr></thead>
                    <tbody>
                      {nfes.map((n: any) => (
                        <tr key={n.id} className="border-t hover:bg-muted/30">
                          <td className="py-2 px-3 font-mono">
                            {n.numero}/{n.serie}
                            {(n.cce_sequencia ?? 0) > 0 && (
                              <span className="ml-2 text-[10px] text-info">CC-e #{n.cce_sequencia}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 hidden md:table-cell">{n.razao_destinatario || "-"}</td>
                          <td className="py-2 px-3 text-muted-foreground hidden lg:table-cell">{n.natureza_operacao || "-"}</td>
                          <td className="py-2 px-3 text-right font-mono">R$ {Number(n.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={n.status === "cancelada" ? "destructive" : "default"}>{n.status}</Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Ver detalhes / histórico" onClick={() => setDetalheTarget({ id: n.id, tipo: "nfe", numero: n.numero, serie: n.serie })}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Baixar DANFE" onClick={() => downloadNfePdf(n)}>
                                <Download className="w-4 h-4" />
                              </Button>
                              {n.status !== "cancelada" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Cancelar NF-e"
                                  onClick={() => setCancelTarget({ id: n.id, tipo: "nfe", numero: n.numero })}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setDetalheTarget({ id: n.id, tipo: "nfe", numero: n.numero, serie: n.serie })}>
                                    <History className="w-4 h-4 mr-2" /> Histórico de eventos
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => downloadNfePdf(n)}>
                                    <Download className="w-4 h-4 mr-2" /> Baixar DANFE (PDF)
                                  </DropdownMenuItem>
                                  {n.status !== "cancelada" && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => setCceTarget({ id: n.id, numero: n.numero, sequencia: n.cce_sequencia ?? 0 })}>
                                        <FileEdit className="w-4 h-4 mr-2" /> Carta de correção
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setCancelTarget({ id: n.id, tipo: "nfe", numero: n.numero })}
                                      >
                                        <Ban className="w-4 h-4 mr-2" /> Cancelar NF-e
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfse">
          <Card>
            <CardHeader><CardTitle className="font-display">NFS-e Emitidas</CardTitle><CardDescription>Histórico de notas fiscais de serviço</CardDescription></CardHeader>
            <CardContent>
              {nfses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma NFS-e emitida ainda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                      <th className="text-left py-2 px-3">Número</th>
                      <th className="text-left py-2 px-3 hidden md:table-cell">Tomador</th>
                      <th className="text-left py-2 px-3 hidden lg:table-cell">Discriminação</th>
                      <th className="text-right py-2 px-3">Valor</th>
                      <th className="text-right py-2 px-3 hidden sm:table-cell">ISS</th>
                      <th className="text-center py-2 px-3">Status</th>
                      <th className="w-10"></th>
                    </tr></thead>
                    <tbody>
                      {nfses.map((n: any) => (
                        <tr key={n.id} className="border-t hover:bg-muted/30">
                          <td className="py-2 px-3 font-mono">{n.numero}/{n.serie}</td>
                          <td className="py-2 px-3 hidden md:table-cell">{n.razao_tomador || "-"}</td>
                          <td className="py-2 px-3 text-muted-foreground max-w-xs truncate hidden lg:table-cell">{n.discriminacao}</td>
                          <td className="py-2 px-3 text-right font-mono">R$ {Number(n.valor_servicos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-right font-mono hidden sm:table-cell">R$ {Number(n.iss_valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={n.status === "cancelada" ? "destructive" : "default"}>{n.status}</Badge>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Ver detalhes / histórico" onClick={() => setDetalheTarget({ id: n.id, tipo: "nfse", numero: n.numero, serie: n.serie })}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Baixar PDF" onClick={() => downloadNfsePdf(n)}>
                                <Download className="w-4 h-4" />
                              </Button>
                              {n.status !== "cancelada" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Cancelar NFS-e"
                                  onClick={() => setCancelTarget({ id: n.id, tipo: "nfse", numero: n.numero })}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalhes da nota com histórico de eventos */}
      <Dialog open={!!detalheTarget} onOpenChange={(o) => !o && setDetalheTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              {detalheTarget?.tipo === "nfe" ? "NF-e" : "NFS-e"} {detalheTarget?.numero}/{detalheTarget?.serie}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="historico">
            <TabsList>
              <TabsTrigger value="historico"><History className="w-4 h-4" /> Histórico de eventos</TabsTrigger>
            </TabsList>
            <TabsContent value="historico" className="mt-4">
              {detalheTarget && (
                <HistoricoEventos notaId={detalheTarget.id} tipo={detalheTarget.tipo} />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Cancelamento */}
      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar {cancelTarget?.tipo === "nfe" ? "NF-e" : "NFS-e"} {cancelTarget?.numero}?</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo do cancelamento (mínimo 15 caracteres). Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancelMotivo}
            onChange={(e) => setCancelMotivo(e.target.value)}
            placeholder="Ex.: Erro de digitação no valor unitário do item 1"
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelMotivo("")}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCancelamento} className="bg-destructive hover:bg-destructive/90">
              Confirmar cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Carta de correção */}
      <AlertDialog open={!!cceTarget} onOpenChange={(o) => !o && setCceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Carta de correção — NF-e {cceTarget?.numero}</AlertDialogTitle>
            <AlertDialogDescription>
              Permitida apenas para corrigir informações que não alterem valor, quantidade, partes ou data. Sequência: #{(cceTarget?.sequencia ?? 0) + 1}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cceTexto}
            onChange={(e) => setCceTexto(e.target.value)}
            placeholder="Ex.: Onde se lê 'CFOP 5101' leia-se 'CFOP 5102'"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCceTexto("")}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCce}>Registrar correção</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
