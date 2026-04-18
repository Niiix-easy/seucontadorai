import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, DollarSign, TrendingUp, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

const regimeColors: Record<string, string> = {
  simples_nacional: "hsl(217,91%,50%)", lucro_presumido: "hsl(168,72%,40%)",
  lucro_real: "hsl(38,92%,50%)", mei: "hsl(280,60%,50%)",
};
const regimeNames: Record<string, string> = {
  simples_nacional: "Simples Nacional", lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real", mei: "MEI",
};

export default function BI() {
  const { user } = useAuth();

  const { data: clients = [] } = useQuery({
    queryKey: ["bi-clients"],
    queryFn: async () => { const { data } = await supabase.from("clients").select("*"); return data || []; },
    enabled: !!user,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["bi-tasks"],
    queryFn: async () => { const { data } = await supabase.from("tasks").select("*"); return data || []; },
    enabled: !!user,
  });
  const { data: financials = [] } = useQuery({
    queryKey: ["bi-financials"],
    queryFn: async () => { const { data } = await supabase.from("financial_records").select("*"); return data || []; },
    enabled: !!user,
  });

  const activeClients = clients.filter((c: any) => c.status === "active").length;
  const totalFee = clients.filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + (Number(c.monthly_fee) || 0), 0);
  const avgFee = activeClients > 0 ? totalFee / activeClients : 0;

  // Regime pie
  const regimeCounts: Record<string, number> = {};
  clients.forEach((c: any) => { const r = c.tax_regime || "outros"; regimeCounts[r] = (regimeCounts[r] || 0) + 1; });
  const pieData = Object.entries(regimeCounts).map(([k, v]) => ({ name: regimeNames[k] || k, value: v, color: regimeColors[k] || "hsl(200,20%,60%)" }));

  // State distribution
  const stateCounts: Record<string, number> = {};
  clients.forEach((c: any) => { const s = c.address_state || "N/D"; stateCounts[s] = (stateCounts[s] || 0) + 1; });
  const stateData = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([state, count]) => ({ state, count }));

  // Fee distribution
  const feeRanges = [
    { range: "Até R$500", min: 0, max: 500, count: 0 },
    { range: "R$500-1k", min: 500, max: 1000, count: 0 },
    { range: "R$1k-2k", min: 1000, max: 2000, count: 0 },
    { range: "R$2k-5k", min: 2000, max: 5000, count: 0 },
    { range: "R$5k+", min: 5000, max: Infinity, count: 0 },
  ];
  clients.forEach((c: any) => {
    const fee = Number(c.monthly_fee) || 0;
    const r = feeRanges.find(r => fee >= r.min && fee < r.max);
    if (r) r.count++;
  });

  // Task stats
  const tasksDone = tasks.filter((t: any) => t.status === "done").length;
  const tasksPending = tasks.filter((t: any) => t.status === "todo").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 text-primary" /> BI & Relatórios
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Análise de dados do escritório em tempo real</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Clientes</p><p className="text-2xl font-bold font-display text-primary">{clients.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Ativos</p><p className="text-2xl font-bold font-display text-primary">{activeClients}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Faturamento</p><p className="text-2xl font-bold font-display text-primary">R$ {(totalFee / 1000).toFixed(0)}k</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Ticket Médio</p><p className="text-2xl font-bold font-display text-primary">R$ {avgFee.toFixed(0)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Tarefas Feitas</p><p className="text-2xl font-bold font-display text-primary">{tasksDone}/{tasks.length}</p></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Clientes por Regime Tributário</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (<>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">{pieData.map(p => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} /><span className="text-muted-foreground">{p.name}</span></div>
                  <span className="font-medium">{p.value}</span>
                </div>
              ))}</div>
            </>) : <p className="text-muted-foreground text-sm text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Clientes por Estado</CardTitle></CardHeader>
          <CardContent>
            {stateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,90%)" />
                  <XAxis dataKey="state" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Clientes" fill="hsl(217,91%,50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center py-10">Sem dados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Distribuição de Honorários</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={feeRanges}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,90%)" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Clientes" fill="hsl(168,72%,40%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Top 10 Clientes (Honorário)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {clients.sort((a: any, b: any) => (Number(b.monthly_fee) || 0) - (Number(a.monthly_fee) || 0)).slice(0, 10).map((c: any, i: number) => (
              <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                  <span className="font-medium truncate max-w-[200px]">{c.company_name}</span>
                </div>
                <span className="font-mono text-primary font-medium">R$ {Number(c.monthly_fee || 0).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
