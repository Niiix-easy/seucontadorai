import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ban, Download, Eye, FileText } from "lucide-react";

type Props = {
  notas: any[];
  onView: (n: any) => void;
  onDownload: (n: any) => void;
  onCancel: (n: any) => void;
};

export function NFSeTable({ notas, onView, onDownload, onCancel }: Props) {
  if (notas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Nenhuma NFS-e encontrada</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <th className="text-left py-2 px-3">Número</th>
            <th className="text-left py-2 px-3 hidden md:table-cell">Tomador</th>
            <th className="text-left py-2 px-3 hidden lg:table-cell">Discriminação</th>
            <th className="text-right py-2 px-3">Valor</th>
            <th className="text-right py-2 px-3 hidden sm:table-cell">ISS</th>
            <th className="text-center py-2 px-3">Status</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {notas.map((n: any) => (
            <tr key={n.id} className="border-t hover:bg-muted/30">
              <td className="py-2 px-3 font-mono">{n.numero}/{n.serie}</td>
              <td className="py-2 px-3 hidden md:table-cell">{n.razao_tomador || "-"}</td>
              <td className="py-2 px-3 text-muted-foreground max-w-xs truncate hidden lg:table-cell">{n.discriminacao}</td>
              <td className="py-2 px-3 text-right font-mono">R$ {Number(n.valor_servicos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              <td className="py-2 px-3 text-right font-mono hidden sm:table-cell">R$ {Number(n.iss_valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              <td className="py-2 px-3 text-center">
                <Badge variant={n.status === "cancelada" ? "destructive" : "default"}>{n.status}</Badge>
              </td>
              <td className="py-2 px-3">
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Histórico" onClick={() => onView(n)}><Eye className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Baixar PDF" onClick={() => onDownload(n)}><Download className="w-4 h-4" /></Button>
                  {n.status !== "cancelada" && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Cancelar" onClick={() => onCancel(n)}><Ban className="w-4 h-4" /></Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
