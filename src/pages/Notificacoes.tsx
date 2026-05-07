import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Bell, CheckCircle, Clock, ExternalLink, 
  Trash2, CheckSquare, ChevronLeft, ChevronRight,
  ShieldAlert, Receipt, FileSignature
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id, page, filter],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
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
      toast.success("Todas as notificações foram marcadas como lidas");
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
      toast.success("Notificação excluída");
    },
  });

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Central de Notificações</h1>
          <p className="text-muted-foreground">Gerencie seus avisos e alertas do sistema</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-2 border-b pb-4">
        <Button 
          variant={filter === "all" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => { setFilter("all"); setPage(0); }}
        >
          Todas
        </Button>
        <Button 
          variant={filter === "unread" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => { setFilter("unread"); setPage(0); }}
        >
          Não lidas
        </Button>
      </div>

      <div className="space-y-4">
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
                "transition-all duration-200 hover:border-primary/30",
                !notification.read && "border-l-4 border-l-primary bg-primary/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center shadow-sm">
                      {getIcon(notification.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={cn("text-sm font-semibold", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1" />
                        {notification.created_at && format(new Date(notification.created_at), "HH:mm, dd/MM", { locale: ptBR })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      {notification.link && (
                        <Button variant="outline" size="sm" asChild onClick={() => markAsReadMutation.mutate(notification.id)}>
                          <Link to={notification.link} className="gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            Ver Detalhes
                          </Link>
                        </Button>
                      )}
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                        >
                          <CheckCircle className="w-3 h-3 mr-1.5" />
                          Marcar como lida
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(notification.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
