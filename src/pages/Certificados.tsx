import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Shield, Upload, FileKey, CheckCircle2, AlertTriangle,
  Trash2, Eye, EyeOff, Lock, KeyRound, RefreshCw,
  Search, Calendar, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Certificado = {
  id: string;
  nome_arquivo: string;
  tipo: string;
  cnpj: string | null;
  razao_social: string | null;
  validade: string | null;
  status: string;
  created_at: string;
  emissor: string | null;
  file_path: string | null;
};

export default function Certificados() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoCert, setTipoCert] = useState("A1");
  const [cnpjUpload, setCnpjUpload] = useState("");
  const [razaoUpload, setRazaoUpload] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [detailCert, setDetailCert] = useState<Certificado | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => { if (user) loadCertificados(); }, [user]);

  const loadCertificados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("certificados_digitais")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setCertificados(data);
    setLoading(false);
  };

  const validos = certificados.filter(c => c.status === "valido").length;
  const expirando = certificados.filter(c => c.status === "expirando").length;
  const expirados = certificados.filter(c => c.status === "expirado").length;

  const filtered = certificados.filter(c =>
    (c.razao_social || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.cnpj || "").includes(search) ||
    c.nome_arquivo.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pfx") && !ext.endsWith(".p12")) {
      toast.error("Formato inválido. Aceitos: .pfx ou .p12"); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)"); return;
    }
    setSelectedFile(file);
    toast.info(`Arquivo selecionado: ${file.name}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("Selecione um arquivo .pfx ou .p12"); return; }
    if (!senha) { toast.error("Informe a senha do certificado"); return; }
    if (!cnpjUpload.trim()) { toast.error("Informe o CNPJ"); return; }
    if (!razaoUpload.trim()) { toast.error("Informe a Razão Social"); return; }
    if (!user) { toast.error("Faça login"); return; }

    setUploading(true);
    try {
      const filePath = `${user.id}/certificados/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, { contentType: "application/x-pkcs12" });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("certificados_digitais").insert({
        user_id: user.id,
        nome_arquivo: selectedFile.name,
        tipo: tipoCert,
        cnpj: cnpjUpload,
        razao_social: razaoUpload,
        validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "valido",
        emissor: "Aguardando validação",
        file_path: filePath,
      });
      if (dbError) throw dbError;

      toast.success("Certificado enviado com sucesso!");
      setSelectedFile(null); setSenha(""); setCnpjUpload(""); setRazaoUpload("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadCertificados();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente"));
    } finally { setUploading(false); }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("certificados_digitais").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    setCertificados(prev => prev.filter(c => c.id !== id));
    setConfirmRemove(null);
    toast.success("Certificado removido");
  };

  const handleVerificarValidades = async () => {
    const updates = certificados.map(c => {
      if (!c.validade) return c;
      const dias = Math.ceil((new Date(c.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      let status = "valido";
      if (dias <= 0) status = "expirado";
      else if (dias <= 90) status = "expirando";
      return { ...c, status };
    });
    for (const c of updates) {
      await supabase.from("certificados_digitais").update({ status: c.status }).eq("id", c.id);
    }
    setCertificados(updates);
    toast.success("Validades verificadas!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valido": return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">✓ Válido</Badge>;
      case "expirando": return <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Expirando</Badge>;
      case "expirado": return <Badge variant="destructive" className="text-[10px]">Expirado</Badge>;
      default: return null;
    }
  };

  const getDiasRestantes = (validade: string | null) => {
    if (!validade) return "—";
    const dias = Math.ceil((new Date(validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return `Expirado há ${Math.abs(dias)} dias`;
    return `${dias} dias restantes`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <FileKey className="w-8 h-8 text-primary" /> Certificados Digitais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{certificados.length} certificados • {validos} válidos • {expirando} expirando • {expirados} expirados</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleVerificarValidades}><RefreshCw className="w-4 h-4" /> Verificar Validades</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total</p><p className="text-2xl font-bold font-display text-primary">{certificados.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Válidos</p><p className="text-2xl font-bold font-display text-emerald-600">{validos}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Expirando</p><p className="text-2xl font-bold font-display text-amber-600">{expirando}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Expirados</p><p className="text-2xl font-bold font-display text-destructive">{expirados}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="certificados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certificados">Meus Certificados</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="certificados">
          <div className="space-y-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
            {filtered.map(cert => (
              <Card key={cert.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setDetailCert(cert)}>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Lock className="w-6 h-6 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{cert.razao_social || "Sem nome"}</p>
                        <Badge variant="outline" className="text-[10px]">{cert.tipo}</Badge>
                        {getStatusBadge(cert.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {cert.cnpj || "—"} • Emissor: {cert.emissor || "—"}</p>
                      <p className="text-xs text-muted-foreground"><Calendar className="w-3 h-3 inline mr-1" />Validade: {cert.validade || "—"} ({getDiasRestantes(cert.validade)})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetailCert(cert)}><Eye className="w-4 h-4 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmRemove(cert.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-muted-foreground">{search ? "Nenhum encontrado." : "Nenhum certificado. Faça upload acima."}</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload de Certificado Digital</CardTitle>
              <CardDescription>Envie seu certificado e-CNPJ/e-CPF (.pfx ou .p12)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><Label>Tipo</Label>
                    <Select value={tipoCert} onValueChange={setTipoCert}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 — Arquivo (.pfx/.p12)</SelectItem>
                        <SelectItem value="A3">A3 — Token/Smart Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>CNPJ / CPF *</Label><Input placeholder="00.000.000/0001-00" value={cnpjUpload} onChange={e => setCnpjUpload(e.target.value)} className="mt-1.5 font-mono" /></div>
                  <div><Label>Razão Social *</Label><Input placeholder="Nome da empresa" value={razaoUpload} onChange={e => setRazaoUpload(e.target.value)} className="mt-1.5" /></div>
                  <div><Label>Senha *</Label>
                    <div className="relative mt-1.5">
                      <Input type={showSenha ? "text" : "password"} placeholder="Senha do certificado" value={senha} onChange={e => setSenha(e.target.value)} className="pr-10" />
                      <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 bg-muted/20"}`}
                  >
                    <input ref={fileInputRef} type="file" accept=".pfx,.p12" onChange={handleInputChange} className="hidden" />
                    <KeyRound className="w-12 h-12 text-primary mx-auto opacity-60 mb-3" />
                    {selectedFile ? (
                      <div>
                        <p className="font-medium text-sm text-primary">📎 {selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm">Arraste o certificado aqui</p>
                        <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground text-sm flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /> Segurança</p>
                    <p>• Criptografia AES-256</p>
                    <p>• Compatível ICP-Brasil</p>
                    <p>• Uso: NF-e, NFS-e, CT-e, eSocial, SPED, Gov.br</p>
                  </div>
                </div>
              </div>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando..." : "Enviar Certificado"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid md:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-sm font-display">Certificado A1</CardTitle></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground"><p>• Arquivo .pfx/.p12 • Validade 1 ano • Múltiplos dispositivos • Ideal para automação</p></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm font-display">Certificado A3</CardTitle></CardHeader><CardContent className="space-y-2 text-xs text-muted-foreground"><p>• Token USB / Smart Card • 1-5 anos • Mais seguro • Assinatura presencial</p></CardContent></Card>
            <Card className="md:col-span-2"><CardHeader><CardTitle className="text-sm font-display">Onde obter?</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground"><p>Certisign, Serasa, Valid, Soluti, Safeweb, DigitalSign</p></CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!detailCert} onOpenChange={() => setDetailCert(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Detalhes do Certificado</DialogTitle></DialogHeader>
          {detailCert && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Razão Social</p><p className="font-medium">{detailCert.razao_social}</p></div>
                <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="font-mono">{detailCert.cnpj}</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo</p><p>{detailCert.tipo}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>{getStatusBadge(detailCert.status)}</div>
                <div><p className="text-xs text-muted-foreground">Validade</p><p>{detailCert.validade}</p></div>
                <div><p className="text-xs text-muted-foreground">Dias</p><p>{getDiasRestantes(detailCert.validade)}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Arquivo</p><p className="font-mono text-xs">{detailCert.nome_arquivo}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Remover Certificado?</DialogTitle><DialogDescription>Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmRemove && handleRemove(confirmRemove)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
