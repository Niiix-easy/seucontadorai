import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, X, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type NFFilters = {
  dateFrom: string;
  dateTo: string;
  status: string;
  clientId: string;
  valorMin: string;
  valorMax: string;
};

export const emptyFilters: NFFilters = {
  dateFrom: "",
  dateTo: "",
  status: "all",
  clientId: "all",
  valorMin: "",
  valorMax: "",
};

type Props = {
  filters: NFFilters;
  onChange: (f: NFFilters) => void;
  clients: Array<{ id: string; company_name: string }>;
  onExportCsv: () => void;
  totalFiltered: number;
};

export function NFFiltros({ filters, onChange, clients, onExportCsv, totalFiltered }: Props) {
  const update = (patch: Partial<NFFilters>) => onChange({ ...filters, ...patch });
  const reset = () => onChange(emptyFilters);

  const activeCount = [
    filters.dateFrom, filters.dateTo,
    filters.status !== "all" ? filters.status : "",
    filters.clientId !== "all" ? filters.clientId : "",
    filters.valorMin, filters.valorMax,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filtros
            {activeCount > 0 && <Badge variant="secondary" className="ml-1">{activeCount}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] sm:w-[380px]" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Filtros avançados</p>
              {activeCount > 0 && (
                <Button variant="ghost" size="sm" onClick={reset} className="h-7 text-xs gap-1">
                  <X className="w-3 h-3" /> Limpar
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Data de</Label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => update({ dateFrom: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data até</Label>
                <Input type="date" value={filters.dateTo} onChange={(e) => update({ dateTo: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={filters.status} onValueChange={(v) => update({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="autorizada">Autorizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="denegada">Denegada</SelectItem>
                  <SelectItem value="rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Select value={filters.clientId} onValueChange={(v) => update({ clientId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Valor mín. (R$)</Label>
                <Input type="number" step="0.01" placeholder="0" value={filters.valorMin} onChange={(e) => update({ valorMin: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor máx. (R$)</Label>
                <Input type="number" step="0.01" placeholder="∞" value={filters.valorMax} onChange={(e) => update({ valorMax: e.target.value })} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t">
              {totalFiltered} {totalFiltered === 1 ? "nota encontrada" : "notas encontradas"}
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" className="gap-2" onClick={onExportCsv} disabled={totalFiltered === 0}>
        <Download className="w-4 h-4" />
        CSV ({totalFiltered})
      </Button>
    </div>
  );
}

/** Aplica filtros sobre uma lista de notas (NF-e ou NFS-e) */
export function applyNFFilters<T extends Record<string, any>>(
  notas: T[],
  filters: NFFilters,
  opts: { dateField: string; valueField: string }
): T[] {
  return notas.filter((n) => {
    const data = n[opts.dateField] ? new Date(n[opts.dateField]) : null;
    if (filters.dateFrom && (!data || data < new Date(filters.dateFrom + "T00:00:00"))) return false;
    if (filters.dateTo && (!data || data > new Date(filters.dateTo + "T23:59:59"))) return false;
    if (filters.status !== "all" && n.status !== filters.status) return false;
    if (filters.clientId !== "all" && n.client_id !== filters.clientId) return false;
    const valor = Number(n[opts.valueField] || 0);
    if (filters.valorMin && valor < Number(filters.valorMin)) return false;
    if (filters.valorMax && valor > Number(filters.valorMax)) return false;
    return true;
  });
}

/** Exporta notas para CSV (download direto) */
export function exportNotasCsv(
  notas: Record<string, any>[],
  filename: string,
  columns: Array<{ key: string; label: string; format?: (v: any) => string }>
) {
  if (notas.length === 0) return;
  const header = columns.map(c => `"${c.label}"`).join(";");
  const rows = notas.map(n =>
    columns.map(c => {
      const v = n[c.key];
      const formatted = c.format ? c.format(v) : (v ?? "");
      return `"${String(formatted).replace(/"/g, '""')}"`;
    }).join(";")
  );
  const csv = "\ufeff" + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
