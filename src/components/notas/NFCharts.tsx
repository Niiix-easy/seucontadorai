import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useMemo } from "react";

type Props = {
  nfes: any[];
  nfses: any[];
  clients: Array<{ id: string; company_name: string }>;
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];

export function NFCharts({ nfes, nfses, clients }: Props) {
  const todas = useMemo(() => [
    ...nfes.map(n => ({ ...n, _tipo: "NF-e", _valor: Number(n.valor_total || 0), _data: n.data_emissao })),
    ...nfses.map(n => ({ ...n, _tipo: "NFS-e", _valor: Number(n.valor_servicos || 0), _data: n.data_emissao })),
  ], [nfes, nfses]);

  // Emissão por dia (últimos 30 dias)
  const porDia = useMemo(() => {
    const map = new Map<string, { date: string; nfe: number; nfse: number }>();
    const hoje = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(hoje); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, { date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), nfe: 0, nfse: 0 });
    }
    todas.forEach(n => {
      if (!n._data) return;
      const key = new Date(n._data).toISOString().slice(0, 10);
      const r = map.get(key);
      if (r) { if (n._tipo === "NF-e") r.nfe++; else r.nfse++; }
    });
    return Array.from(map.values());
  }, [todas]);

  // Top 5 clientes por valor
  const topClientes = useMemo(() => {
    const map = new Map<string, number>();
    todas.forEach(n => {
      const id = n.client_id || "sem-cliente";
      map.set(id, (map.get(id) || 0) + n._valor);
    });
    return Array.from(map.entries())
      .map(([id, total]) => ({
        nome: clients.find(c => c.id === id)?.company_name || "Sem cliente",
        total: Math.round(total),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [todas, clients]);

  // % autorizada vs cancelada
  const status = useMemo(() => {
    const aut = todas.filter(n => n.status === "autorizada").length;
    const can = todas.filter(n => n.status === "cancelada").length;
    const out = todas.length - aut - can;
    return [
      { name: "Autorizadas", value: aut },
      { name: "Canceladas", value: can },
      ...(out > 0 ? [{ name: "Outros", value: out }] : []),
    ];
  }, [todas]);

  if (todas.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-sm font-display">Emissões nos últimos 30 dias</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={porDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="nfe" name="NF-e" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="nfse" name="NFS-e" stroke="hsl(var(--info))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-display">Top 5 clientes por valor</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topClientes} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR")}`}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-display">Status das notas</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={status} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(e) => `${e.name}: ${e.value}`}>
                {status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
