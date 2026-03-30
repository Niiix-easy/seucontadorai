import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Calculator, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const impostos = [
  { nome: "ICMS", base: 850000, aliquota: 18, valor: 153000, status: "calculado" },
  { nome: "IPI", base: 320000, aliquota: 10, valor: 32000, status: "calculado" },
  { nome: "PIS", base: 1245000, aliquota: 1.65, valor: 20542.5, status: "calculado" },
  { nome: "COFINS", base: 1245000, aliquota: 7.6, valor: 94620, status: "calculado" },
  { nome: "ISS", base: 395000, aliquota: 5, valor: 19750, status: "calculado" },
  { nome: "IRPJ", base: 519000, aliquota: 15, valor: 77850, status: "pendente" },
  { nome: "CSLL", base: 519000, aliquota: 9, valor: 46710, status: "pendente" },
];

const obrigacoes = [
  { nome: "SPED Fiscal (EFD-ICMS/IPI)", prazo: "25/04/2026", status: "pendente" },
  { nome: "EFD-Contribuições (PIS/COFINS)", prazo: "15/04/2026", status: "entregue" },
  { nome: "DCTF Web", prazo: "15/04/2026", status: "entregue" },
  { nome: "SPED Contábil (ECD)", prazo: "31/05/2026", status: "pendente" },
  { nome: "ECF", prazo: "31/07/2026", status: "pendente" },
  { nome: "DIRF", prazo: "28/02/2026", status: "entregue" },
  { nome: "PGDAS-D (Simples Nacional)", prazo: "20/04/2026", status: "pendente" },
  { nome: "eSocial - Eventos Periódicos", prazo: "15/04/2026", status: "entregue" },
  { nome: "DCTFWeb 13º Salário", prazo: "20/12/2026", status: "pendente" },
];

const pieColors = ["hsl(217,91%,50%)", "hsl(168,72%,40%)", "hsl(38,92%,50%)", "hsl(280,60%,50%)", "hsl(350,72%,50%)", "hsl(200,70%,50%)", "hsl(120,50%,45%)"];

export default function Fiscal() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("2026-03");

  const { data: clients = [] } = useQuery({
    queryKey: ["fiscal-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, company_name, tax_regime").eq("status", "active");
      return data || [];
    },
    enabled: !!user,
  });

  const totalImpostos = impostos.reduce((s, i) => s + i.valor, 0);
  const pieData = impostos.map((i, idx) => ({ name: i.nome, value: i.valor, color: pieColors[idx % pieColors.length] }));
  const entregues = obrigacoes.filter(o => o.status === "entregue").length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" /> Módulo Fiscal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes • {entregues}/{obrigacoes.length} obrigações entregues</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-03">Março 2026</SelectItem>
            <SelectItem value="2026-02">Fevereiro 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Total Impostos</p>
          <p className="text-2xl font-bold font-display text-destructive">R$ {(totalImpostos / 1000).toFixed(0)}k</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Obrigações Pendentes</p>
          <p className="text-2xl font-bold font-display text-primary">{obrigacoes.length - entregues}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Obrigações Entregues</p>
          <p className="text-2xl font-bold font-display text-primary">{entregues}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Clientes Ativos</p>
          <p className="text-2xl font-bold font-display text-primary">{clients.length}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="impostos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="impostos">Apuração de Impostos</TabsTrigger>
          <TabsTrigger value="obrigacoes">Obrigações Acessórias</TabsTrigger>
          <TabsTrigger value="grafico">Visão Gráfica</TabsTrigger>
        </TabsList>

        <TabsContent value="impostos">
          <Card>
            <CardHeader><CardTitle className="font-display">Apuração de Impostos — {periodo}</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                    <th className="text-left py-3 px-4">Imposto</th>
                    <th className="text-right py-3 px-4">Base de Cálculo</th>
                    <th className="text-right py-3 px-4">Alíquota</th>
                    <th className="text-right py-3 px-4">Valor</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr></thead>
                  <tbody>
                    {impostos.map(i => (
                      <tr key={i.nome} className="border-t hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium text-sm">{i.nome}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono">R$ {i.base.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-sm text-right">{i.aliquota}%</td>
                        <td className="py-3 px-4 text-sm text-right font-mono font-medium">R$ {i.valor.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={i.status === "calculado" ? "default" : "outline"} className="text-[10px]">
                            {i.status === "calculado" ? "Calculado" : "Pendente"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/50 font-semibold">
                      <td className="py-3 px-4" colSpan={3}>TOTAL</td>
                      <td className="py-3 px-4 text-right font-mono">R$ {totalImpostos.toLocaleString("pt-BR")}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obrigacoes">
          <Card>
            <CardHeader><CardTitle className="font-display">Obrigações Acessórias</CardTitle><CardDescription>Calendário fiscal e status de entregas</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {obrigacoes.map(o => (
                <div key={o.nome} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    {o.status === "entregue" ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium">{o.nome}</p>
                      <p className="text-xs text-muted-foreground">Prazo: {o.prazo}</p>
                    </div>
                  </div>
                  <Badge variant={o.status === "entregue" ? "default" : "outline"}>{o.status === "entregue" ? "Entregue" : "Pendente"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grafico">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Distribuição de Impostos</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie><Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} /></PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {pieData.map(p => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-muted-foreground">{p.name}</span></div>
                      <span className="font-medium">R$ {p.value.toLocaleString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Impostos por Valor</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={impostos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,90%)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                    <Bar dataKey="valor" fill="hsl(217,91%,50%)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
