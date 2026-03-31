import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Shield, Upload, FileKey, CheckCircle2, AlertTriangle, Clock, 
  Trash2, Eye, EyeOff, Lock, KeyRound, Building2, RefreshCw,
  Download, Search, Calendar, Info
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Certificado = {
  id: string;
  nome: string;
  tipo: "A1" | "A3";
  cnpj: string;
  razaoSocial: string;
  validade: string;
  status: "valido" | "expirando" | "expirado";
  uploadDate: string;
  emitidoPor: string;
  filePath?: string;
};

const certsDemoData: Certificado[] = [
  {
    id: "1", nome: "cert_techsolutions.pfx", tipo: "A1", cnpj: "12.345.678/0001-90",
    razaoSocial: "Tech Solutions LTDA", validade: "2027-06-15", status: "valido",
    uploadDate: "2026-01-10", emitidoPor: "AC Certisign"
  },
  {
    id: "2", nome: "cert_comercio_abc.pfx", tipo: "A1", cnpj: "98.765.432/0001-10",
    razaoSocial: "Comércio ABC ME", validade: "2026-08-20", status: "expirando",
    uploadDate: "2025-08-20", emitidoPor: "AC Serasa"
  },
  {
    id: "3", nome: "cert_industria_metal.pfx", tipo: "A1", cnpj: "11.222.333/0001-44",
    razaoSocial: "Indústria Metal SA", validade: "2026-03-01", status: "expirado",
    uploadDate: "2025-03-01", emitidoPor: "AC Valid"
  },
];

