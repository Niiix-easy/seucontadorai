import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Ban, FileEdit, Send, AlertTriangle, FileCheck, History } from "lucide-react";

type Props = {
  notaId: string;
  tipo: "nfe" | "nfse";
};

const ICONS: Record<string, any> = {
  cancelamento: Ban,
  cce: FileEdit,
  reenvio: Send,
  denegacao: AlertTriangle,
  emissao: FileCheck,
};

const LABELS: Record<string, string> = {
  cancelamento: "Cancelamento",
  cce: "Carta de Correção",
  reenvio: "Reenvio",
  denegacao: "Denegação",
  emissao: "Emissão",
};

const COLORS: Record<string, string> = {
  cancelamento: "text-destructive",
  cce: "text-info",
  reenvio: "text-primary",
  denegacao: "text-warning",
  emissao: "text-success",
};

export default function HistoricoEventos({ notaId, tipo }: Props) {
  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["nf-eventos", tipo, notaId],
    queryFn: async () => {
      const col = tipo === "nfe" ? "nfe_id" : "nfse_id";
      const { data } = await supabase
        .from("nf_eventos")
        .select("*")
        .eq(col, notaId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!notaId,
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4">Carregando histórico…</p>;
  }

  if (eventos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nenhum evento registrado para esta nota</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eventos.map((ev: any) => {
        const Icon = ICONS[ev.tipo] || History;
        const color = COLORS[ev.tipo] || "text-muted-foreground";
        return (
          <div key={ev.id} className="flex gap-3 p-3 rounded-lg border bg-card">
            <div className={`shrink-0 w-9 h-9 rounded-full bg-muted flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{LABELS[ev.tipo] || ev.tipo}</span>
                  {ev.sequencia ? <Badge variant="outline" className="text-[10px]">#{ev.sequencia}</Badge> : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(ev.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              {ev.descricao && (
                <p className="text-sm text-muted-foreground mt-1 break-words">{ev.descricao}</p>
              )}
              {ev.protocolo && (
                <p className="text-xs font-mono text-muted-foreground mt-1">Protocolo: {ev.protocolo}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
