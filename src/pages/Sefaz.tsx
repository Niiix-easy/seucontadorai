import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Search, CheckCircle2, AlertTriangle, Globe, FileCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const servicos = [
  { nome: "NF-e — Emissão", url: "https://nfe.fazenda.gov.br/portal", webservice: "NfeAutorizacao4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Consulta", url: "https://nfe.fazenda.gov.br/portal", webservice: "NfeConsultaProtocolo4", status: "online", uf: "Nacional" },
  { nome: "NF-e — Cancelamento", url: "https://nfe.fazenda.gov.br/portal", webservice: "NfeCancelamento", status: "online", uf: "Nacional" },
  { nome: "CT-e — Emissão", url: "https://cte.fazenda.gov.br", webservice: "CteRecepcaoSinc", status: "online", uf: "Nacional" },
  { nome: "MDF-e — Manifesto", url: "https://mdfe.fazenda.gov.br", webservice: "MDFeRecepcaoSinc", status: "online", uf: "Nacional" },
  { nome: "NFS-e Nacional", url: "https://www.gov.br/nfse", webservice: "NfseRecepcionarRps", status: "online", uf: "Nacional" },
  { nome: "Manifestação Destinatário", url: "https://nfe.fazenda.gov.br/portal", webservice: "RecepcaoEvento", status: "online", uf: "Nacional" },
];

const consultas = [
  { tipo: "Consulta CNPJ", endpoint: "https://receitaws.com.br/v1/cnpj/{cnpj}", desc: "Receita Federal — dados cadastrais", status: "ativo" },
  { tipo: "Consulta CPF", endpoint: "https://api.cpf.gov.br/v1/{cpf}", desc: "Receita Federal — situação cadastral", status: "ativo" },
  { tipo: "Consulta Simples Nacional", endpoint: "https://api.portaldatransparencia.gov.br/simples", desc: "PGDAS-D e DAS", status: "ativo" },
  { tipo: "Situação Fiscal", endpoint: "https://cav.receita.fazenda.gov.br", desc: "e-CAC — pendências fiscais", status: "ativo" },
  { tipo: "Certidão Negativa", endpoint: "https://servicos.receita.fazenda.gov.br/Servicos/certidao", desc: "CND Federal e FGTS", status: "ativo" },
];

export default function Sefaz() {
  const [search, setSearch] = useState("");

  const filteredServicos = servicos.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> Integração SEFAZ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{servicos.filter(s => s.status === "online").length}/{servicos.length} serviços online</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.success("Status atualizado!")}>
          <RefreshCw className="w-4 h-4" /> Verificar Status
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">WebServices</p><p className="text-2xl font-bold font-display text-primary">{servicos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Online</p><p className="text-2xl font-bold font-display text-primary">{servicos.filter(s => s.status === "online").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Consultas</p><p className="text-2xl font-bold font-display text-primary">{consultas.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Uptime</p><p className="text-2xl font-bold font-display text-primary">99.9%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="webservices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webservices">WebServices SEFAZ</TabsTrigger>
          <TabsTrigger value="consultas">Consultas Fiscais</TabsTrigger>
        </TabsList>

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
                      <p className="text-[10px] text-muted-foreground">{s.url}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-green-500 text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

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
      </Tabs>
    </div>
  );
}
