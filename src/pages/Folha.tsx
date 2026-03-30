import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, DollarSign, Calendar, CheckCircle2, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const funcionarios = [
  { nome: "Ana Silva", cargo: "Contadora", salario: 8500, inss: 1120.49, irrf: 680, fgts: 680, liquido: 6019.51 },
  { nome: "Carlos Santos", cargo: "Aux. Contábil", salario: 3800, inss: 418, irrf: 0, fgts: 304, liquido: 3382 },
  { nome: "Maria Oliveira", cargo: "Fiscal", salario: 6200, inss: 744, irrf: 310, fgts: 496, liquido: 5146 },
  { nome: "João Pereira", cargo: "DP", salario: 4500, inss: 495, irrf: 45, fgts: 360, liquido: 3960 },
  { nome: "Fernanda Costa", cargo: "Estagiária", salario: 1800, inss: 135, irrf: 0, fgts: 144, liquido: 1665 },
];

const encargosData = [
  { nome: "INSS Patronal", valor: 5167.49 },
  { nome: "FGTS", valor: 1984 },
  { nome: "IRRF", valor: 1035 },
  { nome: "RAT/SAT", valor: 496 },
  { nome: "Terceiros (Sistema S)", valor: 1240 },
];

const eventosEsocial = [
  { evento: "S-1200 — Remuneração", status: "enviado", data: "15/03/2026" },
  { evento: "S-1210 — Pagamentos", status: "enviado", data: "15/03/2026" },
  { evento: "S-1299 — Fechamento", status: "enviado", data: "15/03/2026" },
  { evento: "S-2200 — Admissão", status: "pendente", data: "—" },
  { evento: "S-2299 — Desligamento", status: "pendente", data: "—" },
  { evento: "S-2230 — Afastamento", status: "pendente", data: "—" },
];

export default function Folha() {
  const { user } = useAuth();

  const totalBruto = funcionarios.reduce((s, f) => s + f.salario, 0);
  const totalLiquido = funcionarios.reduce((s, f) => s + f.liquido, 0);
  const totalEncargos = encargosData.reduce((s, e) => s + e.valor, 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Folha de Pagamento
        </h1>
        <p className="text-muted-foreground text-sm mt-1">{funcionarios.length} funcionários • Competência: Março/2026</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Folha Bruta</p>
          <p className="text-2xl font-bold font-display text-primary">R$ {totalBruto.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Folha Líquida</p>
          <p className="text-2xl font-bold font-display text-primary">R$ {totalLiquido.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Encargos</p>
          <p className="text-2xl font-bold font-display text-destructive">R$ {totalEncargos.toLocaleString("pt-BR")}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs text-muted-foreground mb-1">Custo Total</p>
          <p className="text-2xl font-bold font-display text-primary">R$ {(totalBruto + totalEncargos).toLocaleString("pt-BR")}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="folha" className="space-y-4">
        <TabsList>
          <TabsTrigger value="folha">Folha</TabsTrigger>
          <TabsTrigger value="encargos">Encargos</TabsTrigger>
          <TabsTrigger value="esocial">eSocial</TabsTrigger>
        </TabsList>

        <TabsContent value="folha">
          <Card>
            <CardHeader><CardTitle className="font-display">Resumo da Folha — Março 2026</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                    <th className="text-left py-3 px-4">Funcionário</th>
                    <th className="text-left py-3 px-4">Cargo</th>
                    <th className="text-right py-3 px-4">Salário</th>
                    <th className="text-right py-3 px-4">INSS</th>
                    <th className="text-right py-3 px-4">IRRF</th>
                    <th className="text-right py-3 px-4">FGTS</th>
                    <th className="text-right py-3 px-4">Líquido</th>
                  </tr></thead>
                  <tbody>
                    {funcionarios.map(f => (
                      <tr key={f.nome} className="border-t hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium text-sm">{f.nome}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{f.cargo}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono">R$ {f.salario.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono text-destructive">R$ {f.inss.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono text-destructive">R$ {f.irrf.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono">R$ {f.fgts.toLocaleString("pt-BR")}</td>
                        <td className="py-3 px-4 text-sm text-right font-mono font-bold text-primary">R$ {f.liquido.toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encargos">
          <Card>
            <CardHeader><CardTitle className="font-display">Encargos Trabalhistas</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={encargosData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,90%)" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(1)}k`} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="valor" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="esocial">
          <Card>
            <CardHeader><CardTitle className="font-display">eSocial — Eventos</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {eventosEsocial.map(e => (
                <div key={e.evento} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    {e.status === "enviado" ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    <div>
                      <p className="text-sm font-medium">{e.evento}</p>
                      <p className="text-xs text-muted-foreground">Data: {e.data}</p>
                    </div>
                  </div>
                  <Badge variant={e.status === "enviado" ? "default" : "outline"}>{e.status === "enviado" ? "Enviado" : "Pendente"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
