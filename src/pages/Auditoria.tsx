import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
 import { ShieldAlert, Ban, FileEdit, RefreshCw, History, Loader2, Download } from "lucide-react";
 import jsPDF from "jspdf";
 import autoTable from "jspdf-autotable";
 

type Evento = {
  id: string;
  tipo: string;
  descricao: string | null;
  protocolo: string | null;
  sequencia: number | null;
  created_at: string;
  nfe_id: string | null;
  nfse_id: string | null;
};

const tipoConfig: Record<string, { label: string; icon: any; color: string }> = {
  cancelamento: { label: "Cancelamento", icon: Ban, color: "bg-destructive/10 text-destructive border-destructive/30" },
  cce: { label: "Carta de correção", icon: FileEdit, color: "bg-info/10 text-info border-info/30" },
  reenvio: { label: "Reenvio", icon: RefreshCw, color: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  emissao: { label: "Emissão", icon: History, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
};

 export default function Auditoria() {
   const { user } = useAuth();
   const location = useLocation();

   useEffect(() => {
     const params = new URLSearchParams(location.search);
     const tipo = params.get("tipo");
     if (tipo) {
       setTipoFilter(tipo);
     }
   }, [location.search]);
   const [tipoFilter, setTipoFilter] = useState("all");
  const [notaFilter, setNotaFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["nf-eventos-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nf_eventos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data || []) as Evento[];
    },
    enabled: !!user,
  });

  const { data: nfeMap = {} } = useQuery({
    queryKey: ["nfe-numeros"],
    queryFn: async () => {
      const { data } = await supabase.from("nfe_emitidas").select("id, numero, serie");
      const m: Record<string, string> = {};
      (data || []).forEach((n: any) => { m[n.id] = `NF-e ${n.numero}/${n.serie}`; });
      return m;
    },
    enabled: !!user,
  });

  const { data: nfseMap = {} } = useQuery({
    queryKey: ["nfse-numeros"],
    queryFn: async () => {
      const { data } = await supabase.from("nfse_emitidas").select("id, numero, serie");
      const m: Record<string, string> = {};
      (data || []).forEach((n: any) => { m[n.id] = `NFS-e ${n.numero}/${n.serie}`; });
      return m;
    },
    enabled: !!user,
  });

  const filtered = useMemo(() => {
    return eventos.filter(e => {
      if (tipoFilter !== "all" && e.tipo !== tipoFilter) return false;
      if (dateFrom && new Date(e.created_at) < new Date(dateFrom + "T00:00:00")) return false;
      if (dateTo && new Date(e.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (notaFilter) {
        const ref = (e.nfe_id ? nfeMap[e.nfe_id] : nfseMap[e.nfse_id || ""]) || "";
        if (!ref.toLowerCase().includes(notaFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [eventos, tipoFilter, dateFrom, dateTo, notaFilter, nfeMap, nfseMap]);

   const stats = useMemo(() => ({
     total: eventos.length,
     cancelamentos: eventos.filter(e => e.tipo === "cancelamento").length,
     cces: eventos.filter(e => e.tipo === "cce").length,
     reenvios: eventos.filter(e => e.tipo === "reenvio").length,
   }), [eventos]);
 
   const exportPDF = () => {
     const doc = new jsPDF({ unit: "mm", format: "a4" });
     const W = doc.internal.pageSize.getWidth();
 
     // Cabeçalho do Escritório
     doc.setFillColor(37, 99, 235);
     doc.rect(0, 0, W, 25, "F");
     doc.setTextColor(255, 255, 255);
     doc.setFont("helvetica", "bold");
     doc.setFontSize(18);
     doc.text("Seu Contador IA", 12, 12);
     doc.setFontSize(9);
     doc.setFont("helvetica", "normal");
     doc.text("Relatório Mensal de Auditoria de Eventos Fiscais", 12, 18);
     doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, W - 12, 12, { align: "right" });
 
     doc.setTextColor(0, 0, 0);
     let y = 35;
 
     // Filtros Aplicados
     doc.setFont("helvetica", "bold");
     doc.setFontSize(10);
     doc.text("Filtros Aplicados:", 12, y);
     doc.setFont("helvetica", "normal");
     doc.setFontSize(9);
     const filtrosStr = [
       tipoFilter !== "all" ? `Tipo: ${tipoConfig[tipoFilter]?.label}` : "Tipo: Todos",
       notaFilter ? `Nota: ${notaFilter}` : null,
       dateFrom ? `De: ${new Date(dateFrom).toLocaleDateString("pt-BR")}` : null,
       dateTo ? `Até: ${new Date(dateTo).toLocaleDateString("pt-BR")}` : null,
     ].filter(Boolean).join("  |  ");
     doc.text(filtrosStr, 12, y + 5);
     y += 15;
 
     // Estatísticas
     autoTable(doc, {
       startY: y,
       head: [["Total Eventos", "Cancelamentos", "CC-e", "Reenvios"]],
       body: [[stats.total, stats.cancelamentos, stats.cces, stats.reenvios]],
       styles: { fontSize: 9, halign: "center" },
       headStyles: { fillColor: [71, 85, 105] },
       margin: { left: 12, right: 12 },
     });
     y = (doc as any).lastAutoTable.finalY + 10;
 
     // Tabela de Eventos
     autoTable(doc, {
       startY: y,
       head: [["Data/Hora", "Tipo", "Referência", "Descrição/Protocolo"]],
       body: filtered.map(ev => [
         new Date(ev.created_at).toLocaleString("pt-BR"),
         tipoConfig[ev.tipo]?.label || ev.tipo,
         (ev.nfe_id ? nfeMap[ev.nfe_id] : nfseMap[ev.nfse_id || ""]) || "—",
         `${ev.descricao || ""}${ev.protocolo ? " (Prot: " + ev.protocolo + ")" : ""}`
       ]),
       styles: { fontSize: 8 },
       headStyles: { fillColor: [37, 99, 235] },
       columnStyles: {
         0: { cellWidth: 35 },
         1: { cellWidth: 30 },
         2: { cellWidth: 35 },
       },
       margin: { left: 12, right: 12 },
     });
 
     doc.save("auditoria-eventos.pdf");
   };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <ShieldAlert className="w-7 h-7 sm:w-8 sm:h-8 text-primary" /> Auditoria de Eventos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Histórico completo de cancelamentos, cartas de correção e reenvios das notas fiscais
        </p>
      </div>

       <div className="flex justify-end mb-2">
         <Button onClick={exportPDF} variant="outline" size="sm" className="gap-2">
           <Download className="w-4 h-4" /> Exportar PDF
         </Button>
       </div>
 
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total eventos</p><p className="text-2xl font-bold font-display text-primary">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Cancelamentos</p><p className="text-2xl font-bold font-display text-destructive">{stats.cancelamentos}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Cartas de correção</p><p className="text-2xl font-bold font-display text-info">{stats.cces}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Reenvios</p><p className="text-2xl font-bold font-display text-amber-600">{stats.reenvios}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Filtros</CardTitle>
          <CardDescription>{filtered.length} de {eventos.length} eventos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                  <SelectItem value="cce">Carta de correção</SelectItem>
                  <SelectItem value="reenvio">Reenvio</SelectItem>
                  <SelectItem value="emissao">Emissão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Buscar nota</Label>
              <Input placeholder="Nº ou série" value={notaFilter} onChange={e => setNotaFilter(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data de</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Data até</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum evento encontrado</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-border space-y-6">
              {filtered.map(ev => {
                const cfg = tipoConfig[ev.tipo] || tipoConfig.emissao;
                const Icon = cfg.icon;
                const ref = ev.nfe_id ? nfeMap[ev.nfe_id] : (ev.nfse_id ? nfseMap[ev.nfse_id] : "—");
                return (
                  <div key={ev.id} className="relative">
                    <div className={`absolute -left-[34px] w-10 h-10 rounded-full flex items-center justify-center border-2 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cfg.color}>{cfg.label}</Badge>
                          <span className="font-mono text-sm font-semibold">{ref || "—"}</span>
                          {ev.sequencia && ev.sequencia > 0 && (
                            <Badge variant="secondary" className="text-[10px]">#{ev.sequencia}</Badge>
                          )}
                        </div>
                        {ev.descricao && (
                          <p className="text-sm text-muted-foreground mt-1 break-words">{ev.descricao}</p>
                        )}
                        {ev.protocolo && (
                          <p className="text-xs font-mono text-muted-foreground mt-1">Protocolo: {ev.protocolo}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
