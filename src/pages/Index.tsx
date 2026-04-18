import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, FileText, DollarSign, AlertTriangle,
  BookOpen, Receipt, Users, ClipboardList, FolderOpen,
  BarChart3, Bot, Globe, PenTool, Landmark, Zap,
  MessageSquare, FileKey, Calculator, ChevronRight, TrendingUp
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const regimeColors: Record<string, string> = {
  simples_nacional: "hsl(217, 91%, 50%)",
  lucro_presumido: "hsl(168, 72%, 40%)",
  lucro_real: "hsl(38, 92%, 50%)",
  mei: "hsl(280, 60%, 50%)",
};
const regimeNames: Record<string, string> = {
  simples_nacional: "Simples Nacional",
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "Pendente", color: "bg-warning text-warning-foreground" },
  pending: { label: "Pendente", color: "bg-warning text-warning-foreground" },
  in_progress: { label: "Em andamento", color: "bg-info text-info-foreground" },
  done: { label: "Concluído", color: "bg-success text-success-foreground" },
  completed: { label: "Concluído", color: "bg-success text-success-foreground" },
};

const quickLinks = [
  { path: "/contabil", icon: BookOpen, label: "Contábil", desc: "Plano de contas e balancete" },
  { path: "/fiscal", icon: Receipt, label: "Fiscal", desc: "Impostos e obrigações" },
  { path: "/folha", icon: Users, label: "Folha", desc: "Funcionários e encargos" },
  { path: "/financeiro", icon: DollarSign, label: "Financeiro", desc: "Receitas e despesas" },
  { path: "/crm", icon: Building2, label: "CRM", desc: "Gestão de clientes" },
  { path: "/tarefas", icon: ClipboardList, label: "Tarefas", desc: "Gerenciar tarefas" },
  { path: "/documentos", icon: FolderOpen, label: "Documentos", desc: "Arquivos e anexos" },
  { path: "/bi", icon: BarChart3, label: "BI", desc: "Análise de dados" },
  { path: "/ia-chat", icon: MessageSquare, label: "Chat IA", desc: "Assistente inteligente" },
  { path: "/sefaz", icon: Receipt, label: "SEFAZ", desc: "Emissão de NF-e" },
  { path: "/bancos", icon: Landmark, label: "Bancos", desc: "Conciliação bancária" },
  { path: "/certificados", icon: FileKey, label: "Certificados", desc: "Certificados digitais" },
];

export default function Dashboard() {
  const { user } = useAuth();

  const { data: clients = [] } = useQuery({
    queryKey: ["dashboard-clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*, clients(company_name)").order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: obligations = [] } = useQuery({
    queryKey: ["dashboard-obligations"],
    queryFn: async () => {
      const { data } = await supabase.from("obligations").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const { data: financials = [] } = useQuery({
    queryKey: ["dashboard-financials"],
    queryFn: async () => {
      const { data } = await supabase.from("financial_records").select("*");
      return data || [];
    },
    enabled: !!user,
  });

  const activeClients = clients.filter((c: any) => c.status === "active").length;
  const totalFee = clients.filter((c: any) => c.status === "active").reduce((s: number, c: any) => s + (Number(c.monthly_fee) || 0), 0);
  const pendingObligations = obligations.filter((o: any) => o.status === "pending").length;
  const totalObligations = obligations.length;
  const deliveredPct = totalObligations > 0 ? Math.round(((totalObligations - pendingObligations) / totalObligations) * 100) : 0;

  const regimeCounts: Record<string, number> = {};
  clients.forEach((c: any) => {
    const r = c.tax_regime || "outros";
    regimeCounts[r] = (regimeCounts[r] || 0) + 1;
  });
  const pieData = Object.entries(regimeCounts).map(([name, value]) => ({
    name: regimeNames[name] || name,
    value,
    color: regimeColors[name] || "hsl(200, 20%, 60%)",
  }));

  const monthlyRevenue: Record<string, number> = {};
  financials.forEach((f: any) => {
    if (f.type === "receita") {
      const month = new Date(f.date).toLocaleString("pt-BR", { month: "short" });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(f.amount);
    }
  });
  const barData = Object.entries(monthlyRevenue).slice(-6).map(([month, valor]) => ({ month, valor }));
  const displayBarData = barData.length > 0 ? barData : [{ month: "Atual", valor: totalFee }];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl">
      {/* Header */}
      <div className="opacity-0 animate-fade-in-down" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display tracking-tight">Painel de Controle</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Visão geral do escritório — dados em tempo real</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/crm"><StatCard icon={Building2} title="Clientes Ativos" value={String(activeClients)} change={`${clients.length} total`} changeType="up" delay={0.1} /></Link>
        <Link to="/fiscal"><StatCard icon={FileText} title="Obrigações" value={String(totalObligations)} change={`${deliveredPct}% entregues`} changeType="up" delay={0.15} /></Link>
        <Link to="/financeiro"><StatCard icon={DollarSign} title="Faturamento Mensal" value={`R$ ${totalFee.toLocaleString("pt-BR")}`} change="Honorários ativos" changeType="up" delay={0.2} /></Link>
        <Link to="/tarefas"><StatCard icon={AlertTriangle} title="Pendentes" value={String(pendingObligations)} change={`${tasks.filter((t: any) => t.status === "todo").length} tarefas`} changeType={pendingObligations > 5 ? "down" : "up"} delay={0.25} /></Link>
      </div>

      {/* Quick access modules */}
      <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <h2 className="text-lg font-semibold font-display mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {quickLinks.map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              className="group bg-card border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:scale-[1.03] transition-all duration-300 opacity-0 animate-fade-in-scale"
              style={{ animationDelay: `${0.35 + i * 0.04}s` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <link.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium truncate">{link.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card rounded-xl border p-6 opacity-0 animate-fade-in-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Faturamento</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/financeiro" className="text-xs gap-1">Ver tudo <ChevronRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={displayBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-6 opacity-0 animate-fade-in-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.55s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-display">Regime Tributário</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/crm" className="text-xs gap-1">Ver tudo <ChevronRight className="w-3 h-3" /></Link>
            </Button>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-muted-foreground">{c.name}</span>
                    </div>
                    <span className="font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Building2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">Adicione clientes para ver</p>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-card rounded-xl border overflow-hidden opacity-0 animate-fade-in-up hover:shadow-lg transition-shadow duration-300" style={{ animationDelay: '0.6s' }}>
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold font-display">Tarefas Recentes</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/tarefas" className="text-xs gap-1">Ver todas <ChevronRight className="w-3 h-3" /></Link>
          </Button>
        </div>
        {tasks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full stack-table">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left py-3 px-6 font-medium">Cliente</th>
                  <th className="text-left py-3 px-6 font-medium">Tarefa</th>
                  <th className="text-left py-3 px-6 font-medium">Status</th>
                  <th className="text-left py-3 px-6 font-medium">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t: any) => {
                  const s = statusConfig[t.status] || statusConfig.pending;
                  return (
                    <tr key={t.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td data-label="Cliente" className="py-3 px-6 text-sm font-medium">{t.clients?.company_name || "—"}</td>
                      <td data-label="Tarefa" className="py-3 px-6 text-sm text-muted-foreground">{t.title}</td>
                      <td data-label="Status" className="py-3 px-6">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
                      </td>
                      <td data-label="Prazo" className="py-3 px-6 text-sm text-muted-foreground">
                        {t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">Nenhuma tarefa cadastrada</p>
            <Button variant="outline" size="sm" asChild className="mt-3">
              <Link to="/tarefas">Criar primeira tarefa</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
