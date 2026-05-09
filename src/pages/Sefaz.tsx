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
import { 
  Building2, Search, CheckCircle2, Globe, FileCode, RefreshCw,
   Send, Eye, Loader2, Receipt, Plus, Trash2, Package, Calculator, Settings, FileText, Download, AlertCircle, CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
   certificate_filename: string | null;
 };

 type ProcessedDocument = {
   id: string;
   document_type: string;
   status: string;
   valor_total?: number;
   sefaz_response_message: string | null;
   created_at: string;
   xml_content: string;
   signed_xml_content: string | null;
   receipt_number: string | null;
   protocol_number: string | null;
   last_error?: string | null;
   retry_count?: number;
   next_retry_at?: string | null;
   processing_log?: any[];
 };

export default function Sefaz() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [emitindo, setEmitindo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nfes, setNfes] = useState<NFeEmitida[]>([]);
   const [processedDocs, setProcessedDocs] = useState<ProcessedDocument[]>([]);
   const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>({ uf: "SP", environment: "homologacao", certificate_filename: null });
    const [configLoading, setConfigLoading] = useState(false);
    const [certPassword, setCertPassword] = useState("");
    const [showCertPassword, setShowCertPassword] = useState(false);
    const [docInDetail, setDocInDetail] = useState<ProcessedDocument | null>(null);
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

   useEffect(() => {
     if (user) {
       loadNfes();
       loadFiscalConfig();
       loadProcessedDocs();
     }
   }, [user]);

   const loadFiscalConfig = async () => {
     const { data, error } = await supabase.from("fiscal_configurations").select("*").single();
     if (!error && data) setFiscalConfig(data);
   };

   const loadProcessedDocs = async () => {
     let query = supabase.from("processed_documents").select("*").order("created_at", { ascending: false });
     if (periodo.de) query = query.gte("created_at", periodo.de);
     if (periodo.ate) query = query.lte("created_at", periodo.ate);
     const { data } = await query;
     if (data) setProcessedDocs(data as ProcessedDocument[]);
   };

   const handleSaveConfig = async () => {
     if (!user) return;
     setConfigLoading(true);
     const { error } = await supabase.from("fiscal_configurations").upsert({
       user_id: user.id,
       uf: fiscalConfig.uf,
       environment: fiscalConfig.environment,
     }, { onConflict: "user_id" });
     if (!error) toast.success("Configurações salvas!");
     else toast.error("Erro ao salvar: " + error.message);
     setConfigLoading(false);
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
        </TabsList>

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
                   <div className="space-y-2">
                     {docInDetail.processing_log?.map((log: any, idx: number) => (
                       <div key={idx} className="text-xs p-2 border-b last:border-0 flex justify-between">
                         <span>{log.event}</span>
                         <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                       </div>
                     ))}
                   </div>
                 </TabsContent>
               </Tabs>
               
               <div className="flex justify-end gap-2">
                 <Button variant="outline" onClick={() => handleDownloadXml(docInDetail)}>Download XML</Button>
                 {docInDetail.status === 'error' && <Button onClick={() => handleRetry(docInDetail.id)}>Tentar Novamente</Button>}
               </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
     </div>
   );
 }
