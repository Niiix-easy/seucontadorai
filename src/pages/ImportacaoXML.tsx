import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, Search, Download, CheckCircle2, Clock, AlertTriangle, FileCode } from "lucide-react";
import { toast } from "sonner";

const notasRecentes = [
  { chave: "3526...0001", emitente: "Tech Solutions LTDA", cnpj: "12.345.678/0001-90", tipo: "NF-e", valor: 15800, data: "28/03/2026", status: "autorizada" },
  { chave: "3526...0002", emitente: "Comércio ABC ME", cnpj: "98.765.432/0001-10", tipo: "NF-e", valor: 4320, data: "27/03/2026", status: "autorizada" },
  { chave: "3526...0003", emitente: "Transportes XYZ", cnpj: "11.222.333/0001-44", tipo: "CT-e", valor: 2100, data: "26/03/2026", status: "autorizada" },
  { chave: "3526...0004", emitente: "Serviços Pro LTDA", cnpj: "55.666.777/0001-88", tipo: "NFS-e", valor: 8900, data: "25/03/2026", status: "cancelada" },
  { chave: "3526...0005", emitente: "Indústria Metal SA", cnpj: "99.888.777/0001-11", tipo: "NF-e", valor: 45600, data: "24/03/2026", status: "autorizada" },
  { chave: "3526...0006", emitente: "Consultoria Beta", cnpj: "22.333.444/0001-55", tipo: "NFS-e", valor: 12500, data: "23/03/2026", status: "autorizada" },
];

const apisIntegradas = [
  { nome: "SEFAZ NF-e (Produção)", url: "https://nfe.fazenda.gov.br", status: "ativo", desc: "Download automático de NF-e" },
  { nome: "SEFAZ NFS-e", url: "https://nfse.gov.br", status: "ativo", desc: "Download de NFS-e municipal" },
  { nome: "CT-e WebService", url: "https://cte.fazenda.gov.br", status: "ativo", desc: "Conhecimento de Transporte" },
  { nome: "Manifestação Destinatário", url: "https://mdfe.fazenda.gov.br", status: "ativo", desc: "Confirmação e ciência de NF-e" },
];

export default function ImportacaoXML() {
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("all");

  const filtered = notasRecentes.filter(n => {
    const matchSearch = n.emitente.toLowerCase().includes(search.toLowerCase()) || n.cnpj.includes(search);
    const matchTipo = filterTipo === "all" || n.tipo === filterTipo;
    return matchSearch && matchTipo;
  });

  const totalNotas = notasRecentes.length;
  const totalValor = notasRecentes.filter(n => n.status === "autorizada").reduce((s, n) => s + n.valor, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> Importação de XML / Notas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{totalNotas} notas • R$ {totalValor.toLocaleString("pt-BR")} em notas autorizadas</p>
        </div>
        <Button className="gap-2" onClick={() => toast.success("Sincronização iniciada com SEFAZ!")}>
          <Download className="w-4 h-4" /> Sincronizar SEFAZ
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NF-e</p><p className="text-2xl font-bold font-display text-primary">{notasRecentes.filter(n => n.tipo === "NF-e").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">NFS-e</p><p className="text-2xl font-bold font-display text-primary">{notasRecentes.filter(n => n.tipo === "NFS-e").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">CT-e</p><p className="text-2xl font-bold font-display text-primary">{notasRecentes.filter(n => n.tipo === "CT-e").length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Valor Total</p><p className="text-2xl font-bold font-display text-primary">R$ {(totalValor / 1000).toFixed(0)}k</p></CardContent></Card>
      </div>

      <Tabs defaultValue="notas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notas">Notas Fiscais</TabsTrigger>
          <TabsTrigger value="apis">APIs Integradas</TabsTrigger>
        </TabsList>

        <TabsContent value="notas">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar por emitente ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <th className="text-left py-3 px-4">Emitente</th><th className="text-left py-3 px-4">CNPJ</th><th className="text-center py-3 px-4">Tipo</th>
                  <th className="text-right py-3 px-4">Valor</th><th className="text-left py-3 px-4">Data</th><th className="text-center py-3 px-4">Status</th>
                </tr></thead>
                <tbody>{filtered.map(n => (
                  <tr key={n.chave} className="border-t hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-medium">{n.emitente}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{n.cnpj}</td>
                    <td className="py-3 px-4 text-center"><Badge variant="outline" className="text-[10px]">{n.tipo}</Badge></td>
                    <td className="py-3 px-4 text-sm text-right font-mono">R$ {n.valor.toLocaleString("pt-BR")}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{n.data}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={n.status === "autorizada" ? "default" : "destructive"} className="text-[10px]">{n.status === "autorizada" ? "Autorizada" : "Cancelada"}</Badge>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis">
          <div className="grid gap-3">
            {apisIntegradas.map(api => (
              <Card key={api.nome}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><FileCode className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-medium text-sm">{api.nome}</p>
                      <p className="text-xs text-muted-foreground">{api.desc}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{api.url}</p>
                    </div>
                  </div>
                  <Badge className="text-[10px]">Conectado</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
