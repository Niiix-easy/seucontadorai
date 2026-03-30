import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, TrendingDown, DollarSign, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const planoContas = [
  { codigo: "1", nome: "ATIVO", tipo: "grupo" },
  { codigo: "1.1", nome: "Ativo Circulante", tipo: "grupo" },
  { codigo: "1.1.1", nome: "Caixa e Equivalentes", tipo: "analitica", saldo: 125400 },
  { codigo: "1.1.2", nome: "Bancos Conta Movimento", tipo: "analitica", saldo: 458320 },
  { codigo: "1.1.3", nome: "Aplicações Financeiras", tipo: "analitica", saldo: 230000 },
  { codigo: "1.1.4", nome: "Clientes a Receber", tipo: "analitica", saldo: 187650 },
  { codigo: "1.1.5", nome: "Impostos a Recuperar", tipo: "analitica", saldo: 34200 },
  { codigo: "1.2", nome: "Ativo Não Circulante", tipo: "grupo" },
  { codigo: "1.2.1", nome: "Imobilizado", tipo: "analitica", saldo: 890000 },
  { codigo: "1.2.2", nome: "Intangível", tipo: "analitica", saldo: 45000 },
  { codigo: "2", nome: "PASSIVO", tipo: "grupo" },
  { codigo: "2.1", nome: "Passivo Circulante", tipo: "grupo" },
  { codigo: "2.1.1", nome: "Fornecedores", tipo: "analitica", saldo: 98700 },
  { codigo: "2.1.2", nome: "Obrigações Trabalhistas", tipo: "analitica", saldo: 67300 },
  { codigo: "2.1.3", nome: "Impostos a Pagar", tipo: "analitica", saldo: 43500 },
  { codigo: "2.1.4", nome: "Empréstimos CP", tipo: "analitica", saldo: 120000 },
  { codigo: "3", nome: "RECEITAS", tipo: "grupo" },
  { codigo: "3.1", nome: "Receita de Serviços", tipo: "analitica", saldo: 1245000 },
  { codigo: "3.2", nome: "Outras Receitas", tipo: "analitica", saldo: 35000 },
  { codigo: "4", nome: "DESPESAS", tipo: "grupo" },
  { codigo: "4.1", nome: "Despesas com Pessoal", tipo: "analitica", saldo: 420000 },
  { codigo: "4.2", nome: "Despesas Administrativas", tipo: "analitica", saldo: 185000 },
  { codigo: "4.3", nome: "Despesas Tributárias", tipo: "analitica", saldo: 156000 },
];

const balanceteData = [
  { conta: "Caixa", debito: 125400, credito: 0 },
  { conta: "Bancos", debito: 458320, credito: 0 },
  { conta: "Clientes", debito: 187650, credito: 0 },
  { conta: "Fornecedores", debito: 0, credito: 98700 },
  { conta: "Obrig. Trab.", debito: 0, credito: 67300 },
  { conta: "Impostos", debito: 0, credito: 43500 },
  { conta: "Receitas", debito: 0, credito: 1245000 },
  { conta: "Despesas", debito: 761000, credito: 0 },
];

