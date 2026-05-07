import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell, CheckCircle, Clock, ExternalLink,
  Trash2, CheckSquare, ChevronLeft, ChevronRight,
  ShieldAlert, Receipt, FileSignature, Search,
  Filter, ArrowUpDown, Settings2, MoreHorizontal,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export default function Notificacoes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);

  // Preferences state (mock)
  const [prefs, setPrefs] = useState({
    nfe: true,
    nfse: true,
    audit: true,
    email: true,
    push: true
  });

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id, page, filter, search, sort],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" });

      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
      }

      query = query
        .order("created_at", { ascending: sort === "asc" })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (filter === "unread") {
        query = query.eq("read", false);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { notifications: data || [], total: count || 0 };
    },
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user?.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notifications"] });
      toast.success("Todas as notificações foram marcadas como lidas");
      setSelectedIds([]);
    },
  });

  const markSelectedAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notifications"] });
      toast.success(`${selectedIds.length} notificações marcadas como lidas`);
      setSelectedIds([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notifications"] });
      toast.success("Notificação excluída");
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", selectedIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notifications"] });
      toast.success(`${selectedIds.length} notificações excluídas`);
      setSelectedIds([]);
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === data?.notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data?.notifications.map(n => n.id) || []);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "nfe": return <FileSignature className="w-4 h-4 text-blue-500" />;
      case "nfse": return <Receipt className="w-4 h-4 text-green-500" />;
      case "audit": return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / ITEMS_PER_PAGE);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Notificações</h1>
          <p className="text-muted-foreground">Gerencie seus avisos e alertas do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="w-4 h-4 mr-2" />
                Preferências
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Preferências de Notificação</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Tipos de Alerta</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notas Fiscais (Emissão/Correção)</span>
                      <Switch checked={prefs.nfe} onCheckedChange={(c) => setPrefs(p => ({ ...p, nfe: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auditoria e Segurança</span>
                      <Switch checked={prefs.audit} onCheckedChange={(c) => setPrefs(p => ({ ...p, audit: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CRM e Clientes</span>
                      <Switch checked={prefs.nfse} onCheckedChange={(c) => setPrefs(p => ({ ...p, nfse: c }))} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium">Canais</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Notificações no Navegador</span>
                      <Switch checked={prefs.push} onCheckedChange={(c) => setPrefs(p => ({ ...p, push: c }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alertas por E-mail</span>
                      <Switch checked={prefs.email} onCheckedChange={(c) => setPrefs(p => ({ ...p, email: c }))} />
                    </div>
                  </div>
                </div>
                <Button className="w-full" onClick={() => {
                  toast.success("Preferências salvas com sucesso!");
                  setShowPreferences(false);
                }}>Salvar Preferências</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filtros</label>
                <div className="space-y-1">
                  <Button 
                    variant={filter === "all" ? "secondary" : "ghost"} 
                    className="w-full justify-start h-9"
                    onClick={() => { setFilter("all"); setPage(0); }}
                  >
                    Todas as notificações
                  </Button>
                  <Button 
                    variant={filter === "unread" ? "secondary" : "ghost"} 
                    className="w-full justify-start h-9"
                    onClick={() => { setFilter("unread"); setPage(0); }}
                  >
                    Apenas não lidas
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordenação</label>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-9"
                  onClick={() => setSort(s => s === "desc" ? "asc" : "desc")}
                >
                  {sort === "desc" ? "Mais recentes" : "Mais antigas"}
                  <ArrowUpDown className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por título ou mensagem..." 
                className="pl-10"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => markSelectedAsReadMutation.mutate()}
                  disabled={markSelectedAsReadMutation.isPending}
                >
                  Marcar lidas ({selectedIds.length})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deleteSelectedMutation.mutate()}
                  disabled={deleteSelectedMutation.isPending}
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-2 py-1">
            <Checkbox 
              checked={data?.notifications.length > 0 && selectedIds.length === data?.notifications.length}
              onCheckedChange={toggleAll}
            />
            <span className="text-xs text-muted-foreground font-medium">Selecionar tudo nesta página</span>
          </div>

      <div className="space-y-4">
          <div className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-24 bg-muted/50 rounded-lg" />
                </Card>
              ))
            ) : data?.notifications.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhuma notificação encontrada</h3>
                <p className="text-muted-foreground">Você está em dia com todos os seus alertas!</p>
              </div>
            ) : (
              data?.notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "transition-all duration-200 hover:border-primary/30 group",
                    !notification.read && "border-l-4 border-l-primary bg-primary/5 shadow-sm"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="mt-1 flex items-center gap-3 shrink-0">
                        <Checkbox 
                          checked={selectedIds.includes(notification.id)}
                          onCheckedChange={() => toggleSelection(notification.id)}
                        />
                        <div className="w-9 h-9 rounded-full bg-background border flex items-center justify-center shadow-sm">
                          {getIcon(notification.type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={cn("text-sm font-semibold truncate", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                                {notification.title}
                              </h4>
                              {!notification.read && <Badge className="h-1.5 w-1.5 rounded-full p-0 bg-primary border-none" />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-[10px] font-normal whitespace-nowrap">
                              <Clock className="w-3 h-3 mr-1" />
                              {notification.created_at && format(new Date(notification.created_at), "HH:mm, dd/MM", { locale: ptBR })}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!notification.read && (
                                  <DropdownMenuItem onClick={() => markAsReadMutation.mutate(notification.id)}>
                                    <Check className="w-4 h-4 mr-2" /> Marcar como lida
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(notification.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <Button variant="outline" size="sm" asChild onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}>
                            <Link to={`/notificacoes/${notification.id}`} className="gap-1.5">
                              <ExternalLink className="w-3 h-3" />
                              Ver Detalhes
                            </Link>
                          </Button>
                          
                          {notification.link && (
                            <Button variant="ghost" size="sm" asChild className="text-primary hover:bg-primary/5" onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}>
                              <Link to={notification.link} className="gap-1.5">
                                Abrir Auditoria
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <span className="text-sm font-medium">
            Página {page + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Próxima
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
