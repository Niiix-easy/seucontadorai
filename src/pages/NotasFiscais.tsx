import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Briefcase, Receipt } from "lucide-react";
import { toast } from "sonner";
import { gerarPDFNFe, gerarPDFNFSe } from "@/lib/pdf-notas";
import { NFFiltros, emptyFilters, applyNFFilters, exportNotasCsv, type NFFilters } from "@/components/NFFiltros";
import { NFeForm } from "@/components/notas/NFeForm";
import { NFSeForm } from "@/components/notas/NFSeForm";
import { NFeTable } from "@/components/notas/NFeTable";
import { NFSeTable } from "@/components/notas/NFSeTable";
import { NFDialogs, type CancelTarget, type CceTarget, type DetalheTarget } from "@/components/notas/NFDialogs";
import { NFCharts } from "@/components/notas/NFCharts";

export default function NotasFiscais() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openProduto, setOpenProduto] = useState(false);
  const [openServico, setOpenServico] = useState(false);

  const [cancelTarget, setCancelTarget] = useState<CancelTarget>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cceTarget, setCceTarget] = useState<CceTarget>(null);
  const [cceTexto, setCceTexto] = useState("");
  const [detalheTarget, setDetalheTarget] = useState<DetalheTarget>(null);
  const [filtersNfe, setFiltersNfe] = useState<NFFilters>(emptyFilters);
  const [filtersNfse, setFiltersNfse] = useState<NFFilters>(emptyFilters);

  const { data: clients = [] } = useQuery({
    queryKey: ["nf-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, company_name, cnpj").eq("status", "active").order("company_name");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: nfes = [] } = useQuery({
    queryKey: ["nfe-emitidas"],
    queryFn: async () => {
      const { data } = await supabase.from("nfe_emitidas").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: nfses = [] } = useQuery({
    queryKey: ["nfse-emitidas"],
    queryFn: async () => {
      const { data } = await supabase.from("nfse_emitidas").select("*").order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user,
  });

  const totalNfeMes = nfes.reduce((s, n: any) => s + Number(n.valor_total || 0), 0);
  const totalNfseMes = nfses.reduce((s, n: any) => s + Number(n.valor_servicos || 0), 0);

  const downloadNfePdf = async (nfe: any) => {
    const { data: itens } = await supabase.from("nfe_itens").select("*").eq("nfe_id", nfe.id).order("numero_item");
    gerarPDFNFe({ ...nfe, itens: itens || [] });
  };

  const confirmarCancelamento = async () => {
    if (!cancelTarget || !user) return;
    if (cancelMotivo.trim().length < 15) { toast.error("Motivo deve ter no mínimo 15 caracteres"); return; }
    const table = cancelTarget.tipo === "nfe" ? "nfe_emitidas" : "nfse_emitidas";
    const { error } = await supabase.from(table).update({
      status: "cancelada", cancelada_em: new Date().toISOString(), motivo_cancelamento: cancelMotivo,
    }).eq("id", cancelTarget.id);
    if (error) { toast.error("Erro: " + error.message); return; }
     const { data: evento } = await supabase.from("nf_eventos").insert({
       user_id: user.id,
       [cancelTarget.tipo === "nfe" ? "nfe_id" : "nfse_id"]: cancelTarget.id,
       tipo: "cancelamento", descricao: cancelMotivo,
     }).select().single();
 
     if (evento) {
       await supabase.from("notifications").insert({
         user_id: user.id,
         title: `${cancelTarget.tipo === "nfe" ? "NF-e" : "NFS-e"} Cancelada`,
         message: `A nota ${cancelTarget.numero} foi cancelada: ${cancelMotivo.substring(0, 50)}...`,
          type: "audit",
          link: "/auditoria?tipo=cancelamento"
       });
     }
 
    toast.success(`${cancelTarget.tipo === "nfe" ? "NF-e" : "NFS-e"} ${cancelTarget.numero} cancelada`);
    queryClient.invalidateQueries({ queryKey: [`${cancelTarget.tipo}-emitidas`] });
    setCancelTarget(null); setCancelMotivo("");
  };

  const confirmarCce = async () => {
    if (!cceTarget || !user) return;
    if (cceTexto.trim().length < 15) { toast.error("Texto deve ter no mínimo 15 caracteres"); return; }
    const novaSeq = (cceTarget.sequencia || 0) + 1;
    const { error } = await supabase.from("nfe_emitidas").update({
      cce_texto: cceTexto, cce_data: new Date().toISOString(), cce_sequencia: novaSeq,
    }).eq("id", cceTarget.id);
    if (error) { toast.error("Erro: " + error.message); return; }
     const { data: evento } = await supabase.from("nf_eventos").insert({
       user_id: user.id, nfe_id: cceTarget.id, tipo: "cce", descricao: cceTexto, sequencia: novaSeq,
     }).select().single();
 
     if (evento) {
       await supabase.from("notifications").insert({
         user_id: user.id,
         title: "Carta de Correção Registrada",
         message: `Nova CC-e (#${novaSeq}) para a NF-e ${cceTarget.numero}: ${cceTexto.substring(0, 50)}...`,
          type: "audit",
          link: "/auditoria?tipo=cce"
       });
     }
 
    toast.success(`CC-e #${novaSeq} registrada`);
    queryClient.invalidateQueries({ queryKey: ["nfe-emitidas"] });
    setCceTarget(null); setCceTexto("");
  };

  const nfesFiltradas = applyNFFilters(nfes, filtersNfe, { dateField: "data_emissao", valueField: "valor_total" });
  const nfsesFiltradas = applyNFFilters(nfses, filtersNfse, { dateField: "data_emissao", valueField: "valor_servicos" });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Receipt className="w-7 h-7 sm:w-8 sm:h-8 text-primary" /> Notas Fiscais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Emissão de NF-e (produtos) e NFS-e (serviços)</p>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Dialog open={openProduto} onOpenChange={setOpenProduto}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto"><Package className="w-4 h-4" /> Emitir NF-e</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl sm:max-h-[90vh] sm:overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Emitir Nota Fiscal de Produto (NF-e)</DialogTitle></DialogHeader>
              {user && (
                <NFeForm
                  userId={user.id}
                  clients={clients}
                  onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["nfe-emitidas"] }); setOpenProduto(false); }}
                  onCancel={() => setOpenProduto(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={openServico} onOpenChange={setOpenServico}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto"><Briefcase className="w-4 h-4" /> Emitir NFS-e</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] sm:overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Emitir Nota Fiscal de Serviço (NFS-e)</DialogTitle></DialogHeader>
              {user && (
                <NFSeForm
                  userId={user.id}
                  clients={clients}
                  onSuccess={() => { queryClient.invalidateQueries({ queryKey: ["nfse-emitidas"] }); setOpenServico(false); }}
                  onCancel={() => setOpenServico(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NF-e emitidas</p><p className="text-2xl font-bold font-display text-primary">{nfes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NFS-e emitidas</p><p className="text-2xl font-bold font-display text-primary">{nfses.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total NF-e</p><p className="text-2xl font-bold font-display">R$ {(totalNfeMes / 1000).toFixed(1)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total NFS-e</p><p className="text-2xl font-bold font-display">R$ {(totalNfseMes / 1000).toFixed(1)}k</p></CardContent></Card>
      </div>

      <NFCharts nfes={nfes} nfses={nfses} clients={clients} />

      <Tabs defaultValue="nfe">
        <TabsList>
          <TabsTrigger value="nfe"><Package className="w-4 h-4" /> NF-e (Produtos)</TabsTrigger>
          <TabsTrigger value="nfse"><Briefcase className="w-4 h-4" /> NFS-e (Serviços)</TabsTrigger>
        </TabsList>

        <TabsContent value="nfe">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="font-display">NF-e Emitidas</CardTitle>
                <CardDescription>Histórico de notas fiscais de produto</CardDescription>
              </div>
              <NFFiltros
                filters={filtersNfe}
                onChange={setFiltersNfe}
                clients={clients}
                totalFiltered={nfesFiltradas.length}
                onExportCsv={() => exportNotasCsv(nfesFiltradas, "nfe-emitidas", [
                  { key: "numero", label: "Número" },
                  { key: "serie", label: "Série" },
                  { key: "razao_destinatario", label: "Destinatário" },
                  { key: "cnpj_destinatario", label: "CNPJ" },
                  { key: "natureza_operacao", label: "Natureza" },
                  { key: "data_emissao", label: "Data Emissão", format: (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
                  { key: "valor_total", label: "Valor Total", format: (v) => Number(v || 0).toFixed(2) },
                  { key: "status", label: "Status" },
                ])}
              />
            </CardHeader>
            <CardContent>
              <NFeTable
                notas={nfesFiltradas}
                onView={(n) => setDetalheTarget({ id: n.id, tipo: "nfe", numero: n.numero, serie: n.serie })}
                onDownload={downloadNfePdf}
                onCancel={(n) => setCancelTarget({ id: n.id, tipo: "nfe", numero: n.numero })}
                onCce={(n) => setCceTarget({ id: n.id, numero: n.numero, sequencia: n.cce_sequencia ?? 0 })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfse">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="font-display">NFS-e Emitidas</CardTitle>
                <CardDescription>Histórico de notas fiscais de serviço</CardDescription>
              </div>
              <NFFiltros
                filters={filtersNfse}
                onChange={setFiltersNfse}
                clients={clients}
                totalFiltered={nfsesFiltradas.length}
                onExportCsv={() => exportNotasCsv(nfsesFiltradas, "nfse-emitidas", [
                  { key: "numero", label: "Número" },
                  { key: "serie", label: "Série" },
                  { key: "razao_tomador", label: "Tomador" },
                  { key: "cnpj_tomador", label: "CNPJ" },
                  { key: "discriminacao", label: "Discriminação" },
                  { key: "data_emissao", label: "Data Emissão", format: (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "" },
                  { key: "valor_servicos", label: "Valor", format: (v) => Number(v || 0).toFixed(2) },
                  { key: "iss_valor", label: "ISS", format: (v) => Number(v || 0).toFixed(2) },
                  { key: "status", label: "Status" },
                ])}
              />
            </CardHeader>
            <CardContent>
              <NFSeTable
                notas={nfsesFiltradas}
                onView={(n) => setDetalheTarget({ id: n.id, tipo: "nfse", numero: n.numero, serie: n.serie })}
                onDownload={gerarPDFNFSe}
                onCancel={(n) => setCancelTarget({ id: n.id, tipo: "nfse", numero: n.numero })}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NFDialogs
        detalheTarget={detalheTarget} setDetalheTarget={setDetalheTarget}
        cancelTarget={cancelTarget} setCancelTarget={setCancelTarget}
        cancelMotivo={cancelMotivo} setCancelMotivo={setCancelMotivo}
        onConfirmCancel={confirmarCancelamento}
        cceTarget={cceTarget} setCceTarget={setCceTarget}
        cceTexto={cceTexto} setCceTexto={setCceTexto}
        onConfirmCce={confirmarCce}
      />
    </div>
  );
}
