import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Plus, TrendingUp, TrendingDown, Wallet, Search, Loader2, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function Financeiro() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: 0, type: "receita", date: new Date().toISOString().split("T")[0], status: "pending" });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["financials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("financial_records").select("*, clients(company_name)").order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await supabase.from("financial_records").insert({ ...data, amount: Number(data.amount), user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financials"] }); toast.success("Lançamento salvo!"); setDialogOpen(false); setForm({ description: "", amount: 0, type: "receita", date: new Date().toISOString().split("T")[0], status: "pending" }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["financials"] }); toast.success("Removido!"); },
  });

  const receitas = records.filter((r: any) => r.type === "receita").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const despesas = records.filter((r: any) => r.type === "despesa").reduce((s: number, r: any) => s + Number(r.amount), 0);
  const saldo = receitas - despesas;

  const filtered = records.filter((r: any) => {
    const matchSearch = r.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || r.type === filterType;
    return matchSearch && matchType;
  });

  // Monthly chart
  const monthly: Record<string, { receita: number; despesa: number }> = {};
  records.forEach((r: any) => {
    const m = new Date(r.date).toLocaleString("pt-BR", { month: "short" });
    if (!monthly[m]) monthly[m] = { receita: 0, despesa: 0 };
    monthly[m][r.type as "receita" | "despesa"] += Number(r.amount);
  });
  const chartData = Object.entries(monthly).slice(-6).map(([month, v]) => ({ month, ...v }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-primary" /> Financeiro
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{records.length} lançamentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Novo Lançamento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2"><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required /></div>
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Receitas</p><p className="text-2xl font-bold font-display text-primary">R$ {receitas.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Despesas</p><p className="text-2xl font-bold font-display text-destructive">R$ {despesas.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Saldo</p><p className={`text-2xl font-bold font-display ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>R$ {saldo.toLocaleString("pt-BR")}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground mb-1">Lançamentos</p><p className="text-2xl font-bold font-display text-primary">{records.length}</p></CardContent></Card>
      </div>

      {chartData.length > 0 && (
        <Card><CardHeader><CardTitle className="font-display text-base">Receitas vs Despesas</CardTitle></CardHeader>
          <CardContent><ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(220,14%,90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Bar dataKey="receita" name="Receita" fill="hsl(217,91%,50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" name="Despesa" fill="hsl(350,72%,50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer></CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="receita">Receitas</SelectItem><SelectItem value="despesa">Despesas</SelectItem></SelectContent></Select>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <th className="text-left py-3 px-4">Descrição</th><th className="text-left py-3 px-4">Data</th><th className="text-left py-3 px-4">Tipo</th><th className="text-right py-3 px-4">Valor</th><th className="w-10" />
            </tr></thead>
            <tbody>{filtered.map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-muted/30">
                <td className="py-3 px-4 text-sm font-medium">{r.description}</td>
                <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                <td className="py-3 px-4"><Badge variant={r.type === "receita" ? "default" : "destructive"} className="text-[10px]">{r.type === "receita" ? "Receita" : "Despesa"}</Badge></td>
                <td className={`py-3 px-4 text-sm text-right font-mono font-medium ${r.type === "receita" ? "text-primary" : "text-destructive"}`}>{r.type === "receita" ? "+" : "-"} R$ {Number(r.amount).toLocaleString("pt-BR")}</td>
                <td className="py-3 px-4"><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
