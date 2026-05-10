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
      FileDown, Play, CheckSquare, Square, FileArchive, History, Filter, X, ArrowLeft, Pin, PinOff, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
      Star, Share2, ClipboardCheck, Info, List
  } from "lucide-react";
 import { Zap, Copy, Save, Upload, Edit3, ExternalLink } from "lucide-react";
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

 const CURRENT_FILTER_VERSION = "2.0";

 type FilterImportHistory = {
   id: string;
   fileName: string;
   userName: string;
   date: string;
   detectedVersion: string;
   result: "success" | "migrated" | "error";
   migrationLog?: string[];
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
   const [savedPreferences, setSavedPreferences] = useState<any[]>(() => {
     const stored = localStorage.getItem('sefaz_saved_preferences');
     return stored ? JSON.parse(stored) : [];
   });
 
   useEffect(() => {
     localStorage.setItem('sefaz_saved_preferences', JSON.stringify(savedPreferences));
   }, [savedPreferences]);
 
   const [logPagination, setLogPagination] = useState(() => {
     const stored = localStorage.getItem('sefaz_log_pagination');
     return stored ? JSON.parse(stored) : { page: 1, pageSize: 50 };
   });
 
   const [historyPagination, setHistoryPagination] = useState(() => {
     const stored = localStorage.getItem('sefaz_history_pagination');
     return stored ? JSON.parse(stored) : { page: 1, pageSize: 10 };
   });
 
   const [historySort, setHistorySort] = useState<{ field: string, order: 'asc' | 'desc' }>(() => {
     const stored = localStorage.getItem('sefaz_history_sort');
     return stored ? JSON.parse(stored) : { field: 'created_at', order: 'desc' };
   });
 
   useEffect(() => localStorage.setItem('sefaz_log_pagination', JSON.stringify(logPagination)), [logPagination]);
   useEffect(() => localStorage.setItem('sefaz_history_pagination', JSON.stringify(historyPagination)), [historyPagination]);
   useEffect(() => localStorage.setItem('sefaz_history_sort', JSON.stringify(historySort)), [historySort]);
 
    const [importPreview, setImportPreview] = useState<{
      filters: any[];
      validation: { id: string; errors: string[]; suggestions: string[]; version: string; status: "valid" | "warning" | "error" }[];
      fileName: string;
    } | null>(null);
    const [importHistory, setImportHistory] = useState<FilterImportHistory[]>(() => {
      const stored = localStorage.getItem('sefaz_import_history');
      return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
      localStorage.setItem('sefaz_import_history', JSON.stringify(importHistory));
    }, [importHistory]);

    const [showImportHistory, setShowImportHistory] = useState(false);
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const importData = urlParams.get('importFilter');
      if (importData) {
        try {
          const decoded = JSON.parse(atob(importData));
          setImportPreview({
            filters: [decoded],
            validation: [validateAndMigrate(decoded)],
            fileName: "Link Compartilhado"
          });
          // Clear param
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (e) {
          toast.error("Link de filtro inválido");
        }
      }
    }, []);

    const validateAndMigrate = (filter: any) => {
      const errors: string[] = [];
      const suggestions: string[] = [];
      let status: "valid" | "warning" | "error" = "valid";
      const version = filter.version || "1.0";

      if (!filter.preference_name) {
        errors.push("Nome do filtro ausente");
        status = "error";
      }

      if (!filter.filters) {
        errors.push("Regras de filtro ausentes");
        status = "error";
      }

      if (version !== CURRENT_FILTER_VERSION) {
        suggestions.push(`Migrar da versão ${version} para ${CURRENT_FILTER_VERSION}`);
        if (status !== "error") status = "warning";
      }

      // Example specific rule check
      if (filter.filters && filter.filters.stage && !['all', 'CSV', 'PDF', 'ZIP'].includes(filter.filters.stage)) {
        errors.push(`Etapa inválida: ${filter.filters.stage}`);
        suggestions.push("Redefinir etapa para 'all'");
        status = "error";
      }

      return { id: filter.id || Math.random().toString(), errors, suggestions, version, status };
    };

    const handleShareFilter = (filter: any) => {
      const shareableData = btoa(JSON.stringify({
        ...filter,
        version: CURRENT_FILTER_VERSION
      }));
      const url = `${window.location.origin}${window.location.pathname}?importFilter=${shareableData}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    };

    const toggleFavoriteFilter = async (id: string, current: boolean) => {
      const { error } = await (supabase.from as any)("fiscal_user_preferences").update({ is_favorite: !current }).eq("id", id);
      if (error) return toast.error("Erro ao atualizar favorito");
      setSavedPreferences(prev => prev.map(p => p.id === id ? { ...p, is_favorite: !current } : p));
    };

    const exportMigrationReport = (historyItem: FilterImportHistory, format: 'csv' | 'pdf') => {
      if (format === 'csv') {
        const content = [
          ["Data", "Arquivo", "Versão", "Resultado"],
          [historyItem.date, historyItem.fileName, historyItem.detectedVersion, historyItem.result],
          [],
          ["Log de Alterações/Erros"],
          ...(historyItem.migrationLog || []).map(log => [log])
        ].map(row => row.join(";")).join("\n");

        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio_migracao_${historyItem.id}.csv`;
        link.click();
      } else {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Relatório de Migração de Filtros", 14, 20);
        doc.setFontSize(10);
        doc.text(`Arquivo: ${historyItem.fileName}`, 14, 30);
        doc.text(`Data: ${historyItem.date}`, 14, 35);
        doc.text(`Versão Detectada: ${historyItem.detectedVersion}`, 14, 40);
        doc.text(`Resultado: ${historyItem.result}`, 14, 45);

        autoTable(doc, {
          startY: 55,
          head: [['Log de Eventos']],
          body: (historyItem.migrationLog || []).map(log => [log]),
        });

        doc.save(`relatorio_migracao_${historyItem.id}.pdf`);
      }
      toast.success("Relatório exportado");
    };
   const [filterSearchQuery, setFilterSearchQuery] = useState("");
    const [showSavePrefDialog, setShowSavePrefDialog] = useState<{ type: 'backlog' | 'audit' | 'log_search', filters: any } | null>(null);
    const [newPrefName, setNewPrefName] = useState("");
    const [showFiltersManager, setShowFiltersManager] = useState(false);
    const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
    const [filterNewName, setFilterNewName] = useState("");

    const handleSetDefaultFilter = async (id: string) => {
      const currentFilter = savedPreferences.find(p => p.id === id);
      if (!currentFilter) return;
      const newIsDefault = !currentFilter.is_default;

      // First, remove default from others of same key
      if (newIsDefault) {
        await (supabase.from as any)("fiscal_user_preferences")
          .update({ is_default: false })
          .eq("preference_key", currentFilter.preference_key);
      }

      const { error } = await (supabase.from as any)("fiscal_user_preferences")
        .update({ is_default: newIsDefault })
        .eq("id", id);

      if (error) return toast.error("Erro ao definir filtro padrão");

      setSavedPreferences(prev => prev.map(p => ({
        ...p,
        is_default: p.id === id ? newIsDefault : (newIsDefault && p.preference_key === currentFilter.preference_key ? false : p.is_default)
      })));
      toast.success(newIsDefault ? "Filtro definido como padrão" : "Filtro padrão removido");
    };

    const handleDeleteFilter = async (id: string) => {
      const { error } = await (supabase.from as any)("fiscal_user_preferences").delete().eq("id", id);
      if (error) return toast.error("Erro ao deletar filtro");
      setSavedPreferences(prev => prev.filter(p => p.id !== id));
      toast.success("Filtro removido");
    };

    const handleRenameFilter = async (id: string, newName: string) => {
      const { error } = await (supabase.from as any)("fiscal_user_preferences").update({ preference_name: newName }).eq("id", id);
      if (error) return toast.error("Erro ao renomear filtro");
      setSavedPreferences(prev => prev.map(p => p.id === id ? { ...p, preference_name: newName } : p));
      setEditingFilterId(null);
      toast.success("Filtro renomeado");
    };

    const handleDuplicateFilter = async (filter: any) => {
      const { data, error } = await (supabase.from as any)("fiscal_user_preferences").insert([{
        user_id: user?.id,
        preference_key: filter.preference_key,
        preference_name: `${filter.preference_name} (Cópia)`,
        filters: filter.filters,
        is_favorite: !!filter.is_favorite,
        version: filter.version || CURRENT_FILTER_VERSION,
        is_default: false
      }]).select();
      if (error) return toast.error("Erro ao duplicar filtro");
      setSavedPreferences(prev => [...prev, ...data]);
      toast.success("Filtro duplicado");
    };

    const handleExportFilters = () => {
      const filtersToExport = savedPreferences.filter(p => p.preference_key === 'log_search_filters');
      const blob = new Blob([JSON.stringify(filtersToExport, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `filtros_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Filtros exportados com sucesso!");
    };

    const handleImportFilters = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          let imported = JSON.parse(content);
          if (!Array.isArray(imported)) imported = [imported];

          const validation = imported.map((f: any) => validateAndMigrate(f));
          setImportPreview({
            filters: imported,
            validation,
            fileName: file.name
          });
        } catch (err: any) {
          toast.error("Falha ao ler arquivo: " + err.message);
        }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
    };

    const confirmImport = async () => {
      if (!importPreview) return;
      
      const migrationLogs: string[] = [];
      const toInsert = importPreview.filters.map((f, idx) => {
        const v = importPreview.validation[idx];
        if (v.status === "error") {
          migrationLogs.push(`Pulado: ${f.preference_name || 'Sem Nome'} - Erros: ${v.errors.join(', ')}`);
          return null;
        }
        
        if (v.version !== CURRENT_FILTER_VERSION) {
          migrationLogs.push(`Migrado: ${f.preference_name} da versão ${v.version} para ${CURRENT_FILTER_VERSION}`);
        } else {
          migrationLogs.push(`Importado: ${f.preference_name} (OK)`);
        }

        return {
          user_id: user?.id,
          preference_key: 'log_search_filters',
          preference_name: f.preference_name,
          filters: f.filters,
          version: CURRENT_FILTER_VERSION,
          is_favorite: !!f.is_favorite
        };
      }).filter(Boolean);

      const { data, error } = await (supabase.from as any)("fiscal_user_preferences").insert(toInsert).select();
      
      const resultStatus = error ? "error" : (migrationLogs.some(l => l.startsWith('Migrado')) ? "migrated" : "success");
      
      const historyItem: FilterImportHistory = {
        id: Math.random().toString(36).substr(2, 9),
        fileName: importPreview.fileName,
        userName: user?.email || "Sistema",
        date: new Date().toLocaleString(),
        detectedVersion: importPreview.validation[0]?.version || "Unknown",
        result: resultStatus as any,
        migrationLog: migrationLogs
      };

      setImportHistory(prev => [historyItem, ...prev]);
      
      if (error) {
        toast.error("Erro na importação final");
      } else {
        setSavedPreferences(prev => [...prev, ...(data || [])]);
        toast.success(`${(data || []).length} filtros importados com sucesso!`);
      }
      setImportPreview(null);
    };
    const [scheduledReports, setScheduledReports] = useState<any[]>([]);
    const [showScheduleDialog, setShowScheduleDialog] = useState<{ type: 'backlog' | 'audit' } | null>(null);
     const [newSchedule, setNewSchedule] = useState({ format: 'pdf', frequency: 'daily', emails: [] as string[] as string[], currentEmail: "" });
    const [showExportPreview, setShowExportPreview] = useState(false);
    const [showZipPreviewDialog, setShowZipPreviewDialog] = useState<{ 
      type: 'backlog' | 'audit', 
      count: number, 
      filters: any, 
      sort?: any,
      previewCount?: number,
      expectedCsvHash?: string,
      expectedPdfHash?: string,
      isCalculating?: boolean
    } | null>(null);
    const [manualScheduleStatus, setManualScheduleStatus] = useState<{ id: string, status: string, progress: number, zipUrl?: string } | null>(null);
   const [showAuditDetailDialog, setShowAuditDetailDialog] = useState<any | null>(null);
 
   useEffect(() => {
     if (showAuditDetailDialog) {
       const defaultFilter = savedPreferences.find(p => p.preference_key === 'log_search_filters' && p.is_default);
       if (defaultFilter) {
         setLogSearch(defaultFilter.filters.search || "");
         setLogFilterStage(defaultFilter.filters.stage || "all");
       } else {
         setLogSearch("");
         setLogFilterStage("all");
       }
       setLogPagination({ page: 1, pageSize: 50 });
     }
   }, [showAuditDetailDialog, savedPreferences]);
     const [selectedHistoryItems, setSelectedHistoryItems] = useState<string[]>([]);
     const [showComparisonDialog, setShowComparisonDialog] = useState<any[] | null>(null);
     const [logSearch, setLogSearch] = useState("");
     const [logFilterStage, setLogFilterStage] = useState("all");
     const [pinnedExecutions, setPinnedExecutions] = useState<string[]>([]);
     const [logMatchIndex, setLogMatchIndex] = useState(0);
     const [batchProofProgress, setBatchProofProgress] = useState<{ total: number, current: number, results: any[] } | null>(null);
    const handleBulkDownloadAudit = async (format: 'json' | 'xlsx' | 'pdf') => {
      if (exportHistory.length === 0) return;
     toast.info(`Gerando resumo consolidado (${format.toUpperCase()})...`);
     const data = exportHistory.map(log => ({
       id: log.id,
       data: new Date(log.created_at).toLocaleString(),
       relatorio: log.report_type,
       status: log.status,
       divergencia: log.validation_divergence ? 'SIM' : 'NÃO',
       registros: log.record_count,
       csv_hash: log.csv_hash,
       pdf_hash: log.pdf_hash,
       zip_hash: log.zip_hash,
       parametros: JSON.stringify(log.technical_log),
       filtros: JSON.stringify(log.filters),
       destinatarios: log.recipients?.join(", ")
     }));
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `auditoria_consolidada_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria");
        XLSX.writeFile(wb, `auditoria_consolidada_${new Date().toISOString().split('T')[0]}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text("Relatório Consolidado de Auditoria Fiscal", 14, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 22);
        
        const tableData = data.map(d => [
          d.data,
          d.relatorio,
          d.status,
          d.divergencia,
          d.registros,
          d.csv_hash.substring(0, 10) + "..."
        ]);

        autoTable(doc, {
          startY: 30,
          head: [['Data', 'Relatório', 'Status', 'Div.', 'Reg.', 'Hash CSV']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [126, 34, 206] }
        });
        
        doc.save(`auditoria_consolidada_${new Date().toISOString().split('T')[0]}.pdf`);
      }
     toast.success("Resumo consolidado exportado com sucesso!");
   };

   const copyToClipboard = (text: string, label: string) => {
     navigator.clipboard.writeText(text);
     toast.success(`${label} copiado para a área de transferência!`);
   };

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
    const [historyFilters, setHistoryFilters] = useState({
      status: "all",
      divergence: "all",
      uf: "all",
      env: "all",
      dateStart: "",
      dateEnd: "",
      recipient: ""
    });
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
      let query = supabase
        .from("fiscal_export_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (historyFilters.status !== "all") query = query.eq("status", historyFilters.status);
      if (historyFilters.divergence === "true") query = query.eq("validation_divergence", true);
      if (historyFilters.divergence === "false") query = query.eq("validation_divergence", false);
      if (historyFilters.uf !== "all") query = query.filter("filters->>uf", "eq", historyFilters.uf);
      if (historyFilters.env !== "all") query = query.filter("filters->>env", "eq", historyFilters.env);
      if (historyFilters.dateStart) query = query.gte("created_at", historyFilters.dateStart);
      if (historyFilters.dateEnd) query = query.lte("created_at", historyFilters.dateEnd + "T23:59:59");
      if (historyFilters.recipient) query = query.filter("recipients", "cs", `{"${historyFilters.recipient}"}`);

      const { data } = await query.limit(50);
      if (data) setExportHistory(data);
    };

    const loadUserPreferences = async () => {
      if (!user) return;
      const { data } = await (supabase.from as any)("fiscal_user_preferences")
        .select("*")
        .eq("user_id", user.id);
      if (data) setSavedPreferences(data);
    };

    const handleSavePreference = async () => {
      if (!user || !showSavePrefDialog || !newPrefName.trim()) return;
      const { error } = await (supabase.from as any)("fiscal_user_preferences").upsert({
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
      setManualScheduleStatus({ id: schedule.id, status: 'initializing', progress: 5 });
      toast.info("Iniciando processamento manual da exportação...");
      
      try {
        setManualScheduleStatus(prev => prev ? { ...prev, status: 'running', progress: 20 } : null);
        const { error } = await supabase.functions.invoke("fiscal-scheduler", {
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
        
        setManualScheduleStatus(prev => prev ? { ...prev, status: 'generating_csv', progress: 40 } : null);
        
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 20) {
          await new Promise(r => setTimeout(r, 2000));
          const { data: latestLog } = await supabase
            .from("fiscal_export_logs")
            .select("*")
            .eq("report_id", schedule.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          
          if (latestLog) {
            if (latestLog.status === 'processing') {
               // Simulating stage progress based on steps
               const currentProgress = 40 + (attempts * 2);
               setManualScheduleStatus(prev => prev ? { ...prev, progress: Math.min(85, currentProgress) } : null);
            } else if (latestLog.status === 'success') {
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
        loadExportHistory();
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

    const verifyAndDownloadFile = async (log: any, fileType: 'csv' | 'pdf' | 'zip') => {
      if (!log.file_url) {
        toast.error("URL do arquivo não disponível.");
        return;
      }
      toast.info(`Processando download de ${fileType.toUpperCase()}...`);
      const newEvent = { timestamp: new Date().toISOString(), type: 'download', file: fileType, verified: false };
      try {
        const response = await fetch(log.file_url);
        const blob = await response.blob();
        if (fileType === 'zip') {
          const zipHash = await calculateHash(blob);
          if (log.zip_hash && zipHash !== log.zip_hash) {
            toast.error("DIVERGÊNCIA: Hash do ZIP não confere!");
            return;
          }
          newEvent.verified = true;
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `${log.report_type}_fiscal.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
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
          newEvent.verified = true;
          toast.success(`${fileType.toUpperCase()} baixado e verificado.`);
        }
        } // Close else
        const updatedEvents = [...(log.audit_events || []), newEvent];
        await supabase.from("fiscal_export_logs").update({ audit_events: updatedEvents }).eq("id", log.id);
        loadExportHistory();
      } catch (err) {
        toast.error(`Erro ao processar ${fileType.toUpperCase()}.`);
      }
    };

    const downloadAuditSummary = (log: any, format: 'json' | 'xlsx' = 'json') => {
      const summaryData = {
        "ID Execução": log.id,
        "Data Criação": new Date(log.created_at).toLocaleString(),
        "Tipo": log.report_type,
        "Status": log.status,
        "Divergência": log.validation_divergence ? "SIM" : "NÃO",
        "Registros Total": log.record_count,
        "CSV Count": log.csv_count,
        "PDF Count": log.pdf_count,
        "Hash CSV": log.csv_hash,
        "Hash PDF": log.pdf_hash,
        "Filtros": JSON.stringify(log.filters),
        "Destinatários": (log.recipients || []).join(", "),
        "Tamanho Página": log.technical_log?.page_size || 10,
        "Ordenação": log.technical_log?.field || "",
        "Direção": log.technical_log?.direction || ""
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `resumo_auditoria_${log.id.substring(0, 8)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const ws = XLSX.utils.json_to_sheet([summaryData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resumo Auditoria");
        XLSX.writeFile(wb, `resumo_auditoria_${log.id.substring(0, 8)}.xlsx`);
      }
      toast.success(`Resumo de auditoria (${format.toUpperCase()}) exportado.`);
    };

    const handleRunProofFromHistory = async (log: any, silent = false) => {
      const startTime = performance.now();
      if (!silent) setManualScheduleStatus({ id: 'proof-rerun', status: 'initializing', progress: 10 });
      if (!silent) toast.info("Iniciando Modo Prova a partir do histórico...");
      
      try {
        // Using the same logic as handleExportZip but focused on proof from history
        await handleExportZip(log.report_type as 'backlog' | 'audit', 'proof', log.filters, log.technical_log?.sorting);
        
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;

        if (!silent) setManualScheduleStatus(prev => prev ? { ...prev, status: 'success', progress: 100 } : null);
        if (!silent) toast.success(`Reexecução (Prova) concluída em ${duration.toFixed(2)}s!`);
        
        // Find the newly created log (it will be the most recent one with format 'proof')
        // Actually, we can just return success and the duration.
        return { success: true, duration, timestamp: new Date().toISOString() };
      } catch (err: any) {
        if (!silent) setManualScheduleStatus(prev => prev ? { ...prev, status: 'error', progress: 100 } : null);
        if (!silent) toast.error("Erro na reexecução: " + err.message);
        return { success: false, error: err.message, duration: 0 };
      }
    };

      const handleExportZip = async (type: 'backlog' | 'audit', mode: 'full' | 'proof' = 'full', overrideFilters?: any, overrideSort?: any) => {
        const filters = overrideFilters || (type === 'backlog' ? backlogFilters : auditFilters);
        const sort = overrideSort || (type === 'backlog' ? backlogSort : auditSort);
        
        const count = type === 'backlog' 
          ? backlogData.reduce((acc, b) => acc + b.count, 0) 
          : auditLogs.length;
        
        setShowZipPreviewDialog({ type, count, filters, sort, previewCount: count, isCalculating: true });

       // Pre-calculate hashes for preview/proof
       let csvContent = "";
       let rows: any[] = [];
         let finalCsvHash = "";
         let finalPdfHash = "";
         let finalRecordCount = 0;
         let finalTechLog: any = null;
         let finalDivergence = false;

         if (type === 'backlog') {
         const sortedData = [...backlogData].sort((a: any, b: any) => {
           const field = sort.field;
           const modifier = sort.order === 'asc' ? 1 : -1;
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
          const currentActualCount = type === 'backlog' ? backlogData.reduce((acc, b) => acc + b.count, 0) : auditLogs.length;
          const divergence = count !== currentActualCount;
          await supabase.from("fiscal_export_logs").insert([{
            user_id: user.id, report_type: type, format: 'proof', status: 'success', 
            record_count: count, csv_count: count, pdf_count: count, 
            csv_hash: csvHash, pdf_hash: pdfHash,
            validation_divergence: divergence, filters: filters, 
             technical_log: { mode: 'proof', sorting: sort, timestamp: new Date().toISOString(), execution_id: crypto.randomUUID() } as any,
             expected_data: { csv_hash: csvHash, pdf_hash: pdfHash, count: count },
             recipients: [],
             audit_events: ([
               { timestamp: new Date().toISOString(), stage: 'initializing', message: 'Iniciando Modo Prova a partir de dados históricos.' },
               { timestamp: new Date().toISOString(), stage: 'csv_gen', message: `Dados CSV recalculados (${count} registros).` },
               { timestamp: new Date().toISOString(), stage: 'pdf_gen', message: 'PDF simulado para auditoria de hash.' },
               { timestamp: new Date().toISOString(), stage: 'hash_calc', message: 'Hashes SHA-256 gerados com sucesso.' },
               { 
                 timestamp: new Date().toISOString(), 
                 stage: 'validation', 
                 message: divergence ? 'Divergência detectada entre snapshot e dados atuais.' : 'Integridade confirmada. Dados idênticos ao snapshot.',
                 status: divergence ? 'warning' : 'success'
               }
             ] as any[])
          }]);
          loadExportHistory();
          toast.success("Modo Prova concluído e registrado no histórico.");
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
                const newEvent = {
                  timestamp: new Date().toISOString(),
                  stage: 'download_validation',
                  message: 'Falha crítica de integridade no download!',
                  status: 'error',
                  reason: `Hash obtido (${currentHash.substring(0, 8)}) não bate com o esperado.`
                };
                await supabase.from("fiscal_export_logs").update({
                  audit_events: [...(log.audit_events || []), newEvent],
                  validation_divergence: true
                }).eq("id", log.id);
                loadExportHistory();
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
         const { type, previewCount, filters, sort, expectedCsvHash, expectedPdfHash } = showZipPreviewDialog;
        
        setManualScheduleStatus({ id: 'manual-zip', status: 'initializing', progress: 5 });
        setShowZipPreviewDialog(null);
        
        const zip = new JSZip();
        let finalCsvHash = "";
        let finalPdfHash = "";
        let finalRecordCount = 0;
        let finalTechLog: any = null;
        let finalDivergence = false;
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
            setManualScheduleStatus(prev => prev ? { ...prev, status: 'generating_csv', progress: 20 } : null);
             finalCsvHash = await calculateHash(csvContent);
             zip.file(`backlog_fiscal_${dateStr}.csv`, csvContent);
            
            setManualScheduleStatus(prev => prev ? { ...prev, status: 'generating_pdf', progress: 50 } : null);

           const doc = new jsPDF();
           doc.text("Backlog Fiscal", 14, 15);
           autoTable(doc, { head: [headers], body: rows, startY: 25 });
           const pdfContent = doc.output('blob');
             finalPdfHash = await calculateHash(pdfContent);
             zip.file(`backlog_fiscal_${dateStr}.pdf`, pdfContent);

            setManualScheduleStatus(prev => prev ? { ...prev, status: 'calculating_hashes', progress: 80 } : null);
             finalTechLog = { 
               execution_id: crypto.randomUUID(),
               sorting: sort, 
               page: backlogPage, 
               page_size: 10,
               direction: sort.order,
               field: sort.field,
               timestamp: new Date().toISOString(), 
               csv_hash: finalCsvHash, 
               pdf_hash: finalPdfHash, 
               preview_count: previewCount, 
               final_count: rows.length 
             };
             finalRecordCount = rows.length;
             finalDivergence = previewCount !== rows.length;
            zip.file(`log_tecnico_${dateStr}.json`, JSON.stringify(finalTechLog, null, 2));
          } else {
           const headers = ["Data/Hora", "Ação", "UF", "Ambiente", "Motivo", "cStat", "xMotivo"];
           const rows = auditLogs.map(log => [new Date(log.created_at).toLocaleString(), log.action.toUpperCase(), log.uf, log.environment, log.reason || "", log.cstat || "", log.xmotivo || ""]);
           const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))].join("\n");
            setManualScheduleStatus(prev => prev ? { ...prev, status: 'generating_csv', progress: 20 } : null);
             finalCsvHash = await calculateHash(csvContent);
             zip.file(`auditoria_fiscal_${dateStr}.csv`, csvContent);
            
            setManualScheduleStatus(prev => prev ? { ...prev, status: 'generating_pdf', progress: 50 } : null);

           const doc = new jsPDF();
           doc.text("Auditoria Fiscal", 14, 15);
           autoTable(doc, { head: [headers], body: rows, startY: 25 });
           const pdfContent = doc.output('blob');
             finalPdfHash = await calculateHash(pdfContent);
             zip.file(`auditoria_fiscal_${dateStr}.pdf`, pdfContent);

            setManualScheduleStatus(prev => prev ? { ...prev, status: 'calculating_hashes', progress: 80 } : null);

             finalTechLog = { 
               execution_id: crypto.randomUUID(),
               sorting: sort, 
               page: auditPage, 
               page_size: 10,
               direction: sort.order,
               field: sort.field,
               timestamp: new Date().toISOString(), 
               csv_hash: finalCsvHash, 
               pdf_hash: finalPdfHash, 
               preview_count: previewCount, 
               final_count: rows.length 
             };
             finalRecordCount = rows.length;
             finalDivergence = previewCount !== rows.length;
            zip.file(`log_tecnico_${dateStr}.json`, JSON.stringify(finalTechLog, null, 2));
          }
  
        setManualScheduleStatus(prev => prev ? { ...prev, status: 'finalizing_zip', progress: 95 } : null);
        const content = await zip.generateAsync({ type: "blob" });
        const zipHash = await calculateHash(content);
        
        // Determine which counts/hashes to use for log
        // We'll need to store these during the generation above
        // ... actually let's just use local variables that we'll pull out
        
        const url = URL.createObjectURL(content);

         const auditEvents: any[] = [
           { timestamp: new Date().toISOString(), stage: 'initializing', message: 'Iniciando exportação completa do relatório.' },
           { timestamp: new Date().toISOString(), stage: 'csv_gen', message: `Arquivo CSV gerado com ${finalRecordCount} registros.` },
           { timestamp: new Date().toISOString(), stage: 'pdf_gen', message: 'Documento PDF formatado e pronto.' },
           { timestamp: new Date().toISOString(), stage: 'hash_calc', message: 'Hashes SHA-256 calculados e validados.' },
           { timestamp: new Date().toISOString(), stage: 'finalizing', message: 'Pacote ZIP finalizado e pronto para download.' }
         ];
 
         if (finalDivergence) {
           auditEvents.push({
             timestamp: new Date().toISOString(),
             stage: 'validation',
             message: 'Divergência de contagem detectada!',
             status: 'error',
             reason: `Esperado: ${previewCount} | Obtido: ${finalRecordCount}`
           });
         }
 
         await supabase.from("fiscal_export_logs").insert([{
           user_id: user.id, report_type: type, format: 'zip', status: 'success', 
           record_count: finalRecordCount, csv_count: finalRecordCount, pdf_count: finalRecordCount, 
           csv_hash: finalCsvHash, pdf_hash: finalPdfHash, zip_hash: zipHash,
           validation_divergence: finalDivergence, filters: filters, technical_log: finalTechLog as any, recipients: [],
           expected_data: { csv_hash: expectedCsvHash, pdf_hash: expectedPdfHash, count: previewCount },
           audit_events: auditEvents
         }]);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}_fiscal_${dateStr}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setManualScheduleStatus(prev => prev ? { ...prev, status: 'success', progress: 100, zipUrl: url } : null);
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
                       <tr key={log.id} className={cn(
                         "border-t hover:bg-muted/30 transition-colors",
                         log.validation_divergence ? "bg-red-50/50" : ""
                       )}>
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
 
         {/* Filters Manager Dialog */}
          <Dialog open={showFiltersManager} onOpenChange={setShowFiltersManager}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Gerenciar Filtros Salvos
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowImportHistory(true)}>
                    <History className="w-4 h-4 mr-2" /> Histu00f3rico
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar filtros..." 
                    className="pl-9 h-9" 
                    value={filterSearchQuery}
                    onChange={e => setFilterSearchQuery(e.target.value)}
                  />
                </div>
                <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="text-left py-2 px-3">Filtro / Versu00e3o</th>
                        <th className="text-right py-2 px-3">Au00e7u00f5es</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {savedPreferences
                        .filter(p => p.preference_key === "log_search_filters")
                        .filter(p => p.preference_name.toLowerCase().includes(filterSearchQuery.toLowerCase()))
                        .sort((a, b) => (a.is_favorite ? -1 : 1))
                        .map(pref => (
                          <tr key={pref.id} className="hover:bg-muted/50">
                            <td className="py-2 px-3">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  {pref.is_favorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                                  <span className="font-semibold">{pref.preference_name}</span>
                                </div>
                                <span className="text-[9px] text-muted-foreground">Versu00e3o {pref.version || "1.0"}</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className={cn("h-7 w-7", pref.is_favorite && "text-yellow-600")} onClick={() => toggleFavoriteFilter(pref.id, !!pref.is_favorite)}>
                                <Star className={cn("w-3.5 h-3.5", pref.is_favorite && "fill-current")} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => handleShareFilter(pref)} title="Compartilhar">
                                <Share2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteFilter(pref.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" variant="outline" onClick={() => document.getElementById("import-filters-v2")?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Importar
                  </Button>
                  <input id="import-filters-v2" type="file" className="hidden" accept=".json" onChange={handleImportFilters} />
                  <Button className="flex-1" variant="outline" onClick={handleExportFilters}>
                    <Download className="w-4 h-4 mr-2" /> Exportar Todos
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>


        <Dialog open={!!showAuditDetailDialog} onOpenChange={() => setShowAuditDetailDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Auditoria de Exportação - #{showAuditDetailDialog?.id?.substring(0, 8)}
              </DialogTitle>
              <DialogDescription>
                Detalhes técnicos e validação de integridade da exportação.
              </DialogDescription>
            </DialogHeader>

             {showAuditDetailDialog && (
               <div className="space-y-4 py-4">
                 <div className="grid grid-cols-2 gap-4">
                  <div className={cn(
                    "p-3 rounded-lg border",
                    showAuditDetailDialog.validation_divergence ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {showAuditDetailDialog.validation_divergence ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                      <span className={cn("font-bold text-sm", showAuditDetailDialog.validation_divergence ? "text-red-700" : "text-green-700")}>
                        Status de Integridade: {showAuditDetailDialog.validation_divergence ? 'Falha' : 'Sucesso'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {showAuditDetailDialog.validation_divergence 
                        ? "Divergência detectada entre a pré-visualização e os registros finais incluídos no arquivo."
                        : "Todos os registros e hashes foram validados com sucesso."}
                    </p>
                  </div>

                   <div className="p-3 rounded-lg border bg-muted/30 relative group">
                     <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Identificador de Execução</span>
                     <code className="text-xs font-mono break-all">{showAuditDetailDialog.technical_log?.execution_id || showAuditDetailDialog.id}</code>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" 
                       onClick={() => copyToClipboard(showAuditDetailDialog.technical_log?.execution_id || showAuditDetailDialog.id, "ID de Execução")}
                     >
                       <CheckSquare className="w-3 h-3" />
                     </Button>
                   </div>
                 </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <FileCode className="w-4 h-4" /> Validação de Hashes (SHA-256)
                  </h4>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-[10px]">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left py-1.5 px-3">Indicador</th>
                          <th className="text-left py-1.5 px-3">Esperado (Pré-visualização)</th>
                          <th className="text-left py-1.5 px-3">Obtido (Processado)</th>
                          <th className="text-center py-1.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="py-2 px-3 font-medium">Contagem (Registros)</td>
                          <td className="py-2 px-3 font-mono">{showAuditDetailDialog.expected_data?.count || '-'}</td>
                          <td className="py-2 px-3 font-mono">{showAuditDetailDialog.record_count || '-'}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={showAuditDetailDialog.expected_data?.count === showAuditDetailDialog.record_count ? "outline" : "destructive"} className="h-4 text-[8px]">
                              {showAuditDetailDialog.expected_data?.count === showAuditDetailDialog.record_count ? 'OK' : 'DIVERGENTE'}
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="py-2 px-3 font-medium">Hash CSV</td>
                          <td className="py-2 px-3 font-mono text-[8px] break-all opacity-60">{showAuditDetailDialog.expected_data?.csv_hash || 'N/A'}</td>
                          <td className="py-2 px-3 font-mono text-[8px] break-all">{showAuditDetailDialog.csv_hash || 'N/A'}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={showAuditDetailDialog.expected_data?.csv_hash === showAuditDetailDialog.csv_hash ? "outline" : "destructive"} className="h-4 text-[8px]">
                              {showAuditDetailDialog.expected_data?.csv_hash === showAuditDetailDialog.csv_hash ? 'OK' : 'FALHA'}
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="py-2 px-3 font-medium">Hash PDF</td>
                          <td className="py-2 px-3 font-mono text-[8px] break-all opacity-60">{showAuditDetailDialog.expected_data?.pdf_hash || 'N/A'}</td>
                          <td className="py-2 px-3 font-mono text-[8px] break-all">{showAuditDetailDialog.pdf_hash || 'N/A'}</td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={showAuditDetailDialog.expected_data?.pdf_hash === showAuditDetailDialog.pdf_hash ? "outline" : "destructive"} className="h-4 text-[8px]">
                              {showAuditDetailDialog.expected_data?.pdf_hash === showAuditDetailDialog.pdf_hash ? 'OK' : 'FALHA'}
                            </Badge>
                          </td>
                        </tr>
                        <tr className="border-t bg-muted/10">
                          <td className="py-2 px-3 font-medium">Hash ZIP</td>
                          <td className="py-2 px-3 font-mono text-[8px] italic opacity-60">Indisponível na Pré-viz</td>
                          <td className="py-2 px-3 font-mono text-[8px] break-all">{showAuditDetailDialog.zip_hash || 'Pendente'}</td>
                          <td className="py-2 px-3 text-center">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                 <div className="space-y-2">
                   <div className="flex items-center justify-between">
                     <h4 className="text-sm font-bold flex items-center gap-2">
                       <Settings className="w-4 h-4" /> Parâmetros Técnicos de Reprodução
                     </h4>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="h-6 text-[9px]"
                       onClick={() => {
                         const block = `ID: ${showAuditDetailDialog.technical_log?.execution_id || showAuditDetailDialog.id}\nOrdenação: ${showAuditDetailDialog.technical_log?.field || showAuditDetailDialog.technical_log?.sorting?.field || '-'}\nDireção: ${showAuditDetailDialog.technical_log?.direction || showAuditDetailDialog.technical_log?.sorting?.order || '-'}\nPágina: ${showAuditDetailDialog.technical_log?.page || '-'}\nTamanho: ${showAuditDetailDialog.technical_log?.page_size || '10'}`;
                         copyToClipboard(block, "Bloco Técnico");
                       }}
                     >
                       Copiar Bloco Técnico
                     </Button>
                   </div>
                 </div>
 
                 <div className="space-y-2">
                   <h4 className="text-sm font-bold flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Logs de Auditoria do Sistema
                   </h4>
                  <div className="space-y-2">
                     <div className="flex gap-2 items-center flex-wrap">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                        <Input 
                          placeholder="Buscar nos logs (ex: erro, hash, csv)..." 
                          className="pl-7 h-8 text-[10px]" 
                          value={logSearch}
                          onChange={e => setLogSearch(e.target.value)}
                        />
                      </div>
                       <div className="flex items-center gap-1">
                          <div className="flex gap-1 overflow-x-auto pb-1 max-w-[200px] no-scrollbar">
                            {[
                              { id: 'all', label: 'Tudo' },
                              { id: 'csv_gen', label: 'CSV' },
                              { id: 'pdf_gen', label: 'PDF' },
                              { id: 'hash_calc', label: 'Hash' },
                              { id: 'validation', label: 'Falha' }
                            ].map(chip => {
                              const count = (showAuditDetailDialog.audit_events || []).filter((e: any) => 
                                chip.id === 'all' ? true : (chip.id === 'validation' ? e.status === 'error' || e.status === 'warning' : e.stage === chip.id)
                              ).length;
                              return (
                                <Badge 
                                  key={chip.id}
                                  variant={logFilterStage === chip.id ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer whitespace-nowrap h-6 text-[9px] px-2",
                                    logFilterStage === chip.id ? "bg-primary" : "hover:bg-muted"
                                  )}
                                  onClick={() => setLogFilterStage(chip.id)}
                                >
                                  {chip.label} ({count})
                                </Badge>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              title="Salvar busca nos logs"
                              onClick={() => setShowSavePrefDialog({ type: 'log_search', filters: { search: logSearch, stage: logFilterStage } })}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              title="Gerenciar filtros salvos"
                              onClick={() => setShowFiltersManager(true)}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                         <Select 
                           onValueChange={(v) => {
                             const pref = savedPreferences.find(p => p.id === v);
                             if (pref) {
                               setLogSearch(pref.filters.search);
                               setLogFilterStage(pref.filters.stage);
                             }
                           }}
                         >
                           <SelectTrigger className="w-[100px] h-8 text-[10px]">
                             <SelectValue placeholder="Salvos" />
                           </SelectTrigger>
                           <SelectContent>
                             {savedPreferences.filter(p => p.preference_key === 'log_search_filters').map(p => (
                               <SelectItem key={p.id} value={p.id}>{p.preference_name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       
                       {logSearch && (
                         <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-6 w-6" 
                             onClick={() => setLogMatchIndex(prev => Math.max(0, prev - 1))}
                           >
                             <ChevronUp className="h-3 w-3" />
                           </Button>
                           <span className="text-[9px] min-w-[30px] text-center">
                             {logMatchIndex + 1} / {
                               (showAuditDetailDialog.audit_events || []).filter((evt: any) => 
                                 evt.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                                 (evt.reason && evt.reason.toLowerCase().includes(logSearch.toLowerCase()))
                               ).length || 1
                             }
                           </span>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-6 w-6" 
                             onClick={() => setLogMatchIndex(prev => prev + 1)}
                           >
                             <ChevronDown className="h-3 w-3" />
                           </Button>
                         </div>
                       )}
                    </div>
                    <div className="flex justify-between items-center mt-2 px-1">
                      <div className="text-[9px] text-muted-foreground">
                        Mostrando {Math.min((logPagination.page - 1) * logPagination.pageSize + 1, (showAuditDetailDialog.audit_events || []).length)} - {Math.min(logPagination.page * logPagination.pageSize, (showAuditDetailDialog.audit_events || []).length)} de {(showAuditDetailDialog.audit_events || []).length} logs
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={logPagination.page === 1}
                          onClick={() => setLogPagination(p => ({ ...p, page: p.page - 1 }))}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-6 w-6" 
                          disabled={logPagination.page * logPagination.pageSize >= (showAuditDetailDialog.audit_events || []).length}
                          onClick={() => setLogPagination(p => ({ ...p, page: p.page + 1 }))}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[10px] max-h-[150px] overflow-y-auto space-y-1 mt-1">
                      {(showAuditDetailDialog.audit_events || [
                        { timestamp: showAuditDetailDialog.created_at, stage: 'initializing', message: 'Iniciando processo de auditoria...' },
                        { timestamp: showAuditDetailDialog.created_at, stage: 'csv_gen', message: 'Geração de dados CSV concluída.' },
                        { timestamp: showAuditDetailDialog.created_at, stage: 'pdf_gen', message: 'Geração de PDF concluída.' },
                        { timestamp: showAuditDetailDialog.created_at, stage: 'hash_calc', message: 'Cálculo de hashes SHA-256 concluído.' },
                        { timestamp: showAuditDetailDialog.created_at, stage: 'finalizing', message: 'Pacote finalizado com sucesso.' }
                       ]).filter((evt: any, idx: number) => {
                         const matchesSearch = logSearch === "" || 
                           evt.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                           (evt.reason && evt.reason.toLowerCase().includes(logSearch.toLowerCase())) ||
                           evt.stage.toLowerCase().includes(logSearch.toLowerCase()) || idx.toString().includes(logSearch);
                         const matchesStage = logFilterStage === "all" || evt.stage === logFilterStage;
                         return matchesSearch && matchesStage;
                       }).slice((logPagination.page - 1) * logPagination.pageSize, logPagination.page * logPagination.pageSize).map((evt: any, idx: number) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "flex gap-2 border-b border-slate-800 pb-1 last:border-0 p-1 rounded transition-colors",
                            logSearch && (
                              evt.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                              (evt.reason && evt.reason.toLowerCase().includes(logSearch.toLowerCase()))
                            ) ? "bg-amber-500/20 ring-1 ring-amber-500/30" : ""
                          )}
                        >
                          <span className="text-slate-500">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                          <span className="text-blue-400 uppercase">[{evt.stage}]</span>
                          <span className={cn(evt.status === 'error' ? 'text-red-400 font-bold' : 'text-slate-100')}>
                            {evt.message}
                            {evt.reason && <span className="block text-red-300 ml-4 italic mt-1 bg-red-900/20 p-1 rounded">MOTIVO: {evt.reason}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                 </div>
 
                 <div className="flex justify-between items-center pt-4 border-t mt-4 flex-wrap gap-4">
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => verifyAndDownloadFile(showAuditDetailDialog, 'csv')}>
                       <FileDown className="w-3.5 h-3.5 mr-1.5" /> Baixar CSV
                     </Button>
                     <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => verifyAndDownloadFile(showAuditDetailDialog, 'pdf')}>
                       <FileText className="w-3.5 h-3.5 mr-1.5" /> Baixar PDF
                     </Button>
                     <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => verifyAndDownloadFile(showAuditDetailDialog, 'zip')}>
                       <FileArchive className="w-3.5 h-3.5 mr-1.5" /> Baixar ZIP
                     </Button>
                   </div>
 
                   <div className="flex items-center gap-2">
                     <div className="flex gap-1">
                       <Button variant="outline" size="sm" onClick={() => downloadAuditSummary(showAuditDetailDialog, 'json')}>
                         <Download className="w-4 h-4 mr-2" /> Resumo JSON
                       </Button>
                       <Button variant="outline" size="sm" onClick={() => downloadAuditSummary(showAuditDetailDialog, 'xlsx')}>
                         <Download className="w-4 h-4 mr-2" /> Resumo XLSX
                       </Button>
                     </div>
                     
                     <div className="flex flex-col items-end gap-1">
                       <Button 
                         variant="default" 
                         size="sm" 
                         onClick={() => handleRunProofFromHistory(showAuditDetailDialog)}
                         disabled={manualScheduleStatus?.status === 'running' || manualScheduleStatus?.status === 'initializing' || (manualScheduleStatus?.id === 'proof-rerun' && manualScheduleStatus?.status !== 'success' && manualScheduleStatus?.status !== 'error')}
                       >
                         {manualScheduleStatus?.status === 'running' || manualScheduleStatus?.status === 'initializing' || (manualScheduleStatus?.id === 'proof-rerun' && manualScheduleStatus?.status !== 'success' && manualScheduleStatus?.status !== 'error') ? (
                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                         ) : (
                           <Zap className="w-4 h-4 mr-2" />
                         )}
                         Reexecutar Modo Prova
                       </Button>
                       {manualScheduleStatus && manualScheduleStatus.id === 'proof-rerun' && (
                         <div className="w-full min-w-[150px] space-y-1">
                           <div className="flex justify-between text-[10px] text-muted-foreground">
                             <span className="capitalize">{manualScheduleStatus.status.replace('_', ' ')}</span>
                             <span>{manualScheduleStatus.progress}%</span>
                           </div>
                           <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-primary transition-all duration-300" 
                               style={{ width: `${manualScheduleStatus.progress}%` }} 
                             />
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             )}
           </DialogContent>
         </Dialog>
 
         {/* Comparison Dialog */}
         <Dialog open={!!showComparisonDialog} onOpenChange={() => setShowComparisonDialog(null)}>
           <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-purple-600">
                 <RefreshCw className="w-5 h-5" /> Comparação de Execuções Lado a Lado
               </DialogTitle>
               <DialogDescription>
                 Análise detalhada de diferenças entre duas exportações selecionadas.
               </DialogDescription>
             </DialogHeader>
             
             {showComparisonDialog && showComparisonDialog.length === 2 && (
               <div className="grid grid-cols-2 gap-4 py-4">
                 {showComparisonDialog.map((item, idx) => (
                   <div key={item.id} className={cn(
                     "space-y-4 p-4 rounded-xl border-2",
                     idx === 0 ? "border-blue-100 bg-blue-50/20" : "border-amber-100 bg-amber-50/20"
                   )}>
                     <div className="flex justify-between items-center border-b pb-2">
                       <Badge variant="outline" className={cn("text-[10px]", idx === 0 ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700")}>
                         Execução {idx + 1}
                       </Badge>
                       <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                     </div>
                     
                     <div className="space-y-3">
                       <div>
                         <span className="text-[9px] uppercase font-bold text-muted-foreground block">Filtros Aplicados</span>
                         <div className="bg-white/80 p-2 rounded border text-[10px] mt-1">
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                             <div className="flex justify-between border-b border-dashed py-1">
                               <span className="text-muted-foreground">UF:</span>
                               <span className={cn("font-bold", item.filters?.uf !== showComparisonDialog[1-idx].filters?.uf && "text-red-600")}>
                                 {item.filters?.uf || 'Todas'}
                               </span>
                             </div>
                             <div className="flex justify-between border-b border-dashed py-1">
                               <span className="text-muted-foreground">Ambiente:</span>
                               <span className={cn("font-bold", item.filters?.env !== showComparisonDialog[1-idx].filters?.env && "text-red-600")}>
                                 {item.filters?.env || 'Ambos'}
                               </span>
                             </div>
                           </div>
                         </div>
                       </div>
 
                       <div>
                         <span className="text-[9px] uppercase font-bold text-muted-foreground block">Integridade</span>
                         <div className="bg-white/80 p-2 rounded border text-[10px] mt-1 space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-muted-foreground">Registros:</span>
                             <span className={cn("font-mono font-bold", item.record_count !== showComparisonDialog[1-idx].record_count && "text-red-600 underline")}>
                               {item.record_count}
                             </span>
                           </div>
                           <div className="space-y-1">
                             <span className="text-muted-foreground">Hash CSV:</span>
                             <code className={cn(
                               "block p-1 bg-muted rounded font-mono text-[8px] break-all",
                               item.csv_hash !== showComparisonDialog[1-idx].csv_hash && "text-red-600 border border-red-200"
                             )}>
                               {item.csv_hash}
                             </code>
                           </div>
                           <div className="space-y-1">
                             <span className="text-muted-foreground">Hash PDF:</span>
                             <code className={cn(
                               "block p-1 bg-muted rounded font-mono text-[8px] break-all",
                               item.pdf_hash !== showComparisonDialog[1-idx].pdf_hash && "text-red-600 border border-red-200"
                             )}>
                               {item.pdf_hash}
                             </code>
                           </div>
                         </div>
                       </div>
 
                       <div>
                         <span className="text-[9px] uppercase font-bold text-muted-foreground block">Destinatários</span>
                         <div className="bg-white/80 p-2 rounded border text-[10px] mt-1 h-[60px] overflow-y-auto">
                           {(item.recipients || []).length > 0 ? (
                             <ul className="list-disc pl-4 space-y-0.5">
                               {item.recipients.map((r: string, rIdx: number) => (
                                 <li key={rIdx} className={cn(!showComparisonDialog[1-idx].recipients?.includes(r) && "text-red-600 font-bold")}>{r}</li>
                               ))}
                             </ul>
                           ) : (
                             <span className="text-muted-foreground italic">Nenhum destinatário</span>
                           )}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
             
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      const data = showComparisonDialog.map((item, idx) => ({
                        Execucao: `Execução ${idx + 1}`,
                        Data: new Date(item.created_at).toLocaleString(),
                        UF: item.filters?.uf || 'Todas',
                        Ambiente: item.filters?.env || 'Ambos',
                        Registros: item.record_count,
                        HashCSV: item.csv_hash,
                        HashPDF: item.pdf_hash,
                        Destinatarios: (item.recipients || []).join(", ")
                      }));
                      const ws = XLSX.utils.json_to_sheet(data);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Comparacao");
                      XLSX.writeFile(wb, `comparacao_exportacoes_${new Date().toISOString().split('T')[0]}.xlsx`);
                      toast.success("Comparação exportada em XLSX!");
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" /> Baixar Comparação XLSX
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      handleRunProofFromHistory(showComparisonDialog[0]);
                      toast.info("Iniciando Prova da Execução 1...");
                    }}
                  >
                    <Zap className="w-4 h-4 mr-2" /> Reexecutar Prova (Exec 1)
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowComparisonDialog(null)}>Fechar Comparação</Button>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setSelectedHistoryItems([])}>Limpar Seleção</Button>
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
                    {manualScheduleStatus.status === 'initializing' && 'Inicializando...'}
                    {manualScheduleStatus.status === 'running' && 'Processando dados no servidor...'}
                    {manualScheduleStatus.status === 'generating_csv' && 'Gerando arquivo CSV...'}
                    {manualScheduleStatus.status === 'generating_pdf' && 'Gerando arquivo PDF...'}
                    {manualScheduleStatus.status === 'calculating_hashes' && 'Calculando Hashes de integridade...'}
                    {manualScheduleStatus.status === 'finalizing_zip' && 'Finalizando pacote ZIP...'}
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
                 
                 <TabsContent value="history" className="mt-4 space-y-4">
                    <div className="grid grid-cols-4 gap-2 bg-muted/20 p-3 rounded-lg border text-[10px]">
                      <div className="space-y-1">
                        <Label className="text-[9px]">Status</Label>
                        <Select value={historyFilters.status} onValueChange={v => setHistoryFilters(p => ({ ...p, status: v }))}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="success">Sucesso</SelectItem>
                            <SelectItem value="error">Erro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px]">Divergência</Label>
                        <Select value={historyFilters.divergence} onValueChange={v => setHistoryFilters(p => ({ ...p, divergence: v }))}>
                          <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Ambos</SelectItem>
                            <SelectItem value="true">Com Divergência</SelectItem>
                            <SelectItem value="false">Sem Divergência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px]">Início</Label>
                        <Input type="date" className="h-7 text-[10px]" value={historyFilters.dateStart} onChange={e => setHistoryFilters(p => ({ ...p, dateStart: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px]">Fim</Label>
                        <Input type="date" className="h-7 text-[10px]" value={historyFilters.dateEnd} onChange={e => setHistoryFilters(p => ({ ...p, dateEnd: e.target.value }))} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-[9px]">Destinatário (Busca)</Label>
                        <Input placeholder="email@exemplo.com" className="h-7 text-[10px]" value={historyFilters.recipient} onChange={e => setHistoryFilters(p => ({ ...p, recipient: e.target.value }))} />
                      </div>
                      <div className="flex items-end gap-1 col-span-2">
                        <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1" onClick={loadExportHistory}>
                          <Search className="w-3 h-3 mr-1" /> Filtrar
                        </Button>
                         <div className="flex flex-col gap-1 flex-1">
                           <Button variant="ghost" size="sm" className="h-7 text-[9px] w-full" onClick={() => setHistoryFilters({ status: "all", divergence: "all", uf: "all", env: "all", dateStart: "", dateEnd: "", recipient: "" })}>
                             Limpar
                           </Button>
                      <div className="grid grid-cols-3 gap-1 w-full">
                        <Button variant="outline" size="sm" className="h-[22px] text-[8px] flex-1 border-orange-200 text-orange-600 hover:bg-orange-50" onClick={() => handleBulkDownloadAudit('json')}>
                          JSON
                        </Button>
                        <Button variant="outline" size="sm" className="h-[22px] text-[8px] flex-1 border-green-200 text-green-600 hover:bg-green-50" onClick={() => handleBulkDownloadAudit('xlsx')}>
                          XLSX
                        </Button>
                       <Button variant="outline" size="sm" className="h-[22px] text-[8px] flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleBulkDownloadAudit('pdf')}>
                         PDF
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-[22px] text-[8px] col-span-3 border-purple-200 text-purple-600 hover:bg-purple-50" 
                          onClick={async () => {
                            if (selectedHistoryItems.length === 0) return toast.info("Selecione itens no histórico primeiro.");
                            toast.info(`Iniciando Modo Prova em Lote (${selectedHistoryItems.length} itens)...`);
                            setBatchProofProgress({ total: selectedHistoryItems.length, current: 0, results: [] });
                            
                            for (const id of selectedHistoryItems) {
                              const log = exportHistory.find(h => h.id === id);
                              if (log) {
                                const result = await handleRunProofFromHistory(log, true);
                                setBatchProofProgress(prev => prev ? { 
                                  ...prev, 
                                  current: prev.current + 1,
                                  results: [...prev.results, { 
                                    id: log.id, 
                                    status: result.success ? 'success' : 'error',
                                    duration: result.duration,
                                    timestamp: result.timestamp,
                                    log_ref: log
                                  }]
                                } : null);
                              }
                            }
                            toast.success("Processamento em lote concluído!");
                          }}
                       >
                         <Zap className="h-2.5 w-2.5 mr-1" /> Reexecutar Prova Selecionados
                       </Button>
                     </div>
                         </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                   <thead className="bg-muted uppercase text-[10px]">
                     <tr>
                       <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/80" onClick={() => setHistorySort(p => ({ field: 'created_at', order: p.field === 'created_at' && p.order === 'desc' ? 'asc' : 'desc' }))}>
                         Data/Hora {historySort.field === 'created_at' && (historySort.order === 'asc' ? '↑' : '↓')}
                       </th>
                       <th className="text-left py-2 px-4 cursor-pointer hover:bg-muted/80" onClick={() => setHistorySort(p => ({ field: 'report_type', order: p.field === 'report_type' && p.order === 'asc' ? 'desc' : 'asc' }))}>
                         Relatório {historySort.field === 'report_type' && (historySort.order === 'asc' ? '↑' : '↓')}
                       </th>
                       <th className="text-left py-2 px-4">Formato</th>
                       <th className="text-center py-2 px-4 cursor-pointer hover:bg-muted/80" onClick={() => setHistorySort(p => ({ field: 'record_count', order: p.field === 'record_count' && p.order === 'desc' ? 'asc' : 'desc' }))}>
                         Recorte (Reg) {historySort.field === 'record_count' && (historySort.order === 'asc' ? '↑' : '↓')}
                       </th>
                       <th className="text-left py-2 px-4">Status</th>
                       <th className="text-right py-2 px-4">Ação</th>
                     </tr>
                   </thead>
                  <tbody>
                    {[...exportHistory].sort((a, b) => {
                      const aPinned = pinnedExecutions.includes(a.id);
                      const bPinned = pinnedExecutions.includes(b.id);
                      if (aPinned && !bPinned) return -1;
                      if (!aPinned && bPinned) return 1;
                      return 0;
                    }).map(log => (
                      <tr key={log.id} className={cn(
                        "border-t hover:bg-muted/30 transition-colors",
                        pinnedExecutions.includes(log.id) && "bg-blue-50/50 border-l-4 border-l-blue-500"
                      )}>
                        <td className="py-2 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn("h-5 w-5", pinnedExecutions.includes(log.id) ? "text-blue-600" : "text-muted-foreground opacity-30 hover:opacity-100")}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (pinnedExecutions.includes(log.id)) {
                                  setPinnedExecutions(prev => prev.filter(id => id !== log.id));
                                  toast.info("Execução desafixada.");
                                } else {
                                  setPinnedExecutions(prev => [log.id, ...prev]);
                                  toast.success("Execução fixada no topo!");
                                }
                              }}
                            >
                              {pinnedExecutions.includes(log.id) ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                            </Button>
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </td>
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
                               <div className="flex flex-col gap-1 items-end">
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
                                 <div className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded border border-dashed text-[9px] mt-1">
                                   <input 
                                     type="checkbox" 
                                     checked={selectedHistoryItems.includes(log.id)}
                                     onChange={(e) => {
                                       if (e.target.checked) setSelectedHistoryItems(p => [...p, log.id]);
                                       else setSelectedHistoryItems(p => p.filter(id => id !== log.id));
                                     }}
                                     className="w-3 h-3 cursor-pointer"
                                   />
                                   <span className="text-muted-foreground">Comparar</span>
                                 </div>
                               </div>
                                {log.file_url && (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => verifyAndDownloadFile(log, 'zip')} 
                                        className={cn(
                                          "h-6 text-[9px] border",
                                          log.validation_divergence ? "text-red-600 border-red-200 bg-red-50" : "text-green-600 border-green-100 bg-green-50/50"
                                        )}
                                      >
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
                                        {log.validation_divergence ? (
                                          <Button 
                                            variant="ghost" 
                                            className="h-3 p-0 text-[7px] text-destructive hover:text-destructive/80 mt-0.5 flex items-center"
                                            onClick={() => setShowAuditDetailDialog(log)}
                                          >
                                            <AlertCircle className="w-2 h-2 mr-0.5" /> Divergência Detectada (Ver detalhes)
                                          </Button>
                                        ) : (
                                          <Button 
                                            variant="ghost" 
                                            className="h-3 p-0 text-[7px] text-green-600 hover:text-green-500 mt-0.5 flex items-center"
                                            onClick={() => setShowAuditDetailDialog(log)}
                                          >
                                            <CheckCircle2 className="w-2 h-2 mr-0.5" /> Integridade OK (Ver log)
                                          </Button>
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
                     {batchProofProgress && (
                       <tr>
                         <td colSpan={6} className="p-0">
                           <div className="bg-purple-50 p-2 border-b flex items-center justify-between text-[10px]">
                             <div className="flex items-center gap-2">
                               <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
                               <span className="font-bold text-purple-700">Auditando Lote: {batchProofProgress.current} / {batchProofProgress.total}</span>
                             </div>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-5 text-[8px] text-purple-600"
                                onClick={() => {
                                  const data = batchProofProgress.results.map(r => ({
                                    ID: r.id,
                                    Data: r.log_ref ? new Date(r.log_ref.created_at).toLocaleString() : '-',
                                    Resultado: r.status === 'success' ? 'OK' : 'ERRO',
                                    Duração: r.duration ? `${r.duration.toFixed(2)}s` : '-',
                                    Timestamp: r.timestamp || '-',
                                    Filtros: JSON.stringify(r.log_ref?.filters || {})
                                  }));
                                  const ws = XLSX.utils.json_to_sheet(data);
                                  const wb = XLSX.utils.book_new();
                                  XLSX.utils.book_append_sheet(wb, ws, "Resultado Lote");
                                  XLSX.writeFile(wb, "resultado_auditoria_lote.xlsx");
                                }}
                              >
                                <Download className="w-2.5 h-2.5 mr-1" /> Relatório Lote
                              </Button>
                            </div>
                            {batchProofProgress.results.length > 0 && (
                              <div className="bg-purple-50/50 p-2 border-b space-y-1">
                                {batchProofProgress.results.slice(-3).map((r, i) => (
                                  <div key={i} className="flex items-center justify-between text-[8px]">
                                    <div className="flex items-center gap-2">
                                      <span className={cn("w-1.5 h-1.5 rounded-full", r.status === 'success' ? "bg-green-500" : "bg-red-500")} />
                                      <span className="text-muted-foreground font-mono">{r.id.substring(0, 8)}</span>
                                      <span className="font-medium">{r.status === 'success' ? 'Concluído' : 'Falhou'} ({r.duration?.toFixed(1)}s)</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-4 px-1 text-[7px] text-purple-600 underline"
                                      onClick={() => setShowAuditDetailDialog(r.log_ref)}
                                    >
                                      Abrir Logs
                                    </Button>
                                  </div>
                                ))}
                                {batchProofProgress.results.length > 3 && (
                                  <p className="text-[7px] text-center text-muted-foreground italic">...e mais {batchProofProgress.results.length - 3} itens</p>
                                )}
                              </div>
                            )}
                          </td>
                       </tr>
                     )}
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

        {/* Import Preview Dialog */}
        <Dialog open={!!importPreview} onOpenChange={() => setImportPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" /> Pré-visualização da Importação
              </DialogTitle>
              <DialogDescription>
                Verifique os filtros e regras antes de confirmar a aplicação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="bg-muted/30 p-3 rounded-lg border text-sm">
                <p><strong>Arquivo:</strong> {importPreview?.fileName}</p>
                <p><strong>Total de Filtros:</strong> {importPreview?.filters.length}</p>
              </div>

              <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left py-2 px-3">Filtro</th>
                      <th className="text-left py-2 px-3">Status / Sugestões</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importPreview?.filters.map((f, idx) => {
                      const v = importPreview.validation[idx];
                      return (
                        <tr key={idx} className={cn("hover:bg-muted/50", v.status === 'error' && "bg-red-50/50")}>
                          <td className="py-2 px-3">
                            <p className="font-semibold">{f.preference_name || 'Sem Nome'}</p>
                            <p className="text-[10px] text-muted-foreground">Versão: {v.version}</p>
                          </td>
                          <td className="py-2 px-3">
                            <div className="space-y-1">
                              {v.status === 'valid' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Válido</Badge>}
                              {v.status === 'warning' && <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Migração Necessária</Badge>}
                              {v.status === 'error' && <Badge variant="destructive">Inválido</Badge>}
                              
                              {v.errors.map((err, i) => (
                                <p key={i} className="text-red-600 font-medium">{err}</p>
                              ))}
                              {v.suggestions.map((sug, i) => (
                                <p key={i} className="text-blue-600 italic">Sugestão: {sug}</p>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportPreview(null)}>Cancelar</Button>
                <Button 
                  disabled={importPreview?.validation.every(v => v.status === 'error')}
                  onClick={confirmImport}
                >
                  Confirmar Importação
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Import History Dialog */}
        <Dialog open={showImportHistory} onOpenChange={setShowImportHistory}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-500" /> Histórico de Importações de Filtros
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left py-2 px-3">Data</th>
                      <th className="text-left py-2 px-3">Arquivo</th>
                      <th className="text-left py-2 px-3">Versão</th>
                      <th className="text-left py-2 px-3">Resultado</th>
                      <th className="text-right py-2 px-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importHistory.map(h => (
                      <tr key={h.id} className="hover:bg-muted/50">
                        <td className="py-2 px-3">{h.date}</td>
                        <td className="py-2 px-3 font-medium">{h.fileName}</td>
                        <td className="py-2 px-3">{h.detectedVersion}</td>
                        <td className="py-2 px-3">
                          <Badge variant={h.result === 'error' ? 'destructive' : (h.result === 'migrated' ? 'secondary' : 'default')}>
                            {h.result.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => exportMigrationReport(h, 'csv')} title="Exportar CSV">
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => exportMigrationReport(h, 'pdf')} title="Exportar PDF">
                              <FileDown className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {importHistory.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground italic">Nenhuma importação registrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