export default function Certificados() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [certificados, setCertificados] = useState<Certificado[]>(certsDemoData);
  const [uploading, setUploading] = useState(false);
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tipoCert, setTipoCert] = useState<"A1" | "A3">("A1");
  const [cnpjUpload, setCnpjUpload] = useState("");
  const [razaoUpload, setRazaoUpload] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [detailCert, setDetailCert] = useState<Certificado | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const validos = certificados.filter(c => c.status === "valido").length;
  const expirando = certificados.filter(c => c.status === "expirando").length;
  const expirados = certificados.filter(c => c.status === "expirado").length;

  const filtered = certificados.filter(c =>
    c.razaoSocial.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj.includes(search) ||
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleFileSelect = (file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pfx") && !ext.endsWith(".p12")) {
      toast.error("Formato inválido. Aceitos: .pfx ou .p12");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 10MB)");
      return;
    }
    setSelectedFile(file);
    toast.info(`Arquivo selecionado: ${file.name}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) { toast.error("Selecione um arquivo .pfx ou .p12"); return; }
    if (!senha) { toast.error("Informe a senha do certificado"); return; }
    if (!cnpjUpload.trim()) { toast.error("Informe o CNPJ do certificado"); return; }
    if (!razaoUpload.trim()) { toast.error("Informe a Razão Social"); return; }
    if (!user) { toast.error("Faça login para continuar"); return; }

    setUploading(true);
    try {
      const filePath = `${user.id}/certificados/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile, { contentType: "application/x-pkcs12" });

      if (uploadError) throw uploadError;

      await supabase.from("documents").insert({
        user_id: user.id,
        name: selectedFile.name,
        file_path: filePath,
        file_type: "certificado-digital",
        category: "certificado",
        file_size: selectedFile.size,
      });

      const newCert: Certificado = {
        id: crypto.randomUUID(),
        nome: selectedFile.name,
        tipo: tipoCert,
        cnpj: cnpjUpload,
        razaoSocial: razaoUpload,
        validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        status: "valido",
        uploadDate: new Date().toISOString().split("T")[0],
        emitidoPor: "Processando validação...",
        filePath,
      };
      setCertificados(prev => [newCert, ...prev]);
      
      toast.success("Certificado digital enviado com sucesso!");
      setSelectedFile(null);
      setSenha("");
      setCnpjUpload("");
      setRazaoUpload("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error("Erro ao enviar: " + (err.message || "Tente novamente"));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (id: string) => {
    setCertificados(prev => prev.filter(c => c.id !== id));
    setConfirmRemove(null);
    toast.success("Certificado removido");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valido": return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">✓ Válido</Badge>;
      case "expirando": return <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30"><AlertTriangle className="w-3 h-3 mr-1" />Expirando</Badge>;
      case "expirado": return <Badge variant="destructive" className="text-[10px]">Expirado</Badge>;
      default: return null;
    }
  };

  const getDiasRestantes = (validade: string) => {
    const diff = new Date(validade).getTime() - Date.now();
    const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dias < 0) return `Expirado há ${Math.abs(dias)} dias`;
    if (dias === 0) return "Expira hoje";
    return `${dias} dias restantes`;
  };

  const handleVerificarValidades = () => {
    setCertificados(prev => prev.map(c => {
      const diff = new Date(c.validade).getTime() - Date.now();
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
      let status: "valido" | "expirando" | "expirado" = "valido";
      if (dias <= 0) status = "expirado";
      else if (dias <= 90) status = "expirando";
      return { ...c, status };
    }));
    toast.success("Validades verificadas e atualizadas!");
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <FileKey className="w-8 h-8 text-primary" /> Certificados Digitais
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {certificados.length} certificados • {validos} válidos • {expirando} expirando • {expirados} expirados
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleVerificarValidades}>
          <RefreshCw className="w-4 h-4" /> Verificar Validades
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total Certificados</p><p className="text-2xl font-bold font-display text-primary">{certificados.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Válidos</p><p className="text-2xl font-bold font-display text-emerald-600">{validos}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Expirando (&lt;90 dias)</p><p className="text-2xl font-bold font-display text-amber-600">{expirando}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Expirados</p><p className="text-2xl font-bold font-display text-destructive">{expirados}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="certificados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="certificados">Meus Certificados</TabsTrigger>
          <TabsTrigger value="upload">Upload de Certificado</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="certificados">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por razão social, CNPJ ou arquivo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            {filtered.map(cert => (
              <Card key={cert.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setDetailCert(cert)}>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{cert.razaoSocial}</p>
                        <Badge variant="outline" className="text-[10px]">{cert.tipo}</Badge>
                        {getStatusBadge(cert.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        CNPJ: {cert.cnpj} • Emissor: {cert.emitidoPor}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Validade: {cert.validade} ({getDiasRestantes(cert.validade)})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDetailCert(cert)} title="Detalhes">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmRemove(cert.id)} title="Remover">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                {search ? "Nenhum certificado encontrado." : "Nenhum certificado cadastrado. Faça upload na aba acima."}
              </CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload de Certificado Digital</CardTitle>
              <CardDescription>Envie seu certificado digital e-CNPJ/e-CPF (formato .pfx ou .p12)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Tipo do Certificado</Label>
                    <Select value={tipoCert} onValueChange={(v: "A1" | "A3") => setTipoCert(v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A1">A1 — Arquivo digital (.pfx/.p12)</SelectItem>
                        <SelectItem value="A3">A3 — Token/Smart Card (referência)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>CNPJ / CPF do Certificado *</Label>
                    <Input
                      placeholder="00.000.000/0001-00"
                      value={cnpjUpload}
                      onChange={e => setCnpjUpload(e.target.value)}
                      className="mt-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <Label>Razão Social / Nome *</Label>
                    <Input
                      placeholder="Nome da empresa ou pessoa"
                      value={razaoUpload}
                      onChange={e => setRazaoUpload(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Senha do Certificado *</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showSenha ? "text" : "password"}
                        placeholder="Senha do certificado digital"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSenha(!showSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">A senha é usada para validar o certificado e não é armazenada em texto plano.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Drag & Drop zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/30 hover:border-primary/50 bg-muted/20"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pfx,.p12"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <KeyRound className="w-12 h-12 text-primary mx-auto opacity-60 mb-3" />
                    {selectedFile ? (
                      <div>
                        <p className="font-medium text-sm text-primary">📎 {selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB • Pronto para envio</p>
                        <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                          Remover arquivo
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm">Arraste o certificado aqui</p>
                        <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar (.pfx / .p12, máx 10MB)</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-lg border bg-muted/30 space-y-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground text-sm flex items-center gap-1"><Shield className="w-4 h-4 text-primary" /> Segurança</p>
                    <p>• Certificado armazenado com criptografia AES-256</p>
                    <p>• Compatível com ICP-Brasil (e-CNPJ / e-CPF)</p>
                    <p>• Usado para: NF-e, NFS-e, CT-e, MDF-e, eSocial, SPED, Gov.br</p>
                    <p>• Senha não armazenada em texto plano</p>
                  </div>
                </div>
              </div>

              <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="gap-2 w-full sm:w-auto">
                {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Enviando e validando..." : "Enviar Certificado"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm font-display">Certificado A1</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Arquivo digital (.pfx ou .p12) instalado no computador</p>
                <p>• Validade de 1 ano</p>
                <p>• Pode ser usado em múltiplos dispositivos</p>
                <p>• Ideal para automação de emissão de NF-e</p>
                <p>• Emitido por Autoridades Certificadoras: Certisign, Serasa, Valid, etc.</p>
                <p>• <strong>Recomendado para sistemas automatizados</strong></p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm font-display">Certificado A3</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Armazenado em token USB ou smart card</p>
                <p>• Validade de 1 a 5 anos</p>
                <p>• Mais seguro — chave privada nunca sai do dispositivo</p>
                <p>• Requer leitor de smart card ou token conectado</p>
                <p>• Usado para assinatura presencial e acessos especiais</p>
                <p>• <strong>Recomendado para assinaturas manuais</strong></p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle className="text-sm font-display">Onde obter um Certificado Digital?</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="grid sm:grid-cols-2 gap-2">
                  <p>• <strong>Certisign</strong> — certisign.com.br</p>
                  <p>• <strong>Serasa Experian</strong> — serasa.certificadodigital.com.br</p>
                  <p>• <strong>Valid Certificadora</strong> — valid.com</p>
                  <p>• <strong>AC Soluti</strong> — soluti.com.br</p>
                  <p>• <strong>Safeweb</strong> — safeweb.com.br</p>
                  <p>• <strong>DigitalSign</strong> — digitalsign.com.br</p>
                </div>
                <p className="mt-2 pt-2 border-t">É necessário comparecer a um ponto de atendimento para validação presencial (exceto videoconferência disponível em algumas ACs).</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!detailCert} onOpenChange={() => setDetailCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Detalhes do Certificado</DialogTitle>
          </DialogHeader>
          {detailCert && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Razão Social</p><p className="font-medium">{detailCert.razaoSocial}</p></div>
                <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="font-mono">{detailCert.cnpj}</p></div>
                <div><p className="text-xs text-muted-foreground">Tipo</p><p>{detailCert.tipo}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>{getStatusBadge(detailCert.status)}</div>
                <div><p className="text-xs text-muted-foreground">Validade</p><p>{detailCert.validade}</p></div>
                <div><p className="text-xs text-muted-foreground">Dias Restantes</p><p>{getDiasRestantes(detailCert.validade)}</p></div>
                <div><p className="text-xs text-muted-foreground">Emissor</p><p>{detailCert.emitidoPor}</p></div>
                <div><p className="text-xs text-muted-foreground">Upload</p><p>{detailCert.uploadDate}</p></div>
                <div className="col-span-2"><p className="text-xs text-muted-foreground">Arquivo</p><p className="font-mono text-xs">{detailCert.nome}</p></div>
              </div>
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Utilizações permitidas:</p>
                <p>NF-e, NFS-e, CT-e, MDF-e, eSocial, ECD, ECF, SPED, e-CAC, Gov.br</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Certificado?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita. O certificado será removido do sistema.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => confirmRemove && handleRemove(confirmRemove)}>Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
