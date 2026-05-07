import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Bell, Clock, ExternalLink, 
  Trash2, ShieldAlert, Receipt, FileSignature,
  Calendar, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NotificacaoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notification, isLoading } = useQuery({
    queryKey: ["notification", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;

      // Auto mark as read when opening details
      if (!data.read) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", id);
        
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-notifications"] });
      }

      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
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
      navigate("/notificacoes");
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "nfe": return <FileSignature className="w-8 h-8 text-blue-500" />;
      case "nfse": return <Receipt className="w-8 h-8 text-green-500" />;
      case "audit": return <ShieldAlert className="w-8 h-8 text-amber-500" />;
      default: return <Bell className="w-8 h-8 text-muted-foreground" />;
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center">Carregando...</div>;
  if (!notification) return <div className="p-8 text-center">Notificação não encontrada</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" asChild className="mb-2">
        <Link to="/notificacoes" className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </Link>
      </Button>

      <Card className="border-t-4 border-t-primary">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
              {getIcon(notification.type)}
            </div>
            <div>
              <CardTitle className="text-2xl">{notification.title}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {notification.created_at && format(new Date(notification.created_at), "PPP 'às' HH:mm", { locale: ptBR })}
                </span>
                {!notification.read && (
                  <Badge className="bg-primary text-primary-foreground">Nova</Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => deleteMutation.mutate()} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 bg-muted/20 rounded-xl border-2 border-dashed">
            <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Categoria</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                {notification.type.toUpperCase()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Status</p>
              <p className="text-sm font-medium">
                {notification.read ? "Lida" : "Não lida"}
              </p>
            </div>
          </div>

          {notification.link && (
            <div className="flex justify-end gap-3 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to={notification.link} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Ir para o Evento Relacionado
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}