import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PenTool, FileText, Shield, Users, CheckCircle2, Clock, Upload, 
  ExternalLink, Loader2, Globe, KeyRound, Building2
} from "lucide-react";
import { toast } from "sonner";

const contratos = [
  { id: 1, titulo: "Contrato de Prestação de Serviços", cliente: "Tech Solutions LTDA", status: "assinado", data: "28/03/2026", signatarios: 2 },
  { id: 2, titulo: "Aditivo Contratual", cliente: "Comércio ABC ME", status: "aguardando", data: "27/03/2026", signatarios: 1 },
  { id: 3, titulo: "Procuração Eletrônica", cliente: "Indústria Metal SA", status: "assinado", data: "25/03/2026", signatarios: 3 },
  { id: 4, titulo: "Termo de Responsabilidade", cliente: "Serviços Pro LTDA", status: "aguardando", data: "24/03/2026", signatarios: 1 },
  { id: 5, titulo: "Distrato Social", cliente: "Consultoria Beta", status: "expirado", data: "15/03/2026", signatarios: 4 },
];

const recursos = [
  { icon: Shield, title: "Certificado Digital A1/A3", desc: "Integração com certificados ICP-Brasil para assinatura qualificada", status: "Configurado" },
  { icon: FileText, title: "Assinatura em Lote", desc: "Assine múltiplos documentos de uma vez com certificado digital", status: "Disponível" },
  { icon: CheckCircle2, title: "Validade Jurídica", desc: "Documentos assinados com validade legal conforme MP 2.200-2", status: "Ativo" },
  { icon: Users, title: "Múltiplos Signatários", desc: "Fluxo de assinatura com vários participantes e ordem definida", status: "Ativo" },
];

const govBrSteps = [
  { step: 1, titulo: "Autenticação Gov.br", desc: "Login via portal Gov.br com nível Ouro/Prata para assinatura avançada", status: "configurado" },
  { step: 2, titulo: "Validação de Identidade", desc: "Conferência biométrica e documental via Gov.br", status: "configurado" },
  { step: 3, titulo: "Assinatura GOV.BR", desc: "Assinatura digital avançada com validade jurídica (Lei 14.063/2020)", status: "ativo" },
  { step: 4, titulo: "Carimbo de Tempo", desc: "ICP-Brasil timestamp para integridade temporal do documento", status: "ativo" },
];

export default function Assinatura() {
  const [assinando, setAssinando] = useState(false);
  const assinados = contratos.filter(c => c.status === "assinado").length;
  const aguardando = contratos.filter(c => c.status === "aguardando").length;

  const handleAssinarGovBr = () => {
    setAssinando(true);
    setTimeout(() => {
      setAssinando(false);
      toast.success("Documento assinado via Gov.br com sucesso!");
    }, 2500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <PenTool className="w-8 h-8 text-primary" /> Assinatura Digital
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{contratos.length} documentos • {assinados} assinados • {aguardando} aguardando</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Total Documentos</p><p className="text-2xl font-bold font-display text-primary">{contratos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Assinados</p><p className="text-2xl font-bold font-display text-primary">{assinados}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Aguardando</p><p className="text-2xl font-bold font-display text-primary">{aguardando}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Taxa Conclusão</p><p className="text-2xl font-bold font-display text-primary">{Math.round((assinados / contratos.length) * 100)}%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="documentos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="govbr">Assinatura Gov.br</TabsTrigger>
          <TabsTrigger value="certificado">Certificado Digital</TabsTrigger>
          <TabsTrigger value="recursos">Recursos</TabsTrigger>
        </TabsList>

        <TabsContent value="documentos">
          <Card>
            <CardHeader><CardTitle className="font-display">Documentos Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {contratos.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {c.status === "assinado" ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Clock className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{c.titulo}</p>
                        <p className="text-xs text-muted-foreground">{c.cliente} • {c.signatarios} signatários • {c.data}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "assinado" ? "default" : c.status === "aguardando" ? "outline" : "destructive"} className="text-[10px]">
                        {c.status === "assinado" ? "Assinado" : c.status === "aguardando" ? "Aguardando" : "Expirado"}
                      </Badge>
                      {c.status === "aguardando" && (
                        <Button size="sm" variant="outline" className="text-xs gap-1" onClick={handleAssinarGovBr} disabled={assinando}>
                          {assinando ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenTool className="w-3 h-3" />} Assinar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="govbr">
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> Integração Gov.br
                </CardTitle>
                <CardDescription>
                  Assinatura digital avançada via portal Gov.br (Lei 14.063/2020). 
                  Válida para documentos fiscais, contratos e procurações eletrônicas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {govBrSteps.map(step => (
                    <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg border bg-background">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {step.step}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                        <Badge variant="outline" className="text-[10px] mt-1">{step.status === "configurado" ? "Configurado" : "Ativo"}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t space-y-3">
                  <p className="text-sm font-medium">Assinar documento via Gov.br</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Documento para assinar</Label>
                      <Input type="file" accept=".pdf,.xml,.doc,.docx" className="mt-1.5 cursor-pointer" />
                    </div>
                    <div>
                      <Label>Nível de assinatura</Label>
                      <div className="flex gap-2 mt-1.5">
                        <Badge className="text-[10px]">Avançada (Gov.br Ouro)</Badge>
                        <Badge variant="outline" className="text-[10px]">Qualificada (ICP-Brasil)</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleAssinarGovBr} disabled={assinando} className="gap-2">
                      {assinando ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                      {assinando ? "Assinando..." : "Assinar com Gov.br"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => window.open("https://assinatura.iti.gov.br", "_blank")}>
                      <ExternalLink className="w-4 h-4" /> Portal Assinatura Gov.br
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-display">Sobre a Assinatura Gov.br</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• <strong>Lei 14.063/2020</strong> — Estabelece 3 níveis de assinatura eletrônica: simples, avançada e qualificada</p>
                <p>• <strong>Assinatura Avançada (Gov.br)</strong> — Conta Gov.br nível Ouro ou Prata, validação biométrica</p>
                <p>• <strong>Assinatura Qualificada (ICP-Brasil)</strong> — Certificado digital A1/A3, máximo nível jurídico</p>
                <p>• <strong>Validade</strong> — Aceita em todos os órgãos da administração pública federal</p>
                <p>• <strong>Gratuita</strong> — O serviço do Gov.br é gratuito para cidadãos e empresas</p>
                <p>• <strong>API</strong> — Integração via API REST do Gov.br (requer credenciamento junto ao ITI)</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certificado">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> Assinatura com Certificado Digital</CardTitle>
              <CardDescription>Utilize certificado A1/A3 ICP-Brasil para assinatura qualificada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label>Documento para assinar (PDF)</Label>
                    <Input type="file" accept=".pdf" className="mt-1.5 cursor-pointer" />
                  </div>
                  <div>
                    <Label>Certificado Digital</Label>
                    <Input type="file" accept=".pfx,.p12" className="mt-1.5 cursor-pointer" />
                  </div>
                  <div>
                    <Label>Senha do certificado</Label>
                    <Input type="password" placeholder="Senha do certificado" className="mt-1.5" />
                  </div>
                </div>
                <Card className="border-dashed border-2 bg-muted/20">
                  <CardContent className="py-8 text-center space-y-3">
                    <Shield className="w-12 h-12 text-primary mx-auto opacity-60" />
                    <p className="font-medium text-sm">Assinatura Qualificada</p>
                    <p className="text-xs text-muted-foreground">
                      Nível máximo de validade jurídica conforme ICP-Brasil. 
                      Aceita em tribunais, cartórios e órgãos públicos.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <Button className="gap-2" onClick={() => toast.success("Documento assinado com certificado digital!")}>
                <PenTool className="w-4 h-4" /> Assinar com Certificado
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recursos">
          <div className="grid md:grid-cols-2 gap-4">
            {recursos.map(r => (
              <Card key={r.title}>
                <CardContent className="p-5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><r.icon className="w-5 h-5 text-primary" /></div>
                  <div>
                    <div className="flex items-center gap-2"><p className="font-medium text-sm">{r.title}</p><Badge className="text-[10px]">{r.status}</Badge></div>
                    <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
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
