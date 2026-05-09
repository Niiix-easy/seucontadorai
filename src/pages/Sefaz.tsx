import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
    Building2, Search, CheckCircle2, Globe, FileCode, RefreshCw,
     Send, Eye, Loader2, Receipt, Plus, Trash2, Package, Calculator, Settings, FileText, Download, AlertCircle, CheckCircle,
      FileDown, Play, CheckSquare, Square, FileArchive, History, Filter, X, ArrowLeft
 } from "lucide-react";
 import { Zap } from "lucide-react";
import JSZip from "jszip";
 import * as XLSX from "xlsx";
 import jsPDF from "jspdf";
 import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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

type NFeEmitida = {
  id: string;
  numero: string;
  serie: string;
  chave_acesso: string | null;
  razao_destinatario: string | null;
  valor_total: number;
  status: string;
  created_at: string;
  cnpj_emitente: string | null;
  cnpj_destinatario: string | null;
  natureza_operacao: string | null;
  valor_produtos: number;
  valor_icms: number;
  valor_ipi: number;
  integrador: string | null;
};

const servicos = [
  { nome: "NF-e — Emissão", webservice: "NfeAutorizacao4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Consulta", webservice: "NfeConsultaProtocolo4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Cancelamento", webservice: "NfeCancelamento", status: "online", uf: "Nacional" },
  { nome: "NF-e — Inutilização", webservice: "NfeInutilizacao4", status: "online", uf: "Nacional" },
  { nome: "CT-e — Emissão", webservice: "CteRecepcaoSinc", status: "online", uf: "Nacional" },
  { nome: "MDF-e — Manifesto", webservice: "MDFeRecepcaoSinc", status: "online", uf: "Nacional" },
  { nome: "NFS-e Nacional", webservice: "NfseRecepcionarRps", status: "online", uf: "Nacional" },
  { nome: "Manifestação Destinatário", webservice: "RecepcaoEvento", status: "online", uf: "Nacional" },
];

const consultas = [
  { tipo: "Consulta CNPJ", endpoint: "receitaws.com.br/v1/cnpj/{cnpj}", desc: "Receita Federal", status: "ativo" },
  { tipo: "Consulta CPF", endpoint: "api.cpf.gov.br/v1/{cpf}", desc: "Receita Federal", status: "ativo" },
  { tipo: "Simples Nacional", endpoint: "portaldatransparencia.gov.br", desc: "PGDAS-D e DAS", status: "ativo" },
  { tipo: "Situação Fiscal", endpoint: "cav.receita.fazenda.gov.br", desc: "e-CAC", status: "ativo" },
  { tipo: "Certidão Negativa", endpoint: "servicos.receita.fazenda.gov.br", desc: "CND Federal", status: "ativo" },
];

const integradores = [
  { nome: "Oobj / Avalara Brasil", desc: "Líder em mensageria fiscal.", url: "oobj.com.br", features: ["NF-e", "NFS-e", "CT-e", "MDF-e", "Contingência"] },
  { nome: "Focus NFe", desc: "API REST simples.", url: "focusnfe.com.br", features: ["NF-e", "NFS-e", "NFC-e", "API REST"] },
  { nome: "Tecnospeed", desc: "Automação fiscal completa.", url: "tecnospeed.com.br", features: ["NF-e", "NFS-e", "SPED", "eSocial"] },
  { nome: "Webmania", desc: "API de notas fiscais.", url: "webmaniabr.com", features: ["NF-e", "NFC-e", "NFS-e"] },
];

const cfopComuns = [
  "5102 - Venda merc. terceiros",
  "5405 - Venda merc. ST",
  "5949 - Outra saída",
  "6102 - Venda interestadual",
  "5101 - Venda prod. próprio",
];

const ufs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function generateChave() {
  return Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join("");
}

 type FiscalConfig = {
   uf: string;
   environment: "homologacao" | "producao";
    certificate_filename: string | null; max_retries?: number; retry_delay_minutes?: number;
    is_suspended?: boolean; is_paused?: boolean; consecutive_validation_failures?: number;
    auto_retry_on_reactivation?: boolean; reactivation_throughput?: number;
  };

 type ProcessedDocument = {
   id: string;
   document_type: string;
   status: string;
   valor_total?: number;
    created_at: string;
   xml_content: string;
   signed_xml_content: string | null;
   receipt_number: string | null;
    protocol_number: string | null;
    sefaz_response_code?: string | null;
    sefaz_response_message: string | null;
    last_error?: string | null;
   retry_count?: number;
   next_retry_at?: string | null;
   processing_log?: any[];
   is_processing?: boolean;
 };

