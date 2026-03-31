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

const getInitialForm = () => ({
  description: "",
  amount: 0,
  type: "receita",
  date: new Date().toISOString().split("T")[0],
  status: "pending",
});

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Financeiro() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(getInitialForm());

  const {
    data: rawRecords = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["financials", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_records")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const records = rawRecords.map((record: any) => {
    const parsedDate = record?.date ? new Date(record.date) : new Date();
    const safeDate = Number.isNaN(parsedDate.getTime())
      ? new Date().toISOString().split("T")[0]
      : parsedDate.toISOString().split("T")[0];

    return {
      ...record,
      description: typeof record?.description === "string" && record.description.trim()
        ? record.description
        : "Sem descrição",
      amount: Number(record?.amount) || 0,
      type: record?.type === "despesa" ? "despesa" : "receita",
      date: safeDate,
    };
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!user) throw new Error("Usuário não autenticado.");

      const payload = {
        ...data,
        amount: Number(data.amount) || 0,
        user_id: user.id,
      };

      const { error } = await supabase.from("financial_records").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financials", user?.id] });
      toast.success("Lançamento salvo!");
      setDialogOpen(false);
      setForm(getInitialForm());
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar lançamento."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financials", user?.id] });
      toast.success("Removido!");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao remover lançamento."),
  });

  const receitas = records
    .filter((record) => record.type === "receita")
    .reduce((sum, record) => sum + record.amount, 0);
  const despesas = records
    .filter((record) => record.type === "despesa")
    .reduce((sum, record) => sum + record.amount, 0);
  const saldo = receitas - despesas;

  const filtered = records.filter((record) => {
    const matchSearch = record.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || record.type === filterType;
    return matchSearch && matchType;
  });

  const monthlyMap: Record<string, { month: string; receita: number; despesa: number }> = {};
  records.forEach((record) => {
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime())) return;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap[key]) {
      monthlyMap[key] = {
        month: date.toLocaleDateString("pt-BR", { month: "short" }),
        receita: 0,
        despesa: 0,
      };
    }

    monthlyMap[key][record.type] += record.amount;
  });

  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([, value]) => value);

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
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(form);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              Não foi possível carregar os lançamentos financeiros agora.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Receitas</p>
            <p className="text-2xl font-bold font-display text-primary">R$ {formatCurrency(receitas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Despesas</p>
            <p className="text-2xl font-bold font-display text-destructive">R$ {formatCurrency(despesas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Saldo</p>
            <p className={`text-2xl font-bold font-display ${saldo >= 0 ? "text-primary" : "text-destructive"}`}>R$ {formatCurrency(saldo)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground mb-1">Lançamentos</p>
            <p className="text-2xl font-bold font-display text-primary">{records.length}</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `R$ ${formatCurrency(Number(value))}`} />
                <Bar dataKey="receita" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border p-8 text-center text-sm text-muted-foreground">
          Nenhum lançamento encontrado.
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <th className="text-left py-3 px-4">Descrição</th>
                <th className="text-left py-3 px-4">Data</th>
                <th className="text-left py-3 px-4">Tipo</th>
                <th className="text-right py-3 px-4">Valor</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((record: any) => (
                <tr key={record.id} className="border-t hover:bg-muted/30">
                  <td className="py-3 px-4 text-sm font-medium">{record.description}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{new Date(record.date).toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-4">
                    <Badge variant={record.type === "receita" ? "default" : "destructive"} className="text-[10px]">
                      {record.type === "receita" ? "Receita" : "Despesa"}
                    </Badge>
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-mono font-medium ${record.type === "receita" ? "text-primary" : "text-destructive"}`}>
                    {record.type === "receita" ? "+" : "-"} R$ {formatCurrency(record.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(record.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
