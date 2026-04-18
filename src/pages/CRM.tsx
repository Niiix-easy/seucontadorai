import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Plus, Search, Pencil, Trash2, Building2, Mail, Phone, MapPin, FileText, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { maskCNPJ, maskCPF, isValidCNPJ, isValidCPF, stripDigits } from "@/lib/br-validators";

type Client = {
  id: string; company_name: string; trade_name: string | null; cnpj: string | null; cpf: string | null;
  email: string | null; phone: string | null; tax_regime: string | null; status: string;
  monthly_fee: number | null; address_street: string | null; address_city: string | null;
  address_state: string | null; address_zip: string | null; notes: string | null;
  created_at: string; user_id: string;
};

const emptyClient = {
  company_name: "", trade_name: "", cnpj: "", cpf: "", email: "", phone: "",
  tax_regime: "simples_nacional", status: "active", monthly_fee: 0,
  address_street: "", address_city: "", address_state: "", address_zip: "", notes: "",
};

const regimeLabels: Record<string, string> = {
  simples_nacional: "Simples Nacional", lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real", mei: "MEI",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  inactive: { label: "Inativo", variant: "secondary" },
  suspended: { label: "Suspenso", variant: "destructive" },
};

export default function CRM() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRegime, setFilterRegime] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("company_name");
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof form & { id?: string }) => {
      const payload = { ...data, user_id: user!.id, monthly_fee: Number(data.monthly_fee) || 0 };
      if (editingClient) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success(editingClient ? "Cliente atualizado!" : "Cliente adicionado!");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Cliente removido!");
      setDeleteId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm(emptyClient);
    setEditingClient(null);
    setDialogOpen(false);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm({
      company_name: c.company_name, trade_name: c.trade_name || "", cnpj: c.cnpj || "",
      cpf: c.cpf || "", email: c.email || "", phone: c.phone || "",
      tax_regime: c.tax_regime || "simples_nacional", status: c.status,
      monthly_fee: c.monthly_fee || 0, address_street: c.address_street || "",
      address_city: c.address_city || "", address_state: c.address_state || "",
      address_zip: c.address_zip || "", notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const filtered = clients.filter(c => {
    const matchSearch = c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj || "").includes(search) || (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRegime = filterRegime === "all" || c.tax_regime === filterRegime;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchRegime && matchStatus;
  });

  const totalFee = clients.filter(c => c.status === "active").reduce((s, c) => s + (c.monthly_fee || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-[Space_Grotesk] tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-primary" /> CRM Clientes
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} clientes • Faturamento: R$ {totalFee.toLocaleString("pt-BR")}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto"><Plus className="w-4 h-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl sm:max-h-[90vh] sm:overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Razão Social *</Label>
                  <Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Nome Fantasia</Label>
                  <Input value={form.trade_name} onChange={e => setForm({ ...form, trade_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    value={form.cnpj}
                    onChange={e => setForm({ ...form, cnpj: maskCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                    className={form.cnpj && !isValidCNPJ(form.cnpj) ? "border-destructive" : ""}
                  />
                  {form.cnpj && !isValidCNPJ(form.cnpj) && stripDigits(form.cnpj).length === 14 && (
                    <p className="text-xs text-destructive">CNPJ inválido</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input
                    value={form.cpf}
                    onChange={e => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    className={form.cpf && !isValidCPF(form.cpf) ? "border-destructive" : ""}
                  />
                  {form.cpf && !isValidCPF(form.cpf) && stripDigits(form.cpf).length === 11 && (
                    <p className="text-xs text-destructive">CPF inválido</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Regime Tributário</Label>
                  <Select value={form.tax_regime} onValueChange={v => setForm({ ...form, tax_regime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(regimeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Honorário Mensal (R$)</Label>
                  <Input type="number" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input value={form.address_zip} onChange={e => setForm({ ...form, address_zip: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Endereço</Label>
                  <Input value={form.address_street} onChange={e => setForm({ ...form, address_street: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input value={form.address_city} onChange={e => setForm({ ...form, address_city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input value={form.address_state} onChange={e => setForm({ ...form, address_state: e.target.value })} maxLength={2} placeholder="SP" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : editingClient ? "Atualizar" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CNPJ ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="grid grid-cols-2 sm:flex gap-3">
          <Select value={filterRegime} onValueChange={setFilterRegime}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue placeholder="Regime" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os regimes</SelectItem>
              {Object.entries(regimeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="suspended">Suspensos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm">Clique em "Novo Cliente" para adicionar</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full stack-table">
              <thead>
                <tr className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Empresa</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">CNPJ</th>
                  <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Regime</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Honorário</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const st = statusLabels[c.status] || statusLabels.active;
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td data-label="Empresa" className="py-3 px-4">
                        <div className="text-sm font-medium">{c.company_name}</div>
                        {c.trade_name && <div className="text-xs text-muted-foreground">{c.trade_name}</div>}
                      </td>
                      <td data-label="CNPJ" className="py-3 px-4 text-sm text-muted-foreground md:table-cell">{c.cnpj || "—"}</td>
                      <td data-label="Email" className="py-3 px-4 text-sm text-muted-foreground hidden lg:table-cell">{c.email || "—"}</td>
                      <td data-label="Regime" className="py-3 px-4 text-xs">{regimeLabels[c.tax_regime || ""] || c.tax_regime || "—"}</td>
                      <td data-label="Status" className="py-3 px-4"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td data-label="Honorário" className="py-3 px-4 text-sm text-right font-medium">
                        {c.monthly_fee ? `R$ ${Number(c.monthly_fee).toLocaleString("pt-BR")}` : "—"}
                      </td>
                      <td data-label="Ações" className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t text-xs text-muted-foreground">
            Exibindo {filtered.length} de {clients.length} clientes
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