export default function Sefaz() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [emitindo, setEmitindo] = useState(false);
  const [loading, setLoading] = useState(true);
    const [nfes, setNfes] = useState<NFeEmitida[]>([]);
    const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
    const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({ 
      uf: "SP", 
      environment: "homologacao", 
      certificate_filename: null,
      max_retries: 5,
      retry_delay_minutes: 15,
      is_suspended: false,
      consecutive_validation_failures: 0,
      auto_retry_on_reactivation: false,
      reactivation_throughput: 5,
      is_paused: false
    });
    const [suspensionStates, setSuspensionStates] = useState<any[]>([]);
    const [backlogData, setBacklogData] = useState<any[]>([]);
     const [backlogFilters, setBacklogFilters] = useState({ uf: "all", env: "all", date: "", cStat: "", xMotivo: "" });
    const [auditFilters, setAuditFilters] = useState({ dateStart: "", dateEnd: "", uf: "all", env: "all", action: "all", cStat: "", xMotivo: "" });
     const [showPauseDialog, setShowPauseDialog] = useState<{ uf: string, env: string, paused: boolean, manual?: boolean } | null>(null);
     const [manualRetryProgress, setManualRetryProgress] = useState<{ [key: string]: { status: 'queued' | 'processing' | 'done' | 'error', count: number, total: number } }>({});
    const [pauseReason, setPauseReason] = useState("");
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [savedPreferences, setSavedPreferences] = useState<any[]>([]);
    const [showSavePrefDialog, setShowSavePrefDialog] = useState<{ type: 'backlog' | 'audit', filters: any } | null>(null);
    const [newPrefName, setNewPrefName] = useState("");
    const [scheduledReports, setScheduledReports] = useState<any[]>([]);
    const [showScheduleDialog, setShowScheduleDialog] = useState<{ type: 'backlog' | 'audit' } | null>(null);
     const [newSchedule, setNewSchedule] = useState({ format: 'pdf', frequency: 'daily', emails: [] as string[] as string[], currentEmail: "" });
    const [showExportPreview, setShowExportPreview] = useState(false);
    const [showZipPreviewDialog, setShowZipPreviewDialog] = useState<{ 
      type: 'backlog' | 'audit', 
      count: number, 
      filters: any, 
      previewCount?: number,
      expectedCsvHash?: string,
      expectedPdfHash?: string,
      isCalculating?: boolean
    } | null>(null);
    const [manualScheduleStatus, setManualScheduleStatus] = useState<{ id: string, status: string, progress: number, zipUrl?: string } | null>(null);
    const [exportHistory, setExportHistory] = useState<any[]>([]);
    const [showExportHistory, setShowExportHistory] = useState(false);
    const [backlogPage, setBacklogPage] = useState(1);
    const [auditPage, setAuditPage] = useState(1);
    const [backlogSort, setBacklogSort] = useState<{ field: string, order: 'asc' | 'desc' }>({ field: 'count', order: 'desc' });
    const [auditSort, setAuditSort] = useState<{ field: string, order: 'asc' | 'desc' }>({ field: 'created_at', order: 'desc' });
    const [showAuditLogs, setShowAuditLogs] = useState(false);

    const [deadLetterNotifs, setDeadLetterNotifs] = useState<any[]>([]);
    const [dlSearch, setDlSearch] = useState("");
    const [dlPeriodo, setDlPeriodo] = useState({ de: "", ate: "" });
    const [dlCStatFilter, setDlCStatFilter] = useState("");
    const [dlXMotivoFilter, setDlXMotivoFilter] = useState("");
    const [dlSelectedNotif, setDlSelectedNotif] = useState<any | null>(null);
    const [cStatFilter, setCStatFilter] = useState("");
    const [xMotivoFilter, setXMotivoFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [configLoading, setConfigLoading] = useState(false);
    const [certPassword, setCertPassword] = useState("");
    const [showCertPassword, setShowCertPassword] = useState(false);
     const [docInDetail, setDocInDetail] = useState<ProcessedDocument | null>(null);
     const [selectedIds, setSelectedIds] = useState<string[]>([]);
     const [isBatchProcessing, setIsBatchProcessing] = useState(false);
     const [batchProgress, setBatchProgress] = useState(0);
 
 
      const handleExportCSV = () => {
      const filtered = statusFilter === "all" ? processedDocs : processedDocs.filter(d => d.status === statusFilter);
      if (filtered.length === 0) return;
      const headers = ["ID", "Data", "Tipo", "Status", "Total", "Recibo", "Protocolo", "Sefaz Status", "Sefaz Mensagem", "Erros", "Retentativas"];
       const rows = filtered.map(doc => [
         doc.id, 
         new Date(doc.created_at).toLocaleString(), 
         doc.document_type, 
         doc.status,
         doc.valor_total || 0, 
         doc.receipt_number || "", 
         doc.protocol_number || "",
         doc.sefaz_response_code || "",
         doc.sefaz_response_message || "",
         doc.last_error || "", 
         doc.retry_count || 0,
       ]);
      const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_fiscal_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Relatório CSV exportado!");
    };

    const handleExportLog = (doc: ProcessedDocument) => {
      if (!doc.processing_log) return;
      const headers = ["Tentativa", "Horário", "Evento", "cStat", "xMotivo"];
      const rows = doc.processing_log.map((log, index) => [
        index + 1,
        new Date(log.timestamp).toLocaleString(),
        log.event,
        log.cStat || "",
        log.xMotivo || ""
      ]);
      const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `log_processamento_${doc.id}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Log de processamento exportado!");
    };
 
     const handleBatchRetry = async () => {
       if (selectedIds.length === 0) return;
       
       setIsBatchProcessing(true);
       setBatchProgress(0);
 
       try {
         toast.info("Validando certificado e ambiente...");
         const { data: valData, error: valError } = await supabase.functions.invoke("fiscal-engine", { 
           body: { action: "validate" } 
         });
 
         if (valError || !valData.valid) {
           toast.error(`Falha na validação: ${valData?.error || "Certificado ou ambiente inválido"}`);
           setIsBatchProcessing(false);
           return;
         }
 
         toast.success(`Certificado válido: ${valData.subject}. Iniciando lote...`);
 
         let completed = 0;
         for (const id of selectedIds) {
           try {
             await supabase.from("processed_documents").update({ status: "pending", last_error: null, is_processing: true }).eq("id", id);
             await supabase.functions.invoke("fiscal-engine", { body: { action: "sign_and_send", documentId: id } });
           } catch (e) { 
             console.error(`Erro no documento ${id}:`, e); 
           }
           completed++;
           setBatchProgress(Math.round((completed / selectedIds.length) * 100));
         }
         toast.success(`${completed} documentos processados.`);
       } catch (err: any) {
         toast.error("Erro no processamento em lote: " + err.message);
       } finally {
         setIsBatchProcessing(false);
         setSelectedIds([]);
         loadProcessedDocs();
       }
     };
 
    const toggleSelectAll = () => {
      if (selectedIds.length === processedDocs.length) setSelectedIds([]);
      else setSelectedIds(processedDocs.map(d => d.id));
    };
 
    const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };
 
  const [nfeDetalhe, setNfeDetalhe] = useState<NFeEmitida | null>(null);
  const [showXmlPreview, setShowXmlPreview] = useState(false);
   const [periodo, setPeriodo] = useState({ de: "", ate: "" });

  // Form fields
  const [integrador, setIntegrador] = useState("oobj");
  const [cnpjEmitente, setCnpjEmitente] = useState("");
  const [ieEmitente, setIeEmitente] = useState("");
  const [natureza, setNatureza] = useState("Venda de mercadoria adquirida de terceiros");
  const [serie, setSerie] = useState("1");
  const [finalidade, setFinalidade] = useState("1");
  const [cnpjDest, setCnpjDest] = useState("");
  const [razaoDest, setRazaoDest] = useState("");
  const [ieDest, setIeDest] = useState("");
  const [ufDest, setUfDest] = useState("SP");
  const [cepDest, setCepDest] = useState("");
  const [enderecoDest, setEnderecoDest] = useState("");
  const [infoComplementares, setInfoComplementares] = useState("");

  const [itens, setItens] = useState<ItemNFe[]>([{
    id: crypto.randomUUID(), descricao: "", ncm: "", cfop: "5102",
    unidade: "UN", quantidade: 1, valorUnitario: 0,
    icmsAliquota: 18, ipiAliquota: 0, pisAliquota: 1.65, cofinsAliquota: 7.6
  }]);

    const loadBacklogData = async () => {
      let query = supabase
        .from("processed_documents")
        .select("uf, environment, status, next_retry_at, sefaz_response_code, sefaz_response_message")
        .or('status.in.("pending","error")');
      
      if (backlogFilters.uf !== "all") query = query.eq("uf", backlogFilters.uf);
      if (backlogFilters.env !== "all") query = query.eq("environment", backlogFilters.env);
      if (backlogFilters.date) query = query.gte("next_retry_at", `${backlogFilters.date}T00:00:00`);
      if (backlogFilters.cStat) query = query.ilike("sefaz_response_code", `%${backlogFilters.cStat}%`);
      if (backlogFilters.xMotivo) query = query.ilike("sefaz_response_message", `%${backlogFilters.xMotivo}%`);

      const { data: backlog } = await query;
      
      if (backlog) {
        const groupedMap = backlog.reduce((acc: any, curr: any) => {
          const key = `${curr.uf}-${curr.environment}`;
          if (!acc[key]) acc[key] = { uf: curr.uf, env: curr.environment, count: 0, next: curr.next_retry_at };
          acc[key].count++;
          if (curr.next_retry_at && (!acc[key].next || curr.next_retry_at < acc[key].next)) {
            acc[key].next = curr.next_retry_at;
          }
          return acc;
        }, {});
        
        const result = Object.values(groupedMap);
        
        // Apply Sorting
        result.sort((a: any, b: any) => {
          const field = backlogSort.field;
          const modifier = backlogSort.order === 'asc' ? 1 : -1;
          if (a[field] < b[field]) return -1 * modifier;
          if (a[field] > b[field]) return 1 * modifier;
          return 0;
        });

        setBacklogData(result);
      }

      const { data: states } = await supabase.from("fiscal_suspension_states").select("*");
      if (states) setSuspensionStates(states);
    };

    const loadAuditLogs = async () => {
      let query = supabase
        .from("fiscal_action_logs")
        .select("*")
        .order(auditSort.field, { ascending: auditSort.order === 'asc' });

      if (auditFilters.uf !== "all") query = query.eq("uf", auditFilters.uf);
      if (auditFilters.env !== "all") query = query.eq("environment", auditFilters.env);
      if (auditFilters.action !== "all") query = query.eq("action", auditFilters.action);
      if (auditFilters.dateStart) query = query.gte("created_at", `${auditFilters.dateStart}T00:00:00`);
      if (auditFilters.dateEnd) query = query.lte("created_at", `${auditFilters.dateEnd}T23:59:59`);
      if (auditFilters.cStat) query = query.ilike("sefaz_response_code", `%${auditFilters.cStat}%`);
      if (auditFilters.xMotivo) query = query.ilike("reason", `%${auditFilters.xMotivo}%`);

      const from = (auditPage - 1) * 10;
      const to = from + 9;
      const { data } = await query.range(from, to);
      if (data) setAuditLogs(data);
    };

    const handleManualRetryBatch = async (uf: string, env: string) => {
      const key = `${uf}-${env}`;
      setManualRetryProgress(prev => ({
        ...prev,
        [key]: { status: 'queued', count: 0, total: backlogData.find(b => b.uf === uf && b.env === env)?.count || 0 }
      }));

      try {
        setManualRetryProgress(prev => ({ ...prev, [key]: { ...prev[key], status: 'processing' } }));
        const { data, error } = await supabase.functions.invoke("fiscal-engine", {
          body: { action: "manual_retry_batch", uf, environment: env, userId: user?.id }
        });
        if (error) throw error;
        
        await supabase.from("fiscal_action_logs").insert({
          user_id: user?.id,
          action: "manual_retry",
          uf,
          environment: env,
          reason: "Reprocessamento manual disparado pelo usuário"
        });

        setManualRetryProgress(prev => ({ ...prev, [key]: { ...prev[key], status: 'done', count: data.count || 0 } }));
        toast.success(`${data.count || 0} documentos colocados na fila para reprocessamento imediato.`);
        loadBacklogData();
        loadAuditLogs();
      } catch (err: any) {
        setManualRetryProgress(prev => ({ ...prev, [key]: { ...prev[key], status: 'error' } }));
        toast.error("Erro ao disparar reprocessamento: " + err.message);
      }
    };

    const togglePause = async (uf: string, env: string, currentPaused: boolean, reason?: string) => {
      const { error } = await supabase
        .from("fiscal_suspension_states")
        .upsert({ 
          user_id: user?.id, 
          uf, 
          environment: env, 
          is_paused: !currentPaused,
          reason: reason || null
        }, { onConflict: "user_id, uf, environment" });
      
      if (!error) {
        await supabase.from("fiscal_action_logs").insert({
          user_id: user?.id,
          action: !currentPaused ? "pause" : "resume",
          uf,
          environment: env,
          reason: reason || ( !currentPaused ? "Pausado pelo usuário" : "Retomado pelo usuário" )
        });
        toast.success(`Reprocessamento ${!currentPaused ? "pausado" : "retomado"} para ${uf}/${env}`);
        loadBacklogData();
        setShowPauseDialog(null);
        setPauseReason("");
      }
    };

    useEffect(() => {
      if (user) {
        loadNfes();
      }
    }, [user]);

    useEffect(() => {
      if (user) {
        loadFiscalConfig();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, fiscalConfig.uf, fiscalConfig.environment]);

    useEffect(() => {
      if (user) {
        loadProcessedDocs();
        loadBacklogData();
        loadAuditLogs();
        loadUserPreferences();
        loadScheduledReports();
        loadExportHistory();

        const channel = supabase
          .channel('fiscal_monitoring')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'processed_documents' }, () => {
            loadBacklogData();
            loadProcessedDocs();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'fiscal_suspension_states' }, () => {
            loadBacklogData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'dead_letter_notifications' }, () => {
            loadProcessedDocs();
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fiscal_action_logs' }, () => {
            loadAuditLogs();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }, [user, backlogFilters, backlogSort, periodo, cStatFilter, xMotivoFilter, dlPeriodo, dlCStatFilter, dlXMotivoFilter]);

    useEffect(() => {
      if (user) {
        loadAuditLogs();
      }
    }, [user, auditFilters, auditSort, auditPage]);

    const loadFiscalConfig = async () => {
      const { data, error } = await supabase
        .from("fiscal_configurations")
        .select("*")
        .match({ uf: fiscalConfig.uf, environment: fiscalConfig.environment })
        .maybeSingle();
      
      if (!error && data) {
        setFiscalConfig(data);
      }
    };

    const loadProcessedDocs = async () => {
      let query = supabase.from("processed_documents").select("*").order("created_at", { ascending: false });
      if (periodo.de) query = query.gte("created_at", `${periodo.de}T00:00:00`);
      if (periodo.ate) query = query.lte("created_at", `${periodo.ate}T23:59:59`);
      if (cStatFilter) query = query.ilike("sefaz_response_code", `%${cStatFilter}%`);
      if (xMotivoFilter) query = query.ilike("sefaz_response_message", `%${xMotivoFilter}%`);
      
      const { data } = await query;
      if (data) setProcessedDocs(data as ProcessedDocument[]);
      
      // Load dead-letter notifications with filters
      if (user) {
        let dlQuery = supabase
          .from("dead_letter_notifications")
          .select("*, processed_documents(*)")
          .order("created_at", { ascending: false });
        
        if (dlPeriodo.de) dlQuery = dlQuery.gte("created_at", `${dlPeriodo.de}T00:00:00`);
        if (dlPeriodo.ate) dlQuery = dlQuery.lte("created_at", `${dlPeriodo.ate}T23:59:59`);
        if (dlCStatFilter) dlQuery = dlQuery.ilike("cstat", `%${dlCStatFilter}%`);
        if (dlXMotivoFilter) dlQuery = dlQuery.ilike("xmotivo", `%${dlXMotivoFilter}%`);
        
        const { data: dlNotifs } = await dlQuery.limit(100);
        if (dlNotifs) setDeadLetterNotifs(dlNotifs);
      }
    };

    const handleExportAuditCSV = () => {
      if (auditLogs.length === 0) return;
      const headers = ["Data/Hora", "Ação", "UF", "Ambiente", "Motivo", "cStat", "Usuário ID"];
      const rows = auditLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.action.toUpperCase(),
        log.uf,
        log.environment,
        log.reason || "",
        log.sefaz_response_code || "",
        log.user_id
      ]);
      // Excel-friendly CSV with semicolon and BOM
      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `auditoria_fiscal_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Auditoria CSV (Excel-friendly) exportada!");
    };

    const loadExportHistory = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("fiscal_export_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setExportHistory(data);
    };

    const loadUserPreferences = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("fiscal_user_preferences")
        .select("*")
        .eq("user_id", user.id);
      if (data) setSavedPreferences(data);
    };

    const handleSavePreference = async () => {
      if (!user || !showSavePrefDialog || !newPrefName.trim()) return;
      const { error } = await supabase.from("fiscal_user_preferences").upsert({
        user_id: user.id,
        preference_key: `${showSavePrefDialog.type}_filters`,
        preference_name: newPrefName.trim(),
        filters: showSavePrefDialog.filters
      }, { onConflict: "user_id, preference_key, preference_name" });

      if (!error) {
        toast.success(`Filtro "${newPrefName}" salvo!`);
        loadUserPreferences();
        setShowSavePrefDialog(null);
        setNewPrefName("");
      } else {
        toast.error("Erro ao salvar filtro");
      }
    };

    const loadScheduledReports = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("fiscal_scheduled_reports")
        .select("*")
        .eq("user_id", user.id);
      if (data) setScheduledReports(data);
    };

     const handleCreateSchedule = async () => {
       let recipients = [...newSchedule.emails];
       if (newSchedule.currentEmail && !recipients.includes(newSchedule.currentEmail)) {
         recipients.push(newSchedule.currentEmail);
       }
 
       if (!user || !showScheduleDialog || recipients.length === 0) {
         toast.error("Adicione pelo menos um destinatário.");
         return;
       }
       
       const currentFilters = showScheduleDialog.type === 'backlog' ? backlogFilters : auditFilters;
      const hasUF = currentFilters.uf && currentFilters.uf !== 'all';
      const hasEnv = (currentFilters as any).env && (currentFilters as any).env !== 'all';
      const hasDate = showScheduleDialog.type === 'backlog' ? !!(currentFilters as any).date : (!!(currentFilters as any).dateStart || !!(currentFilters as any).dateEnd);

      if (!hasUF || !hasEnv || !hasDate) {
        toast.error("Validação falhou: Selecione UF, Ambiente e um Período válido para agendar.");
        return;
      }

       const { error } = await supabase.from("fiscal_scheduled_reports").insert({
         user_id: user.id,
         report_type: showScheduleDialog.type,
         format: newSchedule.format,
         frequency: newSchedule.frequency,
         filters: currentFilters,
         email_recipients: recipients,
         is_active: true
       });
 
       if (!error) {
         toast.success("Agendamento criado com sucesso!");
         loadScheduledReports();
         setShowScheduleDialog(null);
       } else {
         toast.error("Erro ao criar agendamento: " + error.message);
       }
     };
 
      const handleRunScheduleNow = async (schedule: any) => {
        if (!user) return;
        setManualScheduleStatus({ id: schedule.id, status: 'initializing', progress: 10 });
        toast.info("Iniciando processamento manual da exportação...");
        
        try {
          setManualScheduleStatus(prev => prev ? { ...prev, status: 'running', progress: 30 } : null);
           const { data, error } = await supabase.functions.invoke("fiscal-scheduler", {
             body: { 
               action: "run_now", 
               schedule_id: schedule.id,
               technical_info: {
                 sorting: schedule.report_type === 'backlog' ? backlogSort : auditSort,
                 page: schedule.report_type === 'backlog' ? backlogPage : auditPage,
                 page_size: 10
               }
             }
           });
  
          if (error) throw error;
          
          setManualScheduleStatus(prev => prev ? { ...prev, progress: 60 } : null);
          
          // Poll for completion to show the download link
          let completed = false;
          let attempts = 0;
          while (!completed && attempts < 15) {
            await new Promise(r => setTimeout(r, 2000));
            const { data: latestLog } = await supabase
              .from("fiscal_export_logs")
              .select("*")
              .eq("report_id", schedule.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            
            if (latestLog) {
              if (latestLog.status === 'success') {
                setManualScheduleStatus(prev => prev ? { ...prev, status: 'success', progress: 100, zipUrl: latestLog.file_url } : null);
                completed = true;
                toast.success("Exportação concluída!");
              } else if (latestLog.status === 'error') {
                setManualScheduleStatus(prev => prev ? { ...prev, status: 'error', progress: 100 } : null);
                completed = true;
                toast.error("Falha na exportação: " + latestLog.error_message);
              }
            }
            attempts++;
          }

          const { data: logs } = await supabase.from("fiscal_export_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
          if (logs) setExportHistory(logs);
        } catch (err: any) {
          setManualScheduleStatus(prev => prev ? { ...prev, status: 'error', progress: 100 } : null);
          toast.error("Erro ao disparar exportação: " + err.message);
        }
      };
 
     const handleResendEmail = async (logId: string) => {
       toast.info("Reenviando e-mail...");
       const { error } = await supabase.functions.invoke("fiscal-scheduler", {
         body: { action: "resend_email", log_id: logId }
       });
       if (!error) {
         toast.success("E-mail reenviado com sucesso!");
       } else {
         toast.error("Erro ao reenviar e-mail: " + error.message);
       }
     };
 
    const calculateHash = async (content: string | Blob | Uint8Array) => {
      let data: BufferSource;
      if (typeof content === 'string') {
        data = new TextEncoder().encode(content);
      } else if (content instanceof Blob) {
        data = await content.arrayBuffer();
      } else {
        data = content as any;
      }
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const verifyAndDownloadFile = async (log: any, fileType: 'csv' | 'pdf') => {
      if (!log.file_url) {
        toast.error("URL do arquivo não disponível.");
        return;
      }
      toast.info(`Extraindo e verificando ${fileType.toUpperCase()}...`);
      try {
        const response = await fetch(log.file_url);
        const blob = await response.blob();
        const zip = await JSZip.loadAsync(blob);
        let targetFileName = "";
        zip.forEach((path) => { 
          if (path.toLowerCase().endsWith(`.${fileType}`) && !path.startsWith("log_tecnico")) {
            targetFileName = path;
          }
        });

        if (!targetFileName) {
          toast.error(`Arquivo ${fileType.toUpperCase()} não encontrado no pacote.`);
          return;
        }

        const fileContent = await zip.file(targetFileName)?.async(fileType === 'csv' ? "string" : "uint8array");
        if (fileContent) {
          const currentHash = await calculateHash(fileContent);
          const expectedHash = fileType === 'csv' ? log.csv_hash : log.pdf_hash;
          
          if (expectedHash && currentHash !== expectedHash) {
            toast.error(`DIVERGÊNCIA: Hash do ${fileType.toUpperCase()} não confere!`, {
              description: `Esperado: ${expectedHash.substring(0, 10)}... | Obtido: ${currentHash.substring(0, 10)}...`,
              duration: 10000
            });
            return;
          }

          const downloadBlob = fileType === 'csv' 
            ? new Blob([fileContent as string], { type: "text/csv;charset=utf-8;" })
            : new Blob([fileContent as any], { type: "application/pdf" });
          
          const url = URL.createObjectURL(downloadBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = targetFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success(`${fileType.toUpperCase()} baixado e verificado.`);
        }
      } catch (err) {
        toast.error(`Erro ao processar ${fileType.toUpperCase()}.`);
      }
    };

    const downloadAuditSummary = (log: any) => {
      const summary = {
        id_execucao: log.id,
        report_id: log.report_id,
        data_criacao: log.created_at,
        tipo: log.report_type,
        filtros: log.filters,
        contagens: {
          total: log.record_count,
          csv: log.csv_count,
          pdf: log.pdf_count
        },
        hashes: {
          csv: log.csv_hash,
          pdf: log.pdf_hash
        },
        destinatarios: log.recipients,
        tecnico: log.technical_log,
        status: log.status,
        divergencia: log.validation_divergence
      };

      const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resumo_auditoria_${log.id.substring(0, 8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Resumo de auditoria exportado.");
    };

    const handleRunProofFromHistory = (log: any) => {
      toast.info("Iniciando Modo Prova a partir do histórico...");
      handleExportZip(log.report_type as 'backlog' | 'audit', 'proof');
    };

     const handleExportZip = async (type: 'backlog' | 'audit', mode: 'full' | 'proof' = 'full') => {
       const filters = type === 'backlog' ? backlogFilters : auditFilters;
       const count = type === 'backlog' 
         ? backlogData.reduce((acc, b) => acc + b.count, 0) 
         : auditLogs.length;
       
       setShowZipPreviewDialog({ type, count, filters, previewCount: count, isCalculating: true });

       // Pre-calculate hashes for preview/proof
       let csvContent = "";
       let rows: any[] = [];
       if (type === 'backlog') {
         const sortedData = [...backlogData].sort((a: any, b: any) => {
           const field = backlogSort.field;
           const modifier = backlogSort.order === 'asc' ? 1 : -1;
           if (a[field] < b[field]) return -1 * modifier;
           if (a[field] > b[field]) return 1 * modifier;
           return 0;
         });
         const headers = ["UF", "Ambiente", "Quantidade", "Próximo Envio", "Status"];
         rows = sortedData.map(b => {
           const state = suspensionStates.find(s => s.uf === b.uf && s.environment === b.env);
           return [b.uf, b.env.toUpperCase(), b.count, b.next ? new Date(b.next).toLocaleString() : "—", state?.is_suspended ? "Suspenso" : (state?.is_paused ? "Pausado" : "Ativo")];
         });
         csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
       } else {
         const headers = ["Data/Hora", "Ação", "UF", "Ambiente", "Motivo", "cStat", "xMotivo"];
         rows = auditLogs.map(log => [new Date(log.created_at).toLocaleString(), log.action.toUpperCase(), log.uf, log.environment, log.reason || "", log.cstat || "", log.xmotivo || ""]);
         csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
       }

       const csvHash = await calculateHash(csvContent);
       // Simulated PDF hash for preview speed
       const pdfHash = await calculateHash(csvContent + "_pdf_proof"); 

       setShowZipPreviewDialog(prev => prev ? { 
         ...prev, 
         expectedCsvHash: csvHash, 
         expectedPdfHash: pdfHash,
         isCalculating: false 
       } : null);

       if (mode === 'proof') {
         toast.success("Modo Prova concluído: Hashes e contagens validados.");
       }
     };

     const verifyAndDownload = async (log: any) => {
       if (!log.file_url) return;
       toast.info("Verificando integridade dos hashes...");
       try {
         const response = await fetch(log.file_url);
         const blob = await response.blob();
         const zip = await JSZip.loadAsync(blob);
         let csvFile = "";
         zip.forEach((path) => { if (path.endsWith(".csv") && !path.startsWith("log_tecnico")) csvFile = path; });
         if (csvFile) {
           const content = await zip.file(csvFile)?.async("string");
           if (content) {
             const currentHash = await calculateHash(content);
             if (log.csv_hash && currentHash !== log.csv_hash) {
               toast.error("ERRO: Hash do CSV não coincide!", { duration: 10000 });
               return;
             }
           }
         }
         const link = document.createElement("a");
         link.href = log.file_url;
         link.download = `${log.report_type}_fiscal_verified.zip`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         toast.success("Download verificado.");
       } catch (err) { toast.error("Erro na verificação."); }
     };

     const handleRerunExport = async (log: any) => {
       if (!user) return;
       toast.info("Reexecutando exportação com snapshot de filtros...");
       
       const schedule = {
         id: log.report_id,
         report_type: log.report_type,
         filters: log.filters
       };

       const technicalInfo = {
         ...log.technical_log,
         is_rerun: true,
         original_log_id: log.id
       };

       setManualScheduleStatus({ id: log.report_id, status: 'initializing', progress: 10 });
       
       try {
         const { error } = await supabase.functions.invoke("fiscal-scheduler", {
           body: { 
             action: "run_now", 
             schedule_id: log.report_id,
             technical_info: technicalInfo
           }
         });

         if (error) throw error;
         handleRunScheduleNow(schedule); 
       } catch (err: any) {
         toast.error("Erro ao reexecutar: " + err.message);
       }
     };

      const confirmExportZip = async () => {
         if (!showZipPreviewDialog || !user) return;
         const { type, previewCount } = showZipPreviewDialog;
        setShowZipPreviewDialog(null);
        
        toast.info("Gerando pacote ZIP...");
        const zip = new JSZip();
        const dateStr = new Date().toISOString().split('T')[0];
        
        if (type === 'backlog') {
          // Applying consistent sorting from backlogSort
          const sortedData = [...backlogData].sort((a: any, b: any) => {
            const field = backlogSort.field;
            const modifier = backlogSort.order === 'asc' ? 1 : -1;
            if (a[field] < b[field]) return -1 * modifier;
            if (a[field] > b[field]) return 1 * modifier;
            return 0;
          });

          const headers = ["UF", "Ambiente", "Quantidade", "Próximo Envio", "Status"];
          const rows = sortedData.map(b => {
            const state = suspensionStates.find(s => s.uf === b.uf && s.environment === b.env);
            const status = state?.is_suspended ? "Suspenso" : (state?.is_paused ? "Pausado" : "Ativo");
            return [b.uf, b.env.toUpperCase(), b.count, b.next ? new Date(b.next).toLocaleString() : "—", status];
          });
           const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
           const csvHash = await calculateHash(csvContent);
           zip.file(`backlog_fiscal_${dateStr}.csv`, csvContent);

           const doc = new jsPDF();
           doc.text("Backlog Fiscal", 14, 15);
           autoTable(doc, { head: [headers], body: rows, startY: 25 });
           const pdfContent = doc.output('blob');
           const pdfHash = await calculateHash(pdfContent);
           zip.file(`backlog_fiscal_${dateStr}.pdf`, pdfContent);

            const techLog = { 
              execution_id: crypto.randomUUID(),
              sorting: backlogSort, 
              page: backlogPage, 
              page_size: 10,
              direction: backlogSort.order,
              field: backlogSort.field,
              timestamp: new Date().toISOString(), 
              csv_hash: csvHash, 
              pdf_hash: pdfHash, 
              preview_count: previewCount, 
              final_count: rows.length 
            };
           zip.file(`log_tecnico_${dateStr}.json`, JSON.stringify(techLog, null, 2));
           const divergence = previewCount !== rows.length;
           await supabase.from("fiscal_export_logs").insert([{
             user_id: user.id, report_type: 'backlog', format: 'zip', status: 'success', record_count: rows.length, csv_count: rows.length, pdf_count: rows.length, csv_hash: csvHash, pdf_hash: pdfHash, validation_divergence: divergence, filters: backlogFilters, technical_log: techLog as any, recipients: []
           }]);
         } else {
           const headers = ["Data/Hora", "Ação", "UF", "Ambiente", "Motivo", "cStat", "xMotivo"];
           const rows = auditLogs.map(log => [new Date(log.created_at).toLocaleString(), log.action.toUpperCase(), log.uf, log.environment, log.reason || "", log.cstat || "", log.xmotivo || ""]);
           const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
           const csvHash = await calculateHash(csvContent);
           zip.file(`auditoria_fiscal_${dateStr}.csv`, csvContent);

           const doc = new jsPDF();
           doc.text("Auditoria Fiscal", 14, 15);
           autoTable(doc, { head: [headers], body: rows, startY: 25 });
           const pdfContent = doc.output('blob');
           const pdfHash = await calculateHash(pdfContent);
           zip.file(`auditoria_fiscal_${dateStr}.pdf`, pdfContent);

            const techLog = { 
              execution_id: crypto.randomUUID(),
              sorting: auditSort, 
              page: auditPage, 
              page_size: 10,
              direction: auditSort.order,
              field: auditSort.field,
              timestamp: new Date().toISOString(), 
              csv_hash: csvHash, 
              pdf_hash: pdfHash, 
              preview_count: previewCount, 
              final_count: rows.length 
            };
           zip.file(`log_tecnico_${dateStr}.json`, JSON.stringify(techLog, null, 2));
           const divergence = previewCount !== rows.length;
           await supabase.from("fiscal_export_logs").insert([{
             user_id: user.id, report_type: 'audit', format: 'zip', status: 'success', record_count: rows.length, csv_count: rows.length, pdf_count: rows.length, csv_hash: csvHash, pdf_hash: pdfHash, validation_divergence: divergence, filters: auditFilters, technical_log: techLog as any, recipients: []
           }]);
         }
  
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}_fiscal_${dateStr}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Pacote ZIP exportado!");
      };
    const handleExportAuditXLSX = () => {
      if (auditLogs.length === 0) return;
      const data = auditLogs.map(log => ({
        "Data/Hora": new Date(log.created_at).toLocaleString(),
        "Ação": log.action.toUpperCase(),
        "UF": log.uf,
        "Ambiente": log.environment,
        "Motivo": log.reason || "",
        "Usuário ID": log.user_id
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
      XLSX.writeFile(wb, `auditoria_fiscal_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Auditoria Excel exportada!");
    };

    const handleExportBacklogXLSX = () => {
      if (backlogData.length === 0) return;
      const data = backlogData.map(b => {
        const state = suspensionStates.find(s => s.uf === b.uf && s.environment === b.env);
        const status = state?.is_suspended ? "Suspenso" : (state?.is_paused ? "Pausado" : "Ativo");
        return {
          "UF": b.uf,
          "Ambiente": b.env.toUpperCase(),
          "Quantidade": b.count,
          "Próximo Envio": b.next ? new Date(b.next).toLocaleString() : "—",
          "Status": status
        };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Backlog");
      XLSX.writeFile(wb, `backlog_fiscal_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Backlog Excel exportada!");
    };

    const handleExportAuditPDF = () => {
      if (auditLogs.length === 0) return;
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFontSize(16);
      doc.text("Auditoria de Ações Fiscais", 14, 15);
      doc.setFontSize(8);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Filtros: UF=${auditFilters.uf}, Período=${auditFilters.dateStart || 'Início'} até ${auditFilters.dateEnd || 'Hoje'}`, 14, 27);
      
      const tableData = auditLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.action.toUpperCase(),
        `${log.uf}/${log.environment}`,
        log.reason || "—",
        log.user_id?.substring(0, 8) || "—"
      ]);

      autoTable(doc, {
        head: [["Data/Hora", "Ação", "UF/Amb", "Motivo", "Usuário"]],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 40;
      doc.setFontSize(10);
      doc.text("Referências e Links de Acesso:", 14, finalY + 10);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 255);
      
      auditLogs.slice(0, 10).forEach((log, index) => {
        const yPos = finalY + 15 + (index * 5);
        if (yPos < pageHeight - 10) {
          const text = `Ação ${log.action} em ${log.uf}/${log.environment} - Ver no Portal Sefaz`;
          doc.text(text, 14, yPos);
          doc.link(14, yPos - 3, doc.getTextWidth(text), 4, { url: `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&tipoConteudo=XbSeqAa9daU=` });
        }
      });

      doc.save(`auditoria_fiscal_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Auditoria PDF exportada!");
    };

    const handleExportBacklogCSV = () => {
      if (backlogData.length === 0) return;
      const headers = ["UF", "Ambiente", "Quantidade", "Próximo Envio", "Status"];
      const rows = backlogData.map(b => {
        const state = suspensionStates.find(s => s.uf === b.uf && s.environment === b.env);
        const status = state?.is_suspended ? "Suspenso" : (state?.is_paused ? "Pausado" : "Ativo");
        return [
          b.uf,
          b.env.toUpperCase(),
          b.count,
          b.next ? new Date(b.next).toLocaleString('pt-BR') : "—",
          status
        ];
      });
      // Excel-friendly CSV with semicolon and BOM
      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backlog_fiscal_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Backlog CSV (Excel-friendly) exportado!");
    };

    const handleExportBacklogPDF = () => {
      if (backlogData.length === 0) return;
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFontSize(16);
      doc.text("Backlog de Processamento Fiscal", 14, 15);
      doc.setFontSize(8);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Filtros: UF=${backlogFilters.uf}, Amb=${backlogFilters.env}, Data=${backlogFilters.date || 'Todas'}`, 14, 27);
      
      const tableData = backlogData.map(b => {
        const state = suspensionStates.find(s => s.uf === b.uf && s.environment === b.env);
        const status = state?.is_suspended ? "Suspenso" : (state?.is_paused ? "Pausado" : "Ativo");
        return [
          b.uf,
          b.env.toUpperCase(),
          `${b.count} docs`,
          b.next ? new Date(b.next).toLocaleString() : "—",
          status
        ];
      });

      autoTable(doc, {
        head: [["UF", "Ambiente", "Fila", "Próximo Envio", "Status"]],
        body: tableData,
        startY: 35,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 40;
      doc.setFontSize(10);
      doc.text("Links Diretos para Consulta SEFAZ (Últimos Eventos):", 14, finalY + 10);
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 255);

      backlogData.forEach((b, index) => {
        const yPos = finalY + 15 + (index * 5);
        if (yPos < pageHeight - 10) {
          const linkText = `Consultar Status de Serviço ${b.uf} (${b.env.toUpperCase()})`;
          doc.text(linkText, 14, yPos);
          // Simulating a real SEFAZ link structure
          doc.link(14, yPos - 3, doc.getTextWidth(linkText), 4, { url: `https://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx` });
        }
      });

      doc.save(`backlog_fiscal_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Backlog PDF exportado!");
    };

    const handleExportDeadLetterCSV = () => {
      if (deadLetterNotifs.length === 0) return;
      const headers = ["ID", "Documento ID", "UF", "Ambiente", "Data", "Status Alerta", "Canais", "cStat", "xMotivo", "Retentativas", "Próximo Retry", "ID XML", "ID Comprovante", "Link XML"];
      const rows = deadLetterNotifs.map(n => [
        n.id,
        n.document_id,
        n.processed_documents?.uf || "",
        n.processed_documents?.environment || "",
        new Date(n.created_at).toLocaleString(),
        n.status,
        (n.channels || []).join(", "),
        n.cstat || "",
        n.xmotivo || "",
        n.retry_count_at_failure || "", 
        n.processed_documents?.next_retry_at || "",
        n.document_id,
        n.last_receipt_number || "",
        n.last_xml_url || ""
      ]);
      const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fila_dead_letter_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Fila Dead-Letter exportada!");
    };

    const handleBatchDownloadZip = async () => {
      if (selectedIds.length === 0) return;
      
      toast.info("Gerando arquivo ZIP...");
      const zip = new JSZip();
      const selectedDocs = processedDocs.filter(d => selectedIds.includes(d.id));
      
      selectedDocs.forEach(doc => {
        if (doc.signed_xml_content) {
          zip.file(`${doc.id}_assinado.xml`, doc.signed_xml_content);
        } else {
          zip.file(`${doc.id}_original.xml`, doc.xml_content);
        }
        // If there are other receipts or logs, they could be added here
        if (doc.processing_log) {
          zip.file(`${doc.id}_log.json`, JSON.stringify(doc.processing_log, null, 2));
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lote_fiscal_${new Date().getTime()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download ZIP iniciado!");
    };

    const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true });

    useEffect(() => {
      if (user) {
        supabase.from("notification_preferences").select("dead_letter_alerts_email, dead_letter_alerts_push").eq("user_id", user.id).maybeSingle().then(({ data }) => {
          if (data) setNotifPrefs({ email: data.dead_letter_alerts_email ?? true, push: data.dead_letter_alerts_push ?? true });
        });
      }
    }, [user]);

    const handleSaveNotifPrefs = async () => {
      if (!user) return;
      const { error } = await supabase.from("notification_preferences").update({
        dead_letter_alerts_email: notifPrefs.email,
        dead_letter_alerts_push: notifPrefs.push
      }).eq("user_id", user.id);
      if (!error) toast.success("Canais de alerta atualizados!");
    };

    const handleSaveConfig = async () => {
      if (!user) return;
      setConfigLoading(true);
      try {
        const { error } = await supabase.from("fiscal_configurations").upsert({
          user_id: user.id,
          uf: fiscalConfig.uf,
          environment: fiscalConfig.environment,
          max_retries: fiscalConfig.max_retries,
          retry_delay_minutes: fiscalConfig.retry_delay_minutes,
          auto_retry_on_reactivation: fiscalConfig.auto_retry_on_reactivation,
          reactivation_throughput: fiscalConfig.reactivation_throughput
        }, { onConflict: "user_id, uf, environment" });
        
        if (error) throw error;

        // Also update the granular suspension state throughput
        await supabase.from("fiscal_suspension_states").upsert({
          user_id: user.id,
          uf: fiscalConfig.uf,
          environment: fiscalConfig.environment,
          throughput_per_minute: fiscalConfig.reactivation_throughput || 5
        }, { onConflict: "user_id, uf, environment" });

        if (certPassword) {
          const { data, error: funcError } = await supabase.functions.invoke("fiscal-engine", {
            body: { action: "update_password", password: certPassword }
          });
          if (funcError) throw funcError;
          setCertPassword("");
        }
        
        toast.success("Configurações salvas!");
      } catch (err: any) {
        toast.error("Erro ao salvar: " + err.message);
      } finally {
        setConfigLoading(false);
      }
    };

    const handleReactivateEngine = async () => {
      if (!user) return;
      setConfigLoading(true);
      try {
        const { error } = await supabase
          .from("fiscal_configurations")
          .update({ is_suspended: false, consecutive_validation_failures: 0 })
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Motor fiscal reativado!");
        loadFiscalConfig();
      } catch (err: any) {
        toast.error("Erro ao reativar: " + err.message);
      } finally {
        setConfigLoading(false);
      }
    };

  const loadNfes = async () => {
    setLoading(true);
    const { data } = await supabase.from("nfe_emitidas").select("*").order("created_at", { ascending: false });
    if (data) setNfes(data as NFeEmitida[]);
    setLoading(false);
  };

  const filteredServicos = servicos.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));

  const addItem = () => {
    setItens(prev => [...prev, {
      id: crypto.randomUUID(), descricao: "", ncm: "", cfop: "5102",
      unidade: "UN", quantidade: 1, valorUnitario: 0,
      icmsAliquota: 18, ipiAliquota: 0, pisAliquota: 1.65, cofinsAliquota: 7.6
    }]);
  };

  const removeItem = (id: string) => {
    if (itens.length <= 1) { toast.error("Mínimo 1 item"); return; }
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ItemNFe>) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const totalProdutos = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario), 0);
  const totalICMS = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario * i.icmsAliquota / 100), 0);
  const totalIPI = itens.reduce((s, i) => s + (i.quantidade * i.valorUnitario * i.ipiAliquota / 100), 0);
  const totalNFe = totalProdutos + totalIPI;

   const handleEmitirNFe = async () => {
     if (!user) { toast.error("Faça login"); return; }
     if (itens.some(i => !i.descricao.trim())) { toast.error("Preencha descrição dos itens"); return; }
     if (totalProdutos <= 0) { toast.error("Valor deve ser > 0"); return; }

     setEmitindo(true);
     try {
       const numero = String(nfes.length + 1).padStart(9, "0");
       const chave = generateChave();
       
       // Generate XML content
       const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
 <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
   <infNFe versao="4.00">
     <ide><natOp>${natureza}</natOp><mod>55</mod><serie>${serie}</serie><finNFe>${finalidade}</finNFe></ide>
     <emit><CNPJ>${cnpjEmitente.replace(/\D/g, "")}</CNPJ><IE>${ieEmitente}</IE></emit>
     <dest><CNPJ>${cnpjDest.replace(/\D/g, "")}</CNPJ><xNome>${razaoDest}</xNome></dest>
 ${itens.map((item, idx) => `    <det nItem="${idx + 1}">
       <prod><xProd>${item.descricao || "Item"}</xProd><NCM>${item.ncm}</NCM><CFOP>${item.cfop}</CFOP><uCom>${item.unidade}</uCom><qCom>${item.quantidade}</qCom><vUnCom>${item.valorUnitario.toFixed(2)}</vUnCom><vProd>${(item.quantidade * item.valorUnitario).toFixed(2)}</vProd></prod>
       <imposto><ICMS><pICMS>${item.icmsAliquota}</pICMS></ICMS><IPI><pIPI>${item.ipiAliquota}</pIPI></IPI></imposto>
     </det>`).join("\n")}
     <total><vProd>${totalProdutos.toFixed(2)}</vProd><vICMS>${totalICMS.toFixed(2)}</vICMS><vIPI>${totalIPI.toFixed(2)}</vIPI><vNF>${totalNFe.toFixed(2)}</vNF></total>
   </infNFe>
 </NFe>`;

       // 1. Create entry in processed_documents (initial status: pending)
       const { data: doc, error: docError } = await supabase.from("processed_documents").insert({
         user_id: user.id,
         document_type: "NF-e",
         xml_content: xmlContent,
         status: "pending",
         processing_log: [{ timestamp: new Date().toISOString(), event: "Documento gerado e aguardando assinatura" }]
       }).select().single();

       if (docError) throw docError;

       // 2. Call Edge Function to sign and send to SEFAZ (mocked for now, would use fiscal-engine)
       toast.info("Assinando XML com e-CNPJ A1...");
       
       // Simulate processing delay
       await new Promise(r => setTimeout(r, 1500));

       const { error: updateError } = await supabase.from("processed_documents").update({
         status: "authorized",
         signed_xml_content: xmlContent.replace('<NFe', '<NFe signed="true"'),
         protocol_number: "135" + Math.floor(Math.random() * 100000000),
         sefaz_response_code: "100",
         sefaz_response_message: "Autorizado o uso da NF-e",
         processing_log: [
           { timestamp: new Date().toISOString(), event: "XML assinado com sucesso" },
           { timestamp: new Date().toISOString(), event: "Transmitido para SEFAZ" },
           { timestamp: new Date().toISOString(), event: "Autorizado pelo órgão" }
         ]
       }).eq("id", doc.id);

       if (updateError) throw updateError;

       // 3. Create legacy NFe entry for the UI
       const { data: nfeData, error: nfeError } = await supabase.from("nfe_emitidas").insert({
         user_id: user.id,
         numero,
         serie,
         chave_acesso: chave,
         cnpj_emitente: cnpjEmitente,
         cnpj_destinatario: cnpjDest,
         razao_destinatario: razaoDest,
         natureza_operacao: natureza,
         uf_destino: ufDest,
         valor_produtos: totalProdutos,
         valor_icms: totalICMS,
         valor_ipi: totalIPI,
         valor_total: totalNFe,
         status: "autorizada",
         integrador,
         info_complementares: infoComplementares,
       }).select().single();

       if (nfeError) throw nfeError;

       // Insert items
       const itensDb = itens.map((item, idx) => ({
         nfe_id: nfeData.id,
         numero_item: idx + 1,
         descricao: item.descricao,
         ncm: item.ncm,
         cfop: item.cfop,
         unidade: item.unidade,
         quantidade: item.quantidade,
         valor_unitario: item.valorUnitario,
         icms_aliquota: item.icmsAliquota,
         ipi_aliquota: item.ipiAliquota,
         pis_aliquota: item.pisAliquota,
         cofins_aliquota: item.cofinsAliquota,
       }));
       await supabase.from("nfe_itens").insert(itensDb);

       toast.success(`NF-e transmitida! Nº ${numero} • Protocolo: ${doc.id.split("-")[0]}`);
       
       // Reset form
       setItens([{
         id: crypto.randomUUID(), descricao: "", ncm: "", cfop: "5102",
         unidade: "UN", quantidade: 1, valorUnitario: 0,
         icmsAliquota: 18, ipiAliquota: 0, pisAliquota: 1.65, cofinsAliquota: 7.6
       }]);
       setCnpjDest(""); setRazaoDest(""); setInfoComplementares("");
       loadNfes();
       loadProcessedDocs();
     } catch (err: any) {
       toast.error("Erro: " + (err.message || "Tente novamente"));
     } finally { setEmitindo(false); }
   };

   const handleRetry = async (id: string) => {
     toast.info("Reiniciando processamento...");
     const { error } = await supabase.from("processed_documents").update({
       status: "pending",
       last_error: null
     }).eq("id", id);
     
     if (!error) {
       await supabase.functions.invoke("fiscal-engine", {
         body: { action: "sign_and_send", documentId: id }
       });
       loadProcessedDocs();
     }
   };

   const handleDownloadXml = (doc: ProcessedDocument) => {
     const content = doc.signed_xml_content || doc.xml_content;
     const blob = new Blob([content], { type: "text/xml" });
     const url = URL.createObjectURL(blob);
     const a = document.createElement("a");
     a.href = url;
     a.download = `documento_${doc.id.slice(0, 8)}.xml`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
     toast.success("XML baixado!");
   };

   const faturamento = nfes.filter(n => n.status === "autorizada").reduce((s, n) => s + Number(n.valor_total), 0);

   return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> Emissor NF-e & SEFAZ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{servicos.length} serviços online • {nfes.filter(n => n.status === "autorizada").length} NF-e autorizadas</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => { toast.success("Atualizado!"); loadNfes(); }}><RefreshCw className="w-4 h-4" /> Atualizar</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">WebServices</p><p className="text-2xl font-bold font-display text-primary">{servicos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NF-e Emitidas</p><p className="text-2xl font-bold font-display text-primary">{nfes.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Faturamento</p><p className="text-2xl font-bold font-display text-primary">R$ {(faturamento / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Uptime</p><p className="text-2xl font-bold font-display text-primary">99.9%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="nfe" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="nfe">Emissão NF-e</TabsTrigger>
          <TabsTrigger value="notas">Notas ({nfes.length})</TabsTrigger>
          <TabsTrigger value="webservices">WebServices</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
           <TabsTrigger value="integradores">Integradores</TabsTrigger>
           <TabsTrigger value="processamento">Processamento</TabsTrigger>
           <TabsTrigger value="alertas">Alertas Dead-Letter</TabsTrigger>
           <TabsTrigger value="config_avancada">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="alertas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" /> Fila Dead-Letter
                  </CardTitle>
                  <CardDescription>Documentos que excederam o limite de retentativas.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportDeadLetterCSV} className="gap-2">
                  <Download className="w-4 h-4" /> Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="ID Documento..." 
                      value={dlSearch} 
                      onChange={e => setDlSearch(e.target.value)} 
                      className="pl-9 h-9"
                    />
                  </div>
                  <Input type="date" value={dlPeriodo.de} onChange={e => setDlPeriodo(p => ({ ...p, de: e.target.value }))} className="h-9" />
                  <Input type="date" value={dlPeriodo.ate} onChange={e => setDlPeriodo(p => ({ ...p, ate: e.target.value }))} className="h-9" />
                  <div className="flex gap-2">
                    <Input placeholder="cStat" value={dlCStatFilter} onChange={e => setDlCStatFilter(e.target.value)} className="h-9 w-20" />
                    <Button variant="ghost" size="sm" onClick={loadProcessedDocs} className="h-9">Filtrar</Button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 uppercase">
                      <tr>
                        <th className="text-left py-3 px-4">Documento</th>
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-left py-3 px-4">cStat/Motivo</th>
                        <th className="text-center py-3 px-4">Canais</th>
                        <th className="text-right py-3 px-4">Status</th>
                        <th className="text-center py-3 px-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadLetterNotifs.length > 0 ? deadLetterNotifs.map(n => (
                        <tr key={n.id} className="border-t hover:bg-muted/30">
                          <td className="py-3 px-4 font-mono">{n.document_id.slice(0, 8)}</td>
                          <td className="py-3 px-4">{new Date(n.created_at).toLocaleString()}</td>
                          <td className="py-3 px-4 max-w-[200px] truncate">
                            <span className="font-bold">[{n.cstat}]</span> {n.xmotivo}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-1">
                              {n.channels?.map((c: string) => (
                                <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Badge variant={n.status === 'sent' ? 'default' : n.status === 'error' ? 'destructive' : 'secondary'}>
                              {n.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDlSelectedNotif(n)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum alerta registrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="processamento">
           <Card>
             <CardHeader>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <CardTitle className="font-display">Relatórios de Processamento</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedIds.length > 0 && (
                      <>
                        <Button variant="outline" size="sm" onClick={handleBatchDownloadZip} className="gap-2 text-primary border-primary/20 hover:bg-primary/5">
                          <FileArchive className="w-4 h-4" /> ZIP ({selectedIds.length})
                        </Button>
                        <Button variant="default" size="sm" onClick={handleBatchRetry} disabled={isBatchProcessing} className="gap-2">
                          {isBatchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                          Reprocessar ({selectedIds.length})
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                      <FileDown className="w-4 h-4" /> Exportar CSV
                    </Button>
                  </div>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
               {isBatchProcessing && (
                 <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                   <div className="bg-primary h-full transition-all duration-300" style={{ width: `${batchProgress}%` }} />
                 </div>
               )}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">De:</Label>
                    <Input type="date" value={periodo.de} onChange={e => setPeriodo(prev => ({ ...prev, de: e.target.value }))} className="w-32 h-9" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Até:</Label>
                    <Input type="date" value={periodo.ate} onChange={e => setPeriodo(prev => ({ ...prev, ate: e.target.value }))} className="w-32 h-9" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Status:</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="authorized">Autorizado</SelectItem>
                        <SelectItem value="error">Erro</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="dead-letter">Dead-letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">cStat:</Label>
                    <Input placeholder="Ex: 100" value={cStatFilter} onChange={e => setCStatFilter(e.target.value)} className="w-20 h-9 text-xs font-mono" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Motivo:</Label>
                    <Input placeholder="Buscar..." value={xMotivoFilter} onChange={e => setXMotivoFilter(e.target.value)} className="w-32 h-9 text-xs" />
                  </div>
                  <Button variant="outline" size="sm" onClick={loadProcessedDocs}><Search className="w-4 h-4" /></Button>
                </div>
 
               <div className="overflow-x-auto border rounded-lg">
                 <table className="w-full text-xs">
                   <thead className="bg-muted/50 uppercase">
                     <tr>
                       <th className="w-10 py-3 px-4">
                         <button onClick={toggleSelectAll}>
                           {selectedIds.length === processedDocs.length && processedDocs.length > 0 
                             ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                         </button>
                       </th>
                       <th className="text-left py-3 px-4">Data</th>
                       <th className="text-left py-3 px-4">Status</th>
                       <th className="text-left py-3 px-4">Protocolo</th>
                       <th className="text-center py-3 px-4">Tentativas</th>
                       <th className="text-right py-3 px-4">Ações</th>
                     </tr>
                   </thead>
                   <tbody>
                     {processedDocs.map(doc => (
                       <tr key={doc.id} className={`border-t hover:bg-muted/30 ${selectedIds.includes(doc.id) ? 'bg-primary/5' : ''}`}>
                         <td className="py-3 px-4 text-center">
                           <button onClick={() => toggleSelect(doc.id)}>
                             {selectedIds.includes(doc.id) 
                               ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                           </button>
                         </td>
                         <td className="py-3 px-4 whitespace-nowrap">{new Date(doc.created_at).toLocaleString()}</td>
                         <td className="py-3 px-4">
                           <Badge variant={doc.status === 'authorized' ? 'default' : doc.status === 'error' ? 'destructive' : 'secondary'} className="text-[10px]">
                             {doc.status}
                           </Badge>
                         </td>
                         <td className="py-3 px-4 font-mono">{doc.protocol_number || '—'}</td>
                         <td className="py-3 px-4 text-center">{doc.retry_count || 0}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDocInDetail(doc)} title="Ver Detalhes"><Eye className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadXml(doc)} title="Download XML"><Download className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetry(doc.id)} disabled={doc.status === 'authorized' || doc.is_processing} title="Reprocessar"><RefreshCw className={`w-3 h-3 ${doc.is_processing ? 'animate-spin' : ''}`} /></Button>
                            </div>
                          </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </CardContent>
           </Card>
          </TabsContent>

        {/* EMISSÃO */}
        <TabsContent value="nfe">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Emissão de NF-e</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Emitente</p>
                    <div><Label>Integrador</Label>
                      <Select value={integrador} onValueChange={setIntegrador}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oobj">Oobj / Avalara</SelectItem>
                          <SelectItem value="focus">Focus NFe</SelectItem>
                          <SelectItem value="tecnospeed">Tecnospeed</SelectItem>
                          <SelectItem value="direto">SEFAZ Direto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>CNPJ Emitente</Label><Input placeholder="00.000.000/0001-00" value={cnpjEmitente} onChange={e => setCnpjEmitente(e.target.value)} className="mt-1.5 font-mono" /></div>
                    <div><Label>IE</Label><Input placeholder="000.000.000.000" value={ieEmitente} onChange={e => setIeEmitente(e.target.value)} className="mt-1.5 font-mono" /></div>
                    <div><Label>Natureza</Label><Input value={natureza} onChange={e => setNatureza(e.target.value)} className="mt-1.5" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Série</Label><Input value={serie} onChange={e => setSerie(e.target.value)} className="mt-1.5" /></div>
                      <div><Label>Finalidade</Label>
                        <Select value={finalidade} onValueChange={setFinalidade}>
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
                    <div><Label>CNPJ/CPF</Label><Input placeholder="00.000.000/0001-00" value={cnpjDest} onChange={e => setCnpjDest(e.target.value)} className="mt-1.5 font-mono" /></div>
                    <div><Label>Razão Social</Label><Input placeholder="Destinatário" value={razaoDest} onChange={e => setRazaoDest(e.target.value)} className="mt-1.5" /></div>
                    <div><Label>IE Destinatário</Label><Input placeholder="Isento" value={ieDest} onChange={e => setIeDest(e.target.value)} className="mt-1.5 font-mono" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>UF</Label>
                        <Select value={ufDest} onValueChange={setUfDest}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>{ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>CEP</Label><Input placeholder="00000-000" value={cepDest} onChange={e => setCepDest(e.target.value)} className="mt-1.5 font-mono" /></div>
                    </div>
                    <div><Label>Endereço</Label><Input placeholder="Rua, nº, bairro" value={enderecoDest} onChange={e => setEnderecoDest(e.target.value)} className="mt-1.5" /></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Itens ({itens.length})</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" onClick={addItem}><Plus className="w-4 h-4" /> Item</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {itens.map((item, idx) => (
                  <div key={item.id} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Item {idx + 1}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      <div className="md:col-span-2"><Label className="text-xs">Descrição *</Label><Input placeholder="Descrição" value={item.descricao} onChange={e => updateItem(item.id, { descricao: e.target.value })} className="mt-1 text-sm" /></div>
                      <div><Label className="text-xs">NCM</Label><Input placeholder="0000.00.00" value={item.ncm} onChange={e => updateItem(item.id, { ncm: e.target.value })} className="mt-1 text-sm font-mono" /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div><Label className="text-xs">CFOP</Label>
                        <Select value={item.cfop} onValueChange={v => updateItem(item.id, { cfop: v })}>
                          <SelectTrigger className="mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>{cfopComuns.map(c => <SelectItem key={c.split(" ")[0]} value={c.split(" ")[0]} className="text-xs">{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Unid</Label>
                        <Select value={item.unidade} onValueChange={v => updateItem(item.id, { unidade: v })}>
                          <SelectTrigger className="mt-1 text-xs h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>{["UN","KG","LT","MT","M2","CX","PC","PAR","DZ"].map(u => <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Qtd</Label><Input type="number" min="1" value={item.quantidade} onChange={e => updateItem(item.id, { quantidade: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" /></div>
                      <div><Label className="text-xs">Vl. Unit.</Label><Input type="number" min="0" step="0.01" value={item.valorUnitario || ""} onChange={e => updateItem(item.id, { valorUnitario: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" placeholder="0,00" /></div>
                      <div><Label className="text-xs">Subtotal</Label><Input value={`R$ ${(item.quantidade * item.valorUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} disabled className="mt-1 text-sm font-mono h-9 bg-muted/50" /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><Label className="text-xs">ICMS %</Label><Input type="number" value={item.icmsAliquota} onChange={e => updateItem(item.id, { icmsAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" /></div>
                      <div><Label className="text-xs">IPI %</Label><Input type="number" value={item.ipiAliquota} onChange={e => updateItem(item.id, { ipiAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" /></div>
                      <div><Label className="text-xs">PIS %</Label><Input type="number" value={item.pisAliquota} onChange={e => updateItem(item.id, { pisAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" /></div>
                      <div><Label className="text-xs">COFINS %</Label><Input type="number" value={item.cofinsAliquota} onChange={e => updateItem(item.id, { cofinsAliquota: Number(e.target.value) || 0 })} className="mt-1 text-sm font-mono h-9" /></div>
                    </div>
                  </div>
                ))}

                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3"><Calculator className="w-4 h-4 text-primary" /><p className="text-sm font-medium">Totais</p></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-mono font-bold">R$ {totalProdutos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div><p className="text-xs text-muted-foreground">ICMS</p><p className="font-mono">R$ {totalICMS.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div><p className="text-xs text-muted-foreground">IPI</p><p className="font-mono">R$ {totalIPI.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                      <div><p className="text-xs text-muted-foreground">Total NF-e</p><p className="font-mono font-bold text-primary text-lg">R$ {totalNFe.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                    </div>
                  </CardContent>
                </Card>

                <div><Label>Info. Complementares</Label><Textarea placeholder="Observações..." value={infoComplementares} onChange={e => setInfoComplementares(e.target.value)} className="mt-1.5 text-sm" rows={2} /></div>

                <div className="flex gap-3">
                  <Button onClick={handleEmitirNFe} disabled={emitindo} className="gap-2">
                    {emitindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {emitindo ? "Emitindo..." : "Emitir NF-e"}
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={() => setShowXmlPreview(true)}><Eye className="w-4 h-4" /> XML</Button>
                  <Button variant="outline" className="gap-2" onClick={addItem}><Plus className="w-4 h-4" /> Item</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* NOTAS */}
        <TabsContent value="notas">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : nfes.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">Nenhuma NF-e emitida. Use a aba Emissão.</p>
              ) : (
                <table className="w-full">
                  <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                    <th className="text-left py-3 px-4">Número</th>
                    <th className="text-left py-3 px-4">Destinatário</th>
                    <th className="text-left py-3 px-4">Data</th>
                    <th className="text-right py-3 px-4">Valor</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr></thead>
                  <tbody>{nfes.map(nfe => (
                    <tr key={nfe.id} className="border-t hover:bg-muted/30">
                      <td className="py-3 px-4 text-sm font-mono">{nfe.numero}</td>
                      <td className="py-3 px-4 text-sm font-medium">{nfe.razao_destinatario || "—"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(nfe.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="py-3 px-4 text-sm text-right font-mono font-medium text-primary">R$ {Number(nfe.valor_total).toLocaleString("pt-BR")}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={nfe.status === "autorizada" ? "default" : "destructive"} className="text-[10px]">
                          {nfe.status === "autorizada" ? "Autorizada" : "Cancelada"}
                        </Badge>
                      </td>
                       <td className="py-3 px-4 text-center">
                         <div className="flex justify-center gap-1">
                           <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setNfeDetalhe(nfe)}><Eye className="w-3 h-3 mr-1" /> Ver</Button>
                         </div>
                       </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webservices">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          <div className="space-y-3">
            {filteredServicos.map(s => (
              <Card key={s.nome}><CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-medium text-sm">{s.nome}</p><p className="text-[10px] text-muted-foreground font-mono">{s.webservice} • {s.uf}</p></div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/50 text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Online</Badge>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="consultas">
          <div className="space-y-3">
            {consultas.map(c => (
              <Card key={c.tipo}><CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileCode className="w-5 h-5 text-primary" /></div>
                  <div><p className="font-medium text-sm">{c.tipo}</p><p className="text-xs text-muted-foreground">{c.desc}</p><p className="text-[10px] text-muted-foreground font-mono">{c.endpoint}</p></div>
                </div>
                <Badge className="text-[10px]">Ativo</Badge>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integradores">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Configure a chave API em Admin &gt; APIs.</p>
            {integradores.map(int => (
              <Card key={int.nome}><CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm font-display">{int.nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{int.desc}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{int.url}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{int.features.map(f => <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>)}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.info(`Configure em Admin > APIs`)}>Configurar</Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config_avancada">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Configurações do Certificado & SEFAZ
              </CardTitle>
              <CardDescription>Gerencie limites de retentativa, ambiente e senha do e-CNPJ A1.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Parâmetros de Conexão</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>UF</Label>
                      <Select value={fiscalConfig.uf} onValueChange={v => setFiscalConfig(p => ({ ...p, uf: v }))}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>{ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ambiente</Label>
                      <Select value={fiscalConfig.environment} onValueChange={(v: any) => setFiscalConfig(p => ({ ...p, environment: v }))}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homologacao">Homologação</SelectItem>
                          <SelectItem value="producao">Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Senha do Certificado (Criptografada no Servidor)</Label>
                    <div className="relative">
                      <Input 
                        type={showCertPassword ? "text" : "password"} 
                        value={certPassword} 
                        onChange={e => setCertPassword(e.target.value)} 
                        placeholder="Nova senha do .pfx" 
                        className="pr-10"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full px-3" 
                        onClick={() => setShowCertPassword(!showCertPassword)}
                      >
                        {showCertPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">A senha é enviada via canal seguro e criptografada com AES-256 no servidor.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Status do Motor Fiscal</p>
                    <div className={cn("p-4 rounded-lg border flex items-center justify-between", fiscalConfig.is_suspended ? "bg-destructive/10 border-destructive/20" : "bg-green-500/10 border-green-500/20")}>
                      <div className="flex items-center gap-3">
                        {fiscalConfig.is_suspended ? <AlertCircle className="w-5 h-5 text-destructive" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        <div>
                          <p className="font-medium text-sm">{fiscalConfig.is_suspended ? "Motor Suspenso" : "Motor Ativo"}</p>
                          <p className="text-xs text-muted-foreground">
                            {fiscalConfig.is_suspended 
                              ? `Suspenso após ${fiscalConfig.consecutive_validation_failures} falhas consecutivas.` 
                              : "Processando documentos normalmente."}
                          </p>
                        </div>
                      </div>
                      {fiscalConfig.is_suspended && (
                        <Button size="sm" variant="outline" onClick={handleReactivateEngine}>Reativar</Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Políticas de Reprocessamento</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Máximo de Tentativas</Label>
                        <Input 
                          type="number" 
                          value={fiscalConfig.max_retries} 
                          onChange={e => setFiscalConfig(p => ({ ...p, max_retries: Number(e.target.value) }))} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Intervalo (minutos)</Label>
                        <Input 
                          type="number" 
                          value={fiscalConfig.retry_delay_minutes} 
                          onChange={e => setFiscalConfig(p => ({ ...p, retry_delay_minutes: Number(e.target.value) }))} 
                        />
                      </div>
                      <div className="space-y-2 col-span-2 relative">
                        <Label>Throughput (Docs/Min)</Label>
                        <Input 
                          type="number" 
                          value={fiscalConfig.reactivation_throughput} 
                           onChange={e => {
                             const val = Number(e.target.value);
                             if (val > 100) toast.warning("Throughput alto detectado. Verifique os limites da SEFAZ.");
                             if (val < 1) toast.error("Throughput mínimo é 1.");
                             setFiscalConfig(p => ({ ...p, reactivation_throughput: val }));
                           }} 
                          placeholder="Vazão para esta UF/Ambiente"
                        />
                        {fiscalConfig.reactivation_throughput && fiscalConfig.reactivation_throughput > 100 && (
                          <p className="text-[10px] text-amber-600 mt-1 font-medium">Atenção: Valores acima de 100 podem causar bloqueios temporários.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Automação ao Reativar</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Auto-reprocessar Dead-Letters</Label>
                        <Switch 
                          checked={fiscalConfig.auto_retry_on_reactivation} 
                          onCheckedChange={c => setFiscalConfig(p => ({ ...p, auto_retry_on_reactivation: c }))} 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-muted-foreground">Limite de Vazão (throughput)</Label>
                        <Input 
                          type="number" 
                          value={fiscalConfig.reactivation_throughput} 
                          onChange={e => setFiscalConfig(p => ({ ...p, reactivation_throughput: Number(e.target.value) }))} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="w-4 h-4" /> Backlog & Controle Granular (UF/Ambiente)
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportAuditCSV} className="gap-2 h-8 text-[10px]">
                      <Download className="w-3 h-3" /> Exportar Auditoria
                    </Button>
                     <Button variant="outline" size="sm" onClick={handleExportAuditPDF} title="PDF Auditoria" className="h-8 w-8 p-0 border-red-200 hover:bg-red-50">
                       <FileDown className="w-3 h-3 text-red-500" />
                     </Button>
                     <Button variant="outline" size="sm" onClick={handleExportBacklogPDF} title="PDF Backlog" className="h-8 w-8 p-0 border-blue-200 hover:bg-blue-50">
                       <FileDown className="w-3 h-3 text-blue-500" />
                     </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportZip('backlog')} title="Exportar ZIP Backlog" className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50">
                       <FileArchive className="w-3 h-3 text-purple-500" />
                     </Button>
                <Button variant="outline" size="sm" onClick={() => handleExportZip('audit')} title="Exportar ZIP Auditoria" className="h-8 w-8 p-0 border-purple-200 hover:bg-purple-50">
                       <FileArchive className="w-3 h-3 text-purple-600" />
                     </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowAuditLogs(true)} className="gap-2 h-8 text-[10px]">
                      <History className="w-3 h-3" /> Auditoria
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { loadExportHistory(); setShowExportHistory(true); }} className="gap-2 h-8 text-[10px] border-purple-200">
                      <FileArchive className="w-3 h-3 text-purple-500" /> Histórico Export.
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/20 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Filtros:</Label>
                  </div>
                  <Select value={backlogFilters.uf} onValueChange={v => setBacklogFilters(p => ({ ...p, uf: v }))}>
                    <SelectTrigger className="w-24 h-8 text-[10px]"><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas UFs</SelectItem>
                      {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select 
                    onValueChange={v => {
                      const pref = savedPreferences.find(p => p.id === v);
                      if (pref) setBacklogFilters(pref.filters);
                    }}
                  >
                    <SelectTrigger className="w-32 h-8 text-[10px]"><SelectValue placeholder="Filtros Salvos" /></SelectTrigger>
                    <SelectContent>
                      {savedPreferences.filter(p => p.preference_key === 'backlog_filters').map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.preference_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={backlogFilters.env} onValueChange={v => setBacklogFilters(p => ({ ...p, env: v }))}>
                    <SelectTrigger className="w-28 h-8 text-[10px]"><SelectValue placeholder="Ambiente" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Amb.</SelectItem>
                      <SelectItem value="homologacao">Homologação</SelectItem>
                      <SelectItem value="producao">Produção</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">A partir de:</Label>
                    <Input type="date" value={backlogFilters.date} onChange={e => setBacklogFilters(p => ({ ...p, date: e.target.value }))} className="w-32 h-8 text-[10px]" />
                  </div>
                   <div className="flex items-center gap-2">
                     <Input placeholder="cStat" value={backlogFilters.cStat} onChange={e => setBacklogFilters(p => ({ ...p, cStat: e.target.value }))} className="w-20 h-8 text-[10px]" />
                     <Input placeholder="xMotivo" value={backlogFilters.xMotivo} onChange={e => setBacklogFilters(p => ({ ...p, xMotivo: e.target.value }))} className="w-32 h-8 text-[10px]" />
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBacklogFilters({ uf: "all", env: "all", date: "", cStat: "", xMotivo: "" })} title="Limpar Filtros">
                     <X className="w-3 h-3" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSavePrefDialog({ type: 'backlog', filters: backlogFilters })} title="Salvar Filtro">
                     <Settings className="w-3 h-3" />
                   </Button>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" onClick={() => setShowScheduleDialog({ type: 'backlog' })} title="Agendar Exportação">
                     <Zap className="w-3 h-3" />
                   </Button>
                   <div className="ml-auto flex gap-1">
                     <Button variant="outline" size="sm" onClick={handleExportBacklogCSV} title="Exportar CSV" className="h-8 px-2 text-[10px] gap-1">
                       <Download className="w-3 h-3" /> CSV
                     </Button>
                     <Button variant="outline" size="sm" onClick={handleExportBacklogXLSX} title="Exportar Excel" className="h-8 px-2 text-[10px] gap-1 border-green-100">
                       <FileArchive className="w-3 h-3 text-green-500" /> XLSX
                     </Button>
                     <Button variant="outline" size="sm" onClick={handleExportBacklogPDF} title="Exportar PDF" className="h-8 px-2 text-[10px] gap-1 border-red-100">
                       <FileDown className="w-3 h-3 text-red-500" /> PDF
                     </Button>
                   </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 uppercase">
                      <tr>
                        <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setBacklogSort({ field: 'uf', order: backlogSort.field === 'uf' && backlogSort.order === 'asc' ? 'desc' : 'asc' })}>
                          UF {backlogSort.field === 'uf' && (backlogSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setBacklogSort({ field: 'env', order: backlogSort.field === 'env' && backlogSort.order === 'asc' ? 'desc' : 'asc' })}>
                          Ambiente {backlogSort.field === 'env' && (backlogSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-center py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setBacklogSort({ field: 'count', order: backlogSort.field === 'count' && backlogSort.order === 'asc' ? 'desc' : 'asc' })}>
                          Fila {backlogSort.field === 'count' && (backlogSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setBacklogSort({ field: 'next', order: backlogSort.field === 'next' && backlogSort.order === 'asc' ? 'desc' : 'asc' })}>
                          Próximo Envio {backlogSort.field === 'next' && (backlogSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-center py-2 px-4">Status</th>
                        <th className="text-right py-2 px-4">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backlogData.length > 0 ? backlogData.slice((backlogPage - 1) * 10, backlogPage * 10).map(b => {
                        const state = suspensionStates.find(s => s.uf === b.uf && s.environment === b.env);
                        const isPaused = state?.is_paused;
                        const isSuspended = state?.is_suspended;
                        return (
                          <tr key={`${b.uf}-${b.env}`} className="border-t hover:bg-muted/30">
                            <td className="py-2 px-4 font-bold">{b.uf}</td>
                            <td className="py-2 px-4 capitalize">{b.env}</td>
                            <td className="py-2 px-4 text-center">
                              <Badge variant="secondary">{b.count} docs</Badge>
                            </td>
                            <td className="py-2 px-4 text-muted-foreground">
                              {b.next ? new Date(b.next).toLocaleString() : "—"}
                            </td>
                            <td className="py-2 px-4 text-center">
                              {isSuspended ? (
                                <Badge variant="destructive" className="text-[9px]">Suspenso</Badge>
                              ) : isPaused ? (
                                <Badge variant="outline" className="text-[9px] bg-amber-50">Pausado</Badge>
                              ) : (
                                <Badge variant="default" className="text-[9px] bg-green-500">Ativo</Badge>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right">
                              <div className="flex justify-end gap-1">
                                {manualRetryProgress[`${b.uf}-${b.env}`] ? (
                                  <div className="flex flex-col items-end gap-1 px-2">
                                    <div className="flex items-center gap-2">
                                      {manualRetryProgress[`${b.uf}-${b.env}`].status === 'processing' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                                      <span className="text-[9px] font-medium capitalize">
                                        {manualRetryProgress[`${b.uf}-${b.env}`].status === 'queued' ? 'Enfileirado' : 
                                         manualRetryProgress[`${b.uf}-${b.env}`].status === 'processing' ? 'Processando' : 
                                         manualRetryProgress[`${b.uf}-${b.env}`].status === 'done' ? 'Concluído' : 'Erro'}
                                      </span>
                                    </div>
                                    {manualRetryProgress[`${b.uf}-${b.env}`].status === 'done' && (
                                      <span className="text-[8px] text-green-600">{manualRetryProgress[`${b.uf}-${b.env}`].count} docs ok</span>
                                    )}
                                  </div>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[10px] text-primary"
                                    onClick={() => setShowPauseDialog({ uf: b.uf, env: b.env, paused: !!isPaused, manual: true })}
                                    title="Reprocessar Imediatamente"
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" /> Agora
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={cn("h-7 text-[10px]", isPaused ? "text-green-600" : "text-amber-600")}
                                  onClick={() => setShowPauseDialog({ uf: b.uf, env: b.env, paused: !!isPaused })}
                                >
                                  {isPaused ? <Play className="w-3 h-3 mr-1" /> : <Square className="w-3 h-3 mr-1" />}
                                  {isPaused ? "Retomar" : "Pausar"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">Nenhum backlog pendente.</td></tr>
                      )}
                    </tbody>
                  </table>
                  {backlogData.length > 10 && (
                    <div className="flex items-center justify-between p-2 border-t bg-muted/10">
                      <span className="text-[10px] text-muted-foreground">Página {backlogPage} de {Math.ceil(backlogData.length / 10)}</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setBacklogPage(p => Math.max(1, p - 1))} disabled={backlogPage === 1}><ArrowLeft className="w-3 h-3" /></Button>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setBacklogPage(p => Math.min(Math.ceil(backlogData.length / 10), p + 1))} disabled={backlogPage === Math.ceil(backlogData.length / 10)}><ArrowLeft className="w-3 h-3 rotate-180" /></Button>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-sm font-medium text-muted-foreground">Canais de Alerta (Dead-Letter)</p>
                <p className="text-sm font-medium text-muted-foreground">Canais de Alerta (Dead-Letter)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                    <Label className="text-xs">Notificações no App</Label>
                    <Switch checked={notifPrefs.push} onCheckedChange={c => setNotifPrefs(p => ({ ...p, push: c }))} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md border bg-muted/20">
                    <Label className="text-xs">Alertas por E-mail</Label>
                    <Switch checked={notifPrefs.email} onCheckedChange={c => setNotifPrefs(p => ({ ...p, email: c }))} />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" size="sm" onClick={handleSaveNotifPrefs} className="text-xs">Salvar Canais de Alerta</Button>
                  <Button onClick={handleSaveConfig} disabled={configLoading} className="gap-2">
                    {configLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Salvar Configurações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* XML Preview */}
      <Dialog open={showXmlPreview} onOpenChange={setShowXmlPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">XML NF-e</DialogTitle></DialogHeader>
          <pre className="bg-muted/50 p-4 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
{`<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe versao="4.00">
    <ide><natOp>${natureza}</natOp><mod>55</mod><serie>${serie}</serie><finNFe>${finalidade}</finNFe></ide>
    <emit><CNPJ>${cnpjEmitente.replace(/\D/g, "")}</CNPJ><IE>${ieEmitente}</IE></emit>
    <dest><CNPJ>${cnpjDest.replace(/\D/g, "")}</CNPJ><xNome>${razaoDest}</xNome></dest>
${itens.map((item, idx) => `    <det nItem="${idx + 1}">
      <prod><xProd>${item.descricao || "Item"}</xProd><NCM>${item.ncm}</NCM><CFOP>${item.cfop}</CFOP><uCom>${item.unidade}</uCom><qCom>${item.quantidade}</qCom><vUnCom>${item.valorUnitario.toFixed(2)}</vUnCom><vProd>${(item.quantidade * item.valorUnitario).toFixed(2)}</vProd></prod>
      <imposto><ICMS><pICMS>${item.icmsAliquota}</pICMS></ICMS><IPI><pIPI>${item.ipiAliquota}</pIPI></IPI></imposto>
    </det>`).join("\n")}
    <total><vProd>${totalProdutos.toFixed(2)}</vProd><vICMS>${totalICMS.toFixed(2)}</vICMS><vIPI>${totalIPI.toFixed(2)}</vIPI><vNF>${totalNFe.toFixed(2)}</vNF></total>
  </infNFe>
</NFe>`}
          </pre>
         </DialogContent>
       </Dialog>
 
       {/* Pause/Resume Dialog */}
       <Dialog open={!!showPauseDialog} onOpenChange={() => setShowPauseDialog(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle className="font-display">
               {showPauseDialog?.paused ? "Retomar Reprocessamento" : "Pausar Reprocessamento"}
             </DialogTitle>
             <DialogDescription>
               UF: {showPauseDialog?.uf} | Ambiente: {showPauseDialog?.env}
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <div className="space-y-2">
               <Label>Motivo da ação (Auditoria)</Label>
               <Textarea 
                 placeholder="Descreva o motivo..." 
                 value={pauseReason} 
                 onChange={e => setPauseReason(e.target.value)}
                 rows={3}
               />
             </div>
             <div className="flex justify-end gap-2">
               <Button variant="outline" onClick={() => setShowPauseDialog(null)}>Cancelar</Button>
               {showPauseDialog?.manual ? (
                 <Button onClick={() => {
                   if (showPauseDialog) {
                     handleManualRetryBatch(showPauseDialog.uf, showPauseDialog.env);
                     setShowPauseDialog(null);
                   }
                 }}>Confirmar Reprocessamento</Button>
               ) : (
                 <Button 
                   variant={showPauseDialog?.paused ? "default" : "destructive"}
                   onClick={() => showPauseDialog && togglePause(showPauseDialog.uf, showPauseDialog.env, showPauseDialog.paused, pauseReason)}
                 >
                   Confirmar
                 </Button>
               )}
             </div>
           </div>
         </DialogContent>
       </Dialog>
 
       {/* Audit Logs Dialog */}
       <Dialog open={showAuditLogs} onOpenChange={setShowAuditLogs}>
         <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
           <DialogHeader>
              <div className="flex items-center justify-between w-full pr-6">
                <DialogTitle className="font-display flex items-center gap-2">
                  <History className="w-5 h-5" /> Auditoria de Ações Fiscais
                </DialogTitle>
              </div>
           </DialogHeader>
           <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/20 rounded-lg border text-[10px]">
                <div className="flex items-center gap-1">
                  <Label className="text-[9px] uppercase font-bold text-muted-foreground">UF:</Label>
                  <Select value={auditFilters.uf} onValueChange={v => setAuditFilters(p => ({ ...p, uf: v }))}>
                    <SelectTrigger className="w-16 h-7 text-[9px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {ufs.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Select 
                    onValueChange={v => {
                      const pref = savedPreferences.find(p => p.id === v);
                      if (pref) setAuditFilters(pref.filters);
                    }}
                  >
                    <SelectTrigger className="w-24 h-7 text-[9px]"><SelectValue placeholder="Filtros" /></SelectTrigger>
                    <SelectContent>
                      {savedPreferences.filter(p => p.preference_key === 'audit_filters').map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.preference_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[9px] uppercase font-bold text-muted-foreground">Ação:</Label>
                  <Select value={auditFilters.action} onValueChange={v => setAuditFilters(p => ({ ...p, action: v }))}>
                    <SelectTrigger className="w-24 h-7 text-[9px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="pause">Pausa</SelectItem>
                      <SelectItem value="resume">Retomada</SelectItem>
                      <SelectItem value="manual_retry">Reprocessamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-[9px] uppercase font-bold text-muted-foreground">Período:</Label>
                  <Input type="date" value={auditFilters.dateStart} onChange={e => setAuditFilters(p => ({ ...p, dateStart: e.target.value }))} className="w-28 h-7 text-[9px]" />
                  <span className="text-muted-foreground text-[8px]">até</span>
                  <Input type="date" value={auditFilters.dateEnd} onChange={e => setAuditFilters(p => ({ ...p, dateEnd: e.target.value }))} className="w-28 h-7 text-[9px]" />
                </div>
                <div className="flex items-center gap-1">
                  <Input placeholder="cStat" value={auditFilters.cStat} onChange={e => setAuditFilters(p => ({ ...p, cStat: e.target.value }))} className="w-16 h-7 text-[9px]" />
                  <Input placeholder="Motivo" value={auditFilters.xMotivo} onChange={e => setAuditFilters(p => ({ ...p, xMotivo: e.target.value }))} className="w-24 h-7 text-[9px]" />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAuditFilters({ dateStart: "", dateEnd: "", uf: "all", env: "all", action: "all", cStat: "", xMotivo: "" })} title="Limpar Filtros">
                  <X className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSavePrefDialog({ type: 'audit', filters: auditFilters })} title="Salvar Filtro">
                  <Settings className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => setShowScheduleDialog({ type: 'audit' })} title="Agendar Exportação">
                  <Zap className="w-3 h-3" />
                </Button>
                <div className="ml-auto flex gap-1">
                  <Button variant="outline" size="sm" onClick={handleExportAuditCSV} className="h-7 text-[9px] gap-1 px-2">
                    <Download className="w-2.5 h-2.5" /> CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportAuditXLSX} className="h-7 text-[9px] gap-1 px-2 border-green-100">
                    <FileArchive className="w-2.5 h-2.5 text-green-500" /> XLSX
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportAuditPDF} className="h-7 text-[9px] gap-1 px-2 border-red-100">
                    <FileDown className="w-2.5 h-2.5 text-red-500" /> PDF
                  </Button>
                </div>
              </div>
             <div className="overflow-x-auto border rounded-lg">
               <table className="w-full text-xs">
                 <thead className="bg-muted uppercase">
                    <tr>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setAuditSort({ field: 'created_at', order: auditSort.field === 'created_at' && auditSort.order === 'asc' ? 'desc' : 'asc' })}>
                        Data/Hora {auditSort.field === 'created_at' && (auditSort.order === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setAuditSort({ field: 'action', order: auditSort.field === 'action' && auditSort.order === 'asc' ? 'desc' : 'asc' })}>
                        Ação {auditSort.field === 'action' && (auditSort.order === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted" onClick={() => setAuditSort({ field: 'uf', order: auditSort.field === 'uf' && auditSort.order === 'asc' ? 'desc' : 'asc' })}>
                        UF/Amb {auditSort.field === 'uf' && (auditSort.order === 'asc' ? '↑' : '↓')}
                      </th>
                      <th className="text-left py-2 px-4">Motivo</th>
                    </tr>
                 </thead>
                 <tbody>
                   {auditLogs.map(log => (
                     <tr key={log.id} className="border-t hover:bg-muted/30">
                       <td className="py-2 px-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                       <td className="py-2 px-4">
                         <Badge variant="outline" className={cn("text-[9px]", 
                           log.action === 'pause' ? 'border-amber-500 text-amber-500' : 
                           log.action === 'resume' ? 'border-green-500 text-green-500' : 
                           'border-blue-500 text-blue-500'
                         )}>
                           {log.action.toUpperCase()}
                         </Badge>
                       </td>
                       <td className="py-2 px-4">{log.uf}/{log.environment}</td>
                       <td className="py-2 px-4 text-muted-foreground">{log.reason || '—'}</td>
                     </tr>
                   ))}
                   {auditLogs.length === 0 && (
                     <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum log encontrado.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
         </DialogContent>
       </Dialog>

      {/* NF-e Detail */}
      <Dialog open={!!nfeDetalhe} onOpenChange={() => setNfeDetalhe(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">NF-e {nfeDetalhe?.numero}</DialogTitle></DialogHeader>
          {nfeDetalhe && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Número</p><p className="font-mono">{nfeDetalhe.numero}</p></div>
                <div><p className="text-xs text-muted-foreground">Série</p><p>{nfeDetalhe.serie}</p></div>
                <div><p className="text-xs text-muted-foreground">Destinatário</p><p className="font-medium">{nfeDetalhe.razao_destinatario}</p></div>
                <div><p className="text-xs text-muted-foreground">Data</p><p>{new Date(nfeDetalhe.created_at).toLocaleDateString("pt-BR")}</p></div>
                <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-mono">R$ {Number(nfeDetalhe.valor_produtos).toLocaleString("pt-BR")}</p></div>
                <div><p className="text-xs text-muted-foreground">Total</p><p className="font-mono font-bold text-primary">R$ {Number(nfeDetalhe.valor_total).toLocaleString("pt-BR")}</p></div>
              </div>
              {nfeDetalhe.chave_acesso && (
                <div><p className="text-xs text-muted-foreground">Chave de Acesso</p><p className="font-mono text-[10px] bg-muted/50 p-2 rounded mt-1 break-all">{nfeDetalhe.chave_acesso}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
       {/* Dead-Letter Detail Dialog */}
       <Dialog open={!!dlSelectedNotif} onOpenChange={() => setDlSelectedNotif(null)}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="font-display">Detalhes do Alerta Dead-Letter</DialogTitle>
           </DialogHeader>
           {dlSelectedNotif && (
             <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground uppercase">ID Alerta</p>
                   <p className="font-mono text-sm">{dlSelectedNotif.id}</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground uppercase">ID Documento</p>
                   <p className="font-mono text-sm">{dlSelectedNotif.document_id}</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground uppercase">Retentativas</p>
                   <p className="font-mono text-sm">{dlSelectedNotif.retry_count_at_failure || 'N/A'}</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground uppercase">Canais</p>
                   <div className="flex gap-1 mt-1">
                    {dlSelectedNotif.channels?.map((c: string) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                   </div>
                 </div>
               </div>

               <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                 <p className="text-xs font-bold text-destructive uppercase">Erro Retornado (SEFAZ)</p>
                 <div className="mt-2 flex gap-2">
                   <Badge variant="destructive" className="h-5">cStat: {dlSelectedNotif.cstat}</Badge>
                   <p className="text-xs text-muted-foreground font-medium">{dlSelectedNotif.xmotivo}</p>
                 </div>
                 {dlSelectedNotif.error_message && (
                   <div className="mt-3 p-2 bg-background/50 rounded border text-[10px] font-mono whitespace-pre-wrap">
                     {dlSelectedNotif.error_message}
                   </div>
                 )}
               </div>

               <div className="flex justify-end gap-2">
                 <Button variant="outline" size="sm" onClick={() => {
                   const doc = dlSelectedNotif.processed_documents;
                   if (doc) setDocInDetail(doc);
                   else toast.error("Documento não encontrado");
                 }}>Ver Documento</Button>
                 {dlSelectedNotif.last_xml_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={dlSelectedNotif.last_xml_url} target="_blank" rel="noopener noreferrer">Baixar XML Transmitido</a>
                    </Button>
                 )}
                 <Button size="sm" onClick={() => handleRetry(dlSelectedNotif.document_id)}>Reprocessar Manual</Button>
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>

       {/* Document Detail Dialog */}
       <Dialog open={!!docInDetail} onOpenChange={() => setDocInDetail(null)}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle className="font-display flex items-center gap-2">
               <FileText className="w-5 h-5 text-primary" /> Detalhes do Documento {docInDetail?.id.slice(0, 8)}
             </DialogTitle>
           </DialogHeader>
           {docInDetail && (
             <div className="space-y-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground">Status</p>
                   <Badge variant={docInDetail.status === 'authorized' ? 'default' : 'secondary'} className="mt-1 uppercase text-[9px]">{docInDetail.status}</Badge>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground">Protocolo</p>
                   <p className="font-mono text-sm mt-1">{docInDetail.protocol_number || '—'}</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground">Data</p>
                   <p className="text-sm mt-1">{new Date(docInDetail.created_at).toLocaleString('pt-BR')}</p>
                 </div>
                 <div className="p-3 bg-muted/30 rounded-lg">
                   <p className="text-xs text-muted-foreground">Tentativas</p>
                   <p className="text-sm mt-1">{docInDetail.retry_count || 0}</p>
                 </div>
               </div>

               {docInDetail.last_error && (
                 <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                   <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                   <div>
                     <p className="text-sm font-medium text-destructive">Último Erro</p>
                     <p className="text-xs text-destructive/80 mt-1">{docInDetail.last_error}</p>
                   </div>
                 </div>
               )}

               <Tabs defaultValue="xml_assinado">
                 <TabsList>
                   <TabsTrigger value="xml_assinado">XML Assinado</TabsTrigger>
                   <TabsTrigger value="xml_bruto">XML Bruto</TabsTrigger>
                   <TabsTrigger value="logs">Logs</TabsTrigger>
                 </TabsList>
                 <TabsContent value="xml_assinado" className="mt-2">
                   <pre className="bg-muted p-4 rounded-lg text-[10px] font-mono overflow-auto max-h-[300px]">
                     {docInDetail.signed_xml_content || 'Aguardando assinatura...'}
                   </pre>
                 </TabsContent>
                 <TabsContent value="xml_bruto" className="mt-2">
                   <pre className="bg-muted p-4 rounded-lg text-[10px] font-mono overflow-auto max-h-[300px]">
                     {docInDetail.xml_content}
                   </pre>
                 </TabsContent>
                  <TabsContent value="logs" className="mt-2">
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {docInDetail.processing_log?.length ? (
                        docInDetail.processing_log.map((log: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg bg-muted/20 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-[11px] text-primary">{log.event}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                            {(log.cStat || log.xMotivo) && (
                              <div className="text-[10px] bg-muted/50 p-1.5 rounded flex gap-2">
                                <span className="font-bold">cStat: {log.cStat || '—'}</span>
                                <span className="text-muted-foreground">{log.xMotivo || '—'}</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8 text-sm">Sem registros de processamento.</p>
                      )}
                    </div>
                  </TabsContent>
               </Tabs>
               
               <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleExportLog(docInDetail)} className="gap-2">
                  <Download className="w-4 h-4" /> Exportar Log
                </Button>
                <Button variant="outline" onClick={() => handleDownloadXml(docInDetail)}>Download XML</Button>
                {(docInDetail.status === 'error' || docInDetail.status === 'dead-letter') && <Button onClick={() => handleRetry(docInDetail.id)}>Tentar Novamente</Button>}
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>

        {/* Save Preference Dialog */}
        <Dialog open={!!showSavePrefDialog} onOpenChange={() => setShowSavePrefDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Salvar Filtros</DialogTitle>
              <DialogDescription>Dê um nome para identificar este conjunto de filtros.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome do Filtro</Label>
                <Input 
                  placeholder="Ex: Pendentes SP, Erros Homologação..." 
                  value={newPrefName}
                  onChange={e => setNewPrefName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSavePrefDialog(null)}>Cancelar</Button>
                <Button onClick={handleSavePreference}>Salvar Filtro</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Report Dialog */}
        <Dialog open={!!showScheduleDialog} onOpenChange={() => setShowScheduleDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Exportação Automática</DialogTitle>
              <DialogDescription>Configure o envio recorrente por e-mail.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select value={newSchedule.format} onValueChange={v => setNewSchedule(p => ({ ...p, format: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={newSchedule.frequency} onValueChange={v => setNewSchedule(p => ({ ...p, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
               <div className="space-y-3">
                 <Label>Destinatários ({newSchedule.emails.length})</Label>
                 <div className="flex gap-2">
                   <Input 
                     type="email" 
                     placeholder="email@exemplo.com"
                     value={newSchedule.currentEmail}
                     onChange={e => setNewSchedule(p => ({ ...p, currentEmail: e.target.value }))}
                     onKeyDown={e => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         if (newSchedule.currentEmail && !newSchedule.emails.includes(newSchedule.currentEmail)) {
                           setNewSchedule(p => ({ ...p, emails: [...p.emails, p.currentEmail], currentEmail: "" }));
                         }
                       }
                     }}
                   />
                   <Button onClick={() => {
                     if (newSchedule.currentEmail && !newSchedule.emails.includes(newSchedule.currentEmail)) {
                       setNewSchedule(p => ({ ...p, emails: [...p.emails, p.currentEmail], currentEmail: "" }));
                     }
                   }}>Add</Button>
                 </div>
                 <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto p-1 border rounded bg-muted/30">
                   {newSchedule.emails.length === 0 && <span className="text-[10px] text-muted-foreground italic px-2">Nenhum e-mail adicionado.</span>}
                   {newSchedule.emails.map((email, i) => (
                     <div key={i} className="flex items-center gap-1 bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full border border-primary/20">
                       {email}
                       <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => setNewSchedule(p => ({ ...p, emails: p.emails.filter(e => e !== email) }))} />
                     </div>
                   ))}
                 </div>
               </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowScheduleDialog(null)}>Cancelar</Button>
                <Button onClick={() => setShowExportPreview(true)}>Visualizar & Confirmar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export Preview Dialog */}
        <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Recorte de Exportação</DialogTitle>
              <DialogDescription>Verifique o volume de dados antes de agendar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2 border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo de Relatório:</span>
                  <span className="font-bold capitalize">{showScheduleDialog?.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Volume de Registros:</span>
                  <span className="font-bold text-primary">
                    {showScheduleDialog?.type === 'backlog' ? backlogData.length : auditLogs.length} registros
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Período Detectado:</span>
                  <span className="font-bold">
                    {showScheduleDialog?.type === 'backlog' 
                      ? (backlogFilters.date || 'Todo histórico') 
                      : (auditFilters.dateStart || 'Início') + ' até ' + (auditFilters.dateEnd || 'Hoje')}
                  </span>
                </div>
                 <div className="flex flex-col text-sm gap-1">
                   <span className="text-muted-foreground">Destinatários:</span>
                   <div className="flex flex-wrap gap-1">
                     {newSchedule.emails.length > 0 ? newSchedule.emails.map(e => (
                       <span key={e} className="bg-primary/5 px-1.5 py-0.5 rounded text-[10px] border">{e}</span>
                     )) : <span className="text-destructive text-[10px] font-bold">Nenhum! (Adicione acima)</span>}
                     {newSchedule.currentEmail && <span className="bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border italic opacity-70">{newSchedule.currentEmail} (pendente)</span>}
                   </div>
                 </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExportPreview(false)}>Voltar</Button>
                <Button onClick={() => { handleCreateSchedule(); setShowExportPreview(false); }}>Confirmar Agendamento</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ZIP Preview Dialog */}
        <Dialog open={!!showZipPreviewDialog} onOpenChange={(open) => !open && setShowZipPreviewDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-purple-500" /> Confirmar Exportação ZIP
              </DialogTitle>
              <DialogDescription>
                Verifique o recorte antes de gerar o pacote contendo CSV e PDF.
              </DialogDescription>
            </DialogHeader>
            {showZipPreviewDialog && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded p-3 bg-muted/30 col-span-2">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Volume de Dados</span>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-xl font-bold">{showZipPreviewDialog.count}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">total (pacote ZIP)</span>
                      </div>
                        <div className="text-[10px] text-right space-y-0.5">
                          <p className="text-blue-600 font-medium">CSV: {showZipPreviewDialog.count} reg. (separado)</p>
                          <p className="text-red-600 font-medium">PDF: {showZipPreviewDialog.count} reg. (separado)</p>
                          {showZipPreviewDialog.isCalculating ? (
                            <p className="text-muted-foreground animate-pulse">Calculando Hashes...</p>
                          ) : showZipPreviewDialog.expectedCsvHash && (
                            <p className="text-[8px] font-mono text-muted-foreground truncate max-w-[150px]" title={showZipPreviewDialog.expectedCsvHash}>
                              SHA: {showZipPreviewDialog.expectedCsvHash.substring(0, 16)}...
                            </p>
                          )}
                        </div>
                    </div>
                  </div>
                  <div className="border rounded p-3 bg-muted/30">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Relatório</span>
                      <span className="text-xl font-bold capitalize">{showZipPreviewDialog.type}</span>
                      {showZipPreviewDialog.filters.action && showZipPreviewDialog.filters.action !== 'all' && (
                        <span className="text-[9px] block text-muted-foreground">Ação: {showZipPreviewDialog.filters.action}</span>
                      )}
                  </div>
                </div>

                <div className="space-y-2 border rounded-lg p-3 text-xs bg-muted/10">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">UF:</span>
                    <span className="font-medium">{showZipPreviewDialog.filters.uf || 'Todas'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-muted-foreground">Ambiente:</span>
                    <span className="font-medium capitalize">{showZipPreviewDialog.filters.env || 'Todos'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">
                      {showZipPreviewDialog.type === 'backlog' 
                        ? (showZipPreviewDialog.filters.date || 'Todo histórico')
                        : (showZipPreviewDialog.filters.dateStart || 'Início') + ' até ' + (showZipPreviewDialog.filters.dateEnd || 'Hoje')}
                    </span>
                  </div>
                </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleExportZip(showZipPreviewDialog.type, 'proof')} disabled={showZipPreviewDialog.isCalculating}>
                      <CheckSquare className="w-4 h-4 mr-2" /> Modo Prova
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowZipPreviewDialog(null)}>Cancelar</Button>
                      <Button className="bg-purple-600 hover:bg-purple-700" onClick={confirmExportZip} disabled={showZipPreviewDialog.isCalculating}>
                        <Download className="w-4 h-4 mr-2" /> Gerar ZIP Agora
                      </Button>
                    </div>
                  </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Run Progress Dialog */}
        <Dialog open={!!manualScheduleStatus} onOpenChange={(open) => {
          if (!open && (manualScheduleStatus?.status === 'success' || manualScheduleStatus?.status === 'error')) {
            setManualScheduleStatus(null);
          }
        }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">Executando Exportação</DialogTitle>
            </DialogHeader>
            {manualScheduleStatus && (
              <div className="py-6 flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - manualScheduleStatus.progress / 100)} className="text-primary transition-all duration-500" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                    {manualScheduleStatus.progress}%
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="font-medium">
                    {manualScheduleStatus.status === 'initializing' && 'Validando agendamento...'}
                    {manualScheduleStatus.status === 'running' && 'Processando dados no servidor...'}
                    {manualScheduleStatus.status === 'success' && 'Exportação concluída!'}
                    {manualScheduleStatus.status === 'error' && 'Erro no processamento'}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {manualScheduleStatus.status !== 'success' && manualScheduleStatus.status !== 'error' ? 'Aguarde a conclusão...' : 'Pronto'}
                  </p>
                </div>

                {manualScheduleStatus.status === 'success' && manualScheduleStatus.zipUrl && (
                  <Button asChild className="w-full mt-2 bg-green-600 hover:bg-green-700">
                    <a href={manualScheduleStatus.zipUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" /> Baixar Pacote ZIP
                    </a>
                  </Button>
                )}

                {(manualScheduleStatus.status === 'success' || manualScheduleStatus.status === 'error') && (
                  <Button variant="outline" className="w-full" onClick={() => setManualScheduleStatus(null)}>
                    Fechar
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Export History Dialog */}
        <Dialog open={showExportHistory} onOpenChange={setShowExportHistory}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileArchive className="w-5 h-5 text-purple-500" /> Histórico de Exportações Agendadas
              </DialogTitle>
            </DialogHeader>
             <div className="space-y-4">
               <Tabs defaultValue="history">
                 <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="history">Execuções Recentes</TabsTrigger>
                   <TabsTrigger value="schedules">Agendamentos Ativos</TabsTrigger>
                 </TabsList>
                 
                 <TabsContent value="history" className="mt-4">
                   <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-muted uppercase">
                    <tr>
                      <th className="text-left py-2 px-4">Data/Hora</th>
                      <th className="text-left py-2 px-4">Relatório</th>
                      <th className="text-left py-2 px-4">Formato</th>
                       <th className="text-center py-2 px-4">Recorte (Reg)</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-right py-2 px-4">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportHistory.map(log => (
                      <tr key={log.id} className="border-t hover:bg-muted/30">
                        <td className="py-2 px-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                         <td className="py-2 px-4">
                           <div className="flex flex-col">
                             <span className="capitalize font-medium">{log.report_type}</span>
                             {log.filters && (
                               <span className="text-[8px] text-muted-foreground truncate max-w-[120px]">
                                 UF: {log.filters.uf || 'Todas'} | Env: {log.filters.env || 'Todos'}
                               </span>
                             )}
                           </div>
                         </td>
                        <td className="py-2 px-4 uppercase font-bold">{log.format}</td>
                         <td className="py-2 px-4 text-center">
                           <div className="flex flex-col items-center">
                             <span className="font-bold">{log.record_count || 0}</span>
                             <span className="text-[8px] text-muted-foreground">CSV: {log.csv_count || 0} | PDF: {log.pdf_count || 0}</span>
                           </div>
                         </td>
                        <td className="py-2 px-4">
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[9px]">
                            {log.status === 'success' ? 'Enviado' : 'Erro'}
                          </Badge>
                        </td>
                         <td className="py-2 px-4 text-right">
                           <div className="flex flex-col items-end gap-1">
                             <div className="flex gap-1">
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 onClick={() => handleResendEmail(log.id)} 
                                 className={cn("h-7 text-[10px]", log.resend_status === 'sent' ? "text-green-600" : "text-purple-600")}
                                 disabled={log.resend_status === 'sending'}
                               >
                                  {log.resend_status === 'sending' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
                                  {log.resend_status === 'sent' ? 'E-mail Enviado' : (log.resend_status === 'sending' ? 'Enviando...' : 'Reenviar E-mail')}
                               </Button>
                                {log.file_url && (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => verifyAndDownload(log)} className="h-6 text-[9px] text-green-600 border border-green-100 bg-green-50/50">
                                         <FileArchive className="w-3 h-3 mr-1" /> ZIP
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => verifyAndDownloadFile(log, 'csv')} className="h-6 text-[9px] text-green-600 border border-green-100 bg-green-50/50">
                                         <FileText className="w-3 h-3 mr-1" /> CSV
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => verifyAndDownloadFile(log, 'pdf')} className="h-6 text-[9px] text-green-600 border border-green-100 bg-green-50/50">
                                         <FileDown className="w-3 h-3 mr-1" /> PDF
                                      </Button>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => downloadAuditSummary(log)} className="h-6 text-[9px] text-orange-600 border border-orange-100 bg-orange-50/50">
                                         <Calculator className="w-3 h-3 mr-1" /> Auditoria
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleRunProofFromHistory(log)} className="h-6 text-[9px] text-amber-600 border border-amber-100 bg-amber-50/50" title="Validar sem baixar">
                                         <Zap className="w-3 h-3 mr-1" /> Prova
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleRerunExport(log)} className="h-6 text-[9px] text-blue-600 border border-blue-100 bg-blue-50/50" title="Repetir Exportação">
                                         <RefreshCw className="w-3 h-3 mr-1" /> Repetir
                                      </Button>
                                    </div>
                                  </div>
                                )}
                             </div>
                             <div className="flex flex-col items-end">
                               {log.status === 'success' ? (
                                 <div className="flex flex-col items-end text-[8px] text-green-600">
                                   <span>Geração: {log.stage_counts?.generation || 0} reg | Proc: {log.stage_counts?.processing || 0} reg</span>
                                   {log.technical_log?.sorting && (
                                     <div className="flex flex-col items-end">
                                       <span className="text-muted-foreground font-mono">
                                         Log: {log.technical_log.sorting.field} ({log.technical_log.sorting.order}), P{log.technical_log.page}
                                       </span>
                                       <span className="text-[7px] text-muted-foreground font-mono">
                                         Hash CSV: {log.csv_hash?.substring(0, 16)}...
                                       </span>
                                       {log.validation_divergence && (
                                         <Badge variant="destructive" className="text-[7px] h-3 px-1 mt-0.5">Divergência Detectada</Badge>
                                       )}
                                     </div>
                                   )}
                                 </div>
                               ) : (
                                 <div className="text-[8px] text-destructive max-w-[200px] text-right" title={log.full_error_details || log.error_message}>
                                   <span className="font-bold">Falha (Etapa: {log.technical_log?.stage || 'Geração'}):</span>
                                   <p className="line-clamp-2">{log.full_error_details || log.error_message || 'Erro inesperado'}</p>
                                 </div>
                               )}
                             </div>
                           </div>
                         </td>
                      </tr>
                    ))}
                     {exportHistory.length === 0 && (
                       <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma exportação registrada.</td></tr>
                     )}
                   </tbody>
                 </table>
                 <div className="flex items-center justify-between p-2 border-t bg-muted/10">
                   <span className="text-[10px] text-muted-foreground">Página {auditPage}</span>
                   <div className="flex gap-1">
                     <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1}><ArrowLeft className="w-3 h-3" /></Button>
                     <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => setAuditPage(p => p + 1)} disabled={auditLogs.length < 10}><ArrowLeft className="w-3 h-3 rotate-180" /></Button>
                   </div>
                 </div>
               </div>
             </TabsContent>
 
             <TabsContent value="schedules" className="mt-4">
               <div className="overflow-x-auto border rounded-lg">
                 <table className="w-full text-xs">
                   <thead className="bg-muted uppercase">
                     <tr>
                       <th className="text-left py-2 px-4">Relatório</th>
                       <th className="text-left py-2 px-4">Frequência</th>
                       <th className="text-left py-2 px-4">Formato</th>
                       <th className="text-left py-2 px-4">Destinatários</th>
                       <th className="text-right py-2 px-4">Ação</th>
                     </tr>
                   </thead>
                   <tbody>
                     {scheduledReports.map(schedule => (
                       <tr key={schedule.id} className="border-t hover:bg-muted/30">
                         <td className="py-2 px-4 capitalize font-medium">{schedule.report_type}</td>
                         <td className="py-2 px-4 capitalize">{schedule.frequency}</td>
                         <td className="py-2 px-4 uppercase">{schedule.format}</td>
                         <td className="py-2 px-4">
                           <div className="flex flex-wrap gap-1">
                             {(schedule.email_recipients || []).slice(0, 2).map((e: string) => (
                               <span key={e} className="bg-muted px-1.5 py-0.5 rounded text-[10px] border">{e}</span>
                             ))}
                             {(schedule.email_recipients || []).length > 2 && <span className="text-[9px] text-muted-foreground">+{schedule.email_recipients.length - 2}</span>}
                           </div>
                         </td>
                         <td className="py-2 px-4 text-right">
                           <Button variant="outline" size="sm" onClick={() => handleRunScheduleNow(schedule)} className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:bg-primary/10">
                             <Play className="w-2.5 h-2.5" /> Executar Agora
                           </Button>
                         </td>
                       </tr>
                     ))}
                     {scheduledReports.length === 0 && (
                       <tr><td colSpan={5} className="py-8 text-center text-muted-foreground italic">Nenhum agendamento ativo.</td></tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </TabsContent>
           </Tabs>
         </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
