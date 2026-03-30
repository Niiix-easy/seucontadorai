import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, Search, CheckCircle2, AlertTriangle, Globe, FileCode, RefreshCw,
  FileText, Send, Plus, Eye, Loader2, Receipt
} from "lucide-react";
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

const nfesDemo = [
  { numero: "000.123.456", serie: "1", chave: "35260312345678000190550010001234561234567890", destinatario: "Tech Solutions LTDA", valor: 15800, status: "autorizada", data: "30/03/2026" },
  { numero: "000.123.455", serie: "1", chave: "35260312345678000190550010001234551234567889", destinatario: "Comércio ABC ME", valor: 8500, status: "autorizada", data: "29/03/2026" },
  { numero: "000.123.454", serie: "1", chave: "35260312345678000190550010001234541234567888", destinatario: "Indústria Metal SA", valor: 32000, status: "cancelada", data: "28/03/2026" },
  { numero: "000.123.453", serie: "1", chave: "35260312345678000190550010001234531234567887", destinatario: "Serviços Pro LTDA", valor: 4200, status: "autorizada", data: "27/03/2026" },
];

const integradores = [
  { nome: "Oobj / Avalara Brasil", desc: "Líder em mensageria fiscal, +36M DFe processados. SaaS e In House.", url: "oobj.com.br", features: ["NF-e", "NFS-e", "CT-e", "MDF-e", "Contingência automática", "Cálculo tributário"] },
  { nome: "Focus NFe", desc: "API REST simples para emissão de documentos fiscais.", url: "focusnfe.com.br", features: ["NF-e", "NFS-e", "NFC-e", "CT-e", "API REST"] },
  { nome: "Tecnospeed", desc: "Plataforma completa de automação fiscal.", url: "tecnospeed.com.br", features: ["NF-e", "NFS-e", "Boletos", "SPED", "eSocial"] },
  { nome: "Webmania", desc: "API de emissão de notas fiscais com integração fácil.", url: "webmaniabr.com", features: ["NF-e", "NFC-e", "NFS-e", "API simples"] },
];

export default function Sefaz() {
  const [search, setSearch] = useState("");
  const [emitindo, setEmitindo] = useState(false);

  const filteredServicos = servicos.filter(s => s.nome.toLowerCase().includes(search.toLowerCase()));

  const handleEmitirNFe = () => {
    setEmitindo(true);
    setTimeout(() => {
      setEmitindo(false);
      toast.success("NF-e emitida com sucesso! Número: 000.123.457");
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> Integração SEFAZ & NF-e
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{servicos.filter(s => s.status === "online").length}/{servicos.length} serviços online • {nfesDemo.filter(n => n.status === "autorizada").length} NF-e autorizadas</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => toast.success("Status atualizado!")}>
          <RefreshCw className="w-4 h-4" /> Verificar Status
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">WebServices</p><p className="text-2xl font-bold font-display text-primary">{servicos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NF-e Emitidas (mês)</p><p className="text-2xl font-bold font-display text-primary">{nfesDemo.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Consultas Ativas</p><p className="text-2xl font-bold font-display text-primary">{consultas.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Uptime</p><p className="text-2xl font-bold font-display text-primary">99.9%</p></CardContent></Card>
      </div>

      <Tabs defaultValue="nfe" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nfe">Emissão NF-e</TabsTrigger>
          <TabsTrigger value="notas">Notas Emitidas</TabsTrigger>
          <TabsTrigger value="webservices">WebServices</TabsTrigger>
          <TabsTrigger value="consultas">Consultas Fiscais</TabsTrigger>
          <TabsTrigger value="integradores">Integradores</TabsTrigger>
        </TabsList>

        <TabsContent value="nfe">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2"><Receipt className="w-5 h-5 text-primary" /> Emissão de NF-e</CardTitle>
              <CardDescription>Preencha os dados para emissão via WebService SEFAZ ou integrador fiscal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div><Label>Integrador Fiscal</Label>
                    <Select defaultValue="oobj">
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oobj">Oobj / Avalara Brasil</SelectItem>
                        <SelectItem value="focus">Focus NFe</SelectItem>
                        <SelectItem value="tecnospeed">Tecnospeed</SelectItem>
                        <SelectItem value="direto">WebService Direto (SEFAZ)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>CNPJ Emitente</Label><Input placeholder="00.000.000/0001-00" className="mt-1.5 font-mono" /></div>
                  <div><Label>Natureza da Operação</Label><Input placeholder="Venda de mercadoria" className="mt-1.5" /></div>
                  <div><Label>Série</Label><Input placeholder="1" defaultValue="1" className="mt-1.5" /></div>
                </div>
                <div className="space-y-3">
                  <div><Label>CNPJ/CPF Destinatário</Label><Input placeholder="00.000.000/0001-00" className="mt-1.5 font-mono" /></div>
                  <div><Label>Razão Social Destinatário</Label><Input placeholder="Nome do destinatário" className="mt-1.5" /></div>
                  <div><Label>Valor Total</Label><Input placeholder="0,00" className="mt-1.5 font-mono" type="text" /></div>
                  <div><Label>UF Destino</Label>
                    <Select defaultValue="SP">
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleEmitirNFe} disabled={emitindo} className="gap-2">
                  {emitindo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {emitindo ? "Emitindo..." : "Emitir NF-e"}
                </Button>
                <Button variant="outline" className="gap-2"><Eye className="w-4 h-4" /> Pré-visualizar XML</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="text-left py-3 px-4">Número</th>
                  <th className="text-left py-3 px-4">Destinatário</th>
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-right py-3 px-4">Valor</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr></thead>
                <tbody>{nfesDemo.map((nfe, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-mono">{nfe.numero}</td>
                    <td className="py-3 px-4 text-sm font-medium">{nfe.destinatario}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{nfe.data}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono font-medium text-primary">R$ {nfe.valor.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={nfe.status === "autorizada" ? "default" : "destructive"} className="text-[10px]">
                        {nfe.status === "autorizada" ? "Autorizada" : "Cancelada"}
                      </Badge>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

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
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/50 text-primary flex items-center gap-1">
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

        <TabsContent value="integradores">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Integradores fiscais abstraem a complexidade dos WebServices da SEFAZ. 
              Recomendamos usar um integrador para emissão em produção.
            </p>
            {integradores.map(int => (
              <Card key={int.nome}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm font-display">{int.nome}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{int.desc}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">{int.url}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {int.features.map(f => (
                          <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast.info(`Configure a chave API da ${int.nome} no painel Admin > APIs`)}>
                      Configurar
                    </Button>
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
