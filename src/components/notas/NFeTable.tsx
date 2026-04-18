import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Ban, Download, Eye, FileEdit, FileText, History, MoreVertical } from "lucide-react";

type Props = {
  notas: any[];
  onView: (n: any) => void;
  onDownload: (n: any) => void;
  onCancel: (n: any) => void;
  onCce: (n: any) => void;
};

export function NFeTable({ notas, onView, onDownload, onCancel, onCce }: Props) {
  if (notas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Nenhuma NF-e encontrada</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <th className="text-left py-2 px-3">Número</th>
            <th className="text-left py-2 px-3 hidden md:table-cell">Destinatário</th>
            <th className="text-left py-2 px-3 hidden lg:table-cell">Natureza</th>
            <th className="text-right py-2 px-3">Valor</th>
            <th className="text-center py-2 px-3">Status</th>
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody>
          {notas.map((n: any) => (
            <tr key={n.id} className="border-t hover:bg-muted/30">
              <td className="py-2 px-3 font-mono">
                {n.numero}/{n.serie}
                {(n.cce_sequencia ?? 0) > 0 && (
                  <span className="ml-2 text-[10px] text-info">CC-e #{n.cce_sequencia}</span>
                )}
              </td>
              <td className="py-2 px-3 hidden md:table-cell">{n.razao_destinatario || "-"}</td>
              <td className="py-2 px-3 text-muted-foreground hidden lg:table-cell">{n.natureza_operacao || "-"}</td>
              <td className="py-2 px-3 text-right font-mono">R$ {Number(n.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
              <td className="py-2 px-3 text-center">
                <Badge variant={n.status === "cancelada" ? "destructive" : "default"}>{n.status}</Badge>
              </td>
              <td className="py-2 px-3">
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Histórico" onClick={() => onView(n)}><Eye className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Baixar DANFE" onClick={() => onDownload(n)}><Download className="w-4 h-4" /></Button>
                  {n.status !== "cancelada" && (
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" title="Cancelar" onClick={() => onCancel(n)}><Ban className="w-4 h-4" /></Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(n)}><History className="w-4 h-4 mr-2" /> Histórico</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownload(n)}><Download className="w-4 h-4 mr-2" /> Baixar DANFE</DropdownMenuItem>
                      {n.status !== "cancelada" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onCce(n)}><FileEdit className="w-4 h-4 mr-2" /> Carta de correção</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => onCancel(n)}><Ban className="w-4 h-4 mr-2" /> Cancelar NF-e</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