export default function Contabil() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("2026-03");

  const { data: clients = [] } = useQuery({
    queryKey: ["contabil-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, company_name, tax_regime").eq("status", "active");
      return data || [];
    },
    enabled: !!user,
  });

  const totalAtivo = planoContas.filter(c => c.codigo.startsWith("1") && c.saldo).reduce((s, c) => s + (c.saldo || 0), 0);
  const totalPassivo = planoContas.filter(c => c.codigo.startsWith("2") && c.saldo).reduce((s, c) => s + (c.saldo || 0), 0);
  const totalReceitas = planoContas.filter(c => c.codigo.startsWith("3") && c.saldo).reduce((s, c) => s + (c.saldo || 0), 0);
  const totalDespesas = planoContas.filter(c => c.codigo.startsWith("4") && c.saldo).reduce((s, c) => s + (c.saldo || 0), 0);
  const resultado = totalReceitas - totalDespesas;

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" /> Sistema Contábil
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clientes ativos • Período: {periodo}</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2026-03">Março 2026</SelectItem>
            <SelectItem value="2026-02">Fevereiro 2026</SelectItem>
            <SelectItem value="2026-01">Janeiro 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingUp className="w-3.5 h-3.5" /> Total Ativo</div>
          <p className="text-2xl font-bold font-display text-primary">R$ {(totalAtivo / 1000).toFixed(0)}k</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><TrendingDown className="w-3.5 h-3.5" /> Total Passivo</div>
          <p className="text-2xl font-bold font-display text-destructive">R$ {(totalPassivo / 1000).toFixed(0)}k</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><DollarSign className="w-3.5 h-3.5" /> Receitas</div>
          <p className="text-2xl font-bold font-display text-primary">R$ {(totalReceitas / 1000).toFixed(0)}k</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><FileText className="w-3.5 h-3.5" /> Resultado</div>
          <p className={`text-2xl font-bold font-display ${resultado >= 0 ? "text-primary" : "text-destructive"}`}>R$ {(resultado / 1000).toFixed(0)}k</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="plano" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plano">Plano de Contas</TabsTrigger>
          <TabsTrigger value="balancete">Balancete</TabsTrigger>
          <TabsTrigger value="dre">DRE</TabsTrigger>
        </TabsList>

        <TabsContent value="plano">
          <Card>
            <CardHeader><CardTitle className="font-display">Plano de Contas</CardTitle><CardDescription>Estrutura contábil do escritório</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {planoContas.map(c => (
                  <div key={c.codigo} className={`flex items-center justify-between py-2 px-3 rounded ${c.tipo === "grupo" ? "bg-muted/50 font-semibold" : "hover:bg-muted/30"}`}
                    style={{ paddingLeft: `${(c.codigo.split(".").length - 1) * 20 + 12}px` }}>
                    <div className="flex items-center gap-3">
                      <code className="text-xs text-muted-foreground w-12">{c.codigo}</code>
                      <span className="text-sm">{c.nome}</span>
                      {c.tipo === "grupo" && <Badge variant="outline" className="text-[10px]">Grupo</Badge>}
                    </div>
                    {c.saldo && <span className="text-sm font-mono font-medium">R$ {c.saldo.toLocaleString("pt-BR")}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balancete">
          <Card>
            <CardHeader><CardTitle className="font-display">Balancete de Verificação</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={balanceteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,90%)" />
                  <XAxis dataKey="conta" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="debito" name="Débito" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="credito" name="Crédito" fill="hsl(168,72%,40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dre">
          <Card>
            <CardHeader><CardTitle className="font-display">Demonstração do Resultado</CardTitle><CardDescription>Período: {periodo}</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "(+) Receita Bruta de Serviços", valor: 1245000, bold: true },
                { label: "(-) Deduções da Receita", valor: -156000 },
                { label: "(=) Receita Líquida", valor: 1089000, bold: true },
                { label: "(-) Despesas com Pessoal", valor: -420000 },
                { label: "(-) Despesas Administrativas", valor: -185000 },
                { label: "(=) Resultado Operacional", valor: 484000, bold: true },
                { label: "(+) Outras Receitas", valor: 35000 },
                { label: "(=) Resultado Antes IRPJ/CSLL", valor: 519000, bold: true },
                { label: "(-) IRPJ", valor: -77850 },
                { label: "(-) CSLL", valor: -46710 },
                { label: "(=) Resultado Líquido", valor: 394440, bold: true, highlight: true },
              ].map(item => (
                <div key={item.label} className={`flex items-center justify-between py-2 px-3 rounded text-sm ${item.highlight ? "bg-primary/10 border border-primary/20" : item.bold ? "bg-muted/50" : "hover:bg-muted/30"}`}>
                  <span className={item.bold ? "font-semibold" : "text-muted-foreground"}>{item.label}</span>
                  <span className={`font-mono ${item.bold ? "font-bold" : ""} ${item.valor >= 0 ? "text-primary" : "text-destructive"}`}>
                    R$ {Math.abs(item.valor).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
