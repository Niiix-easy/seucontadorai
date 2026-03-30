import {
  Building2, Users, FileText, DollarSign, ClipboardList,
  TrendingUp, AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const revenueData = [
  { month: "Jan", valor: 42000 }, { month: "Fev", valor: 45000 },
  { month: "Mar", valor: 48000 }, { month: "Abr", valor: 51000 },
  { month: "Mai", valor: 47000 }, { month: "Jun", valor: 53000 },
];

const clientesPorRegime = [
  { name: "Simples Nacional", value: 145, color: "hsl(217, 91%, 50%)" },
  { name: "Lucro Presumido", value: 62, color: "hsl(168, 72%, 40%)" },
  { name: "Lucro Real", value: 23, color: "hsl(38, 92%, 50%)" },
  { name: "MEI", value: 89, color: "hsl(280, 60%, 50%)" },
];

const tarefasRecentes = [
  { cliente: "Tech Solutions Ltda", tarefa: "SPED Fiscal - Março/2026", status: "pendente", prazo: "05/04/2026" },
  { cliente: "Restaurante Sabor SA", tarefa: "DCTF - Março/2026", status: "em_andamento", prazo: "10/04/2026" },
  { cliente: "Clínica Vida ME", tarefa: "Folha de Pagamento - Março", status: "concluído", prazo: "30/03/2026" },
  { cliente: "Auto Peças Norte Ltda", tarefa: "Apuração ICMS", status: "pendente", prazo: "12/04/2026" },
  { cliente: "Construtora ABC SA", tarefa: "ECD - Anual 2025", status: "em_andamento", prazo: "30/05/2026" },
];

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-[hsl(38,92%,50%)] text-[hsl(var(--warning-foreground))]" },
  em_andamento: { label: "Em andamento", color: "bg-primary text-primary-foreground" },
  concluído: { label: "Concluído", color: "bg-[hsl(160,72%,40%)] text-[hsl(var(--success-foreground))]" },
};

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-[Space_Grotesk] tracking-tight">
          Painel de Controle
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visão geral do escritório contábil • Março 2026
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} title="Clientes Ativos" value="319" change="+12 este mês" changeType="up" />
        <StatCard icon={FileText} title="Obrigações do Mês" value="847" change="92% entregues" changeType="up" />
        <StatCard icon={DollarSign} title="Faturamento Mensal" value="R$ 53.200" change="+8.2% vs mês anterior" changeType="up" />
        <StatCard icon={AlertTriangle} title="Alertas Pendentes" value="7" change="3 vencem hoje" changeType="down" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold font-[Space_Grotesk] mb-4">Faturamento Mensal</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Bar dataKey="valor" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold font-[Space_Grotesk] mb-4">Clientes por Regime</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={clientesPorRegime} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                {clientesPorRegime.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {clientesPorRegime.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
                <span className="font-medium">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold font-[Space_Grotesk]">Tarefas Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left py-3 px-6 font-medium">Cliente</th>
                <th className="text-left py-3 px-6 font-medium">Tarefa</th>
                <th className="text-left py-3 px-6 font-medium">Status</th>
                <th className="text-left py-3 px-6 font-medium">Prazo</th>
              </tr>
            </thead>
            <tbody>
              {tarefasRecentes.map((t, i) => {
                const s = statusConfig[t.status as keyof typeof statusConfig];
                return (
                  <tr key={i} className="border-t hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-6 text-sm font-medium">{t.cliente}</td>
                    <td className="py-3 px-6 text-sm text-muted-foreground">{t.tarefa}</td>
                    <td className="py-3 px-6">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="py-3 px-6 text-sm text-muted-foreground">{t.prazo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
