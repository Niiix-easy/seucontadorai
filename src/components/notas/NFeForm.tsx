import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isValidCpfOrCnpj, maskCpfCnpj } from "@/lib/br-validators";

export type Item = {
  descricao: string; ncm: string; cfop: string; unidade: string;
  quantidade: number; valor_unitario: number;
  icms_aliquota: number; ipi_aliquota: number; pis_aliquota: number; cofins_aliquota: number;
};

export const novoItem = (): Item => ({
  descricao: "", ncm: "", cfop: "5102", unidade: "UN",
  quantidade: 1, valor_unitario: 0,
  icms_aliquota: 18, ipi_aliquota: 0, pis_aliquota: 1.65, cofins_aliquota: 7.6,
});

type Props = {
  userId: string;
  clients: Array<{ id: string; company_name: string; cnpj?: string | null }>;
  onSuccess: () => void;
  onCancel: () => void;
};

export function NFeForm({ userId, clients, onSuccess, onCancel }: Props) {
  const [client, setClient] = useState("");
  const [numero, setNumero] = useState("");
  const [natureza, setNatureza] = useState("Venda de mercadoria");
  const [uf, setUf] = useState("SP");
  const [info, setInfo] = useState("");
  const [cnpjDest, setCnpjDest] = useState("");
  const [itens, setItens] = useState<Item[]>([novoItem()]);

  const totalProdutos = itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const totalIcms = itens.reduce((s, i) => s + (i.quantidade * i.valor_unitario * i.icms_aliquota) / 100, 0);
  const totalIpi = itens.reduce((s, i) => s + (i.quantidade * i.valor_unitario * i.ipi_aliquota) / 100, 0);
  const totalNfe = totalProdutos + totalIpi;

  const cnpjValid = !cnpjDest || isValidCpfOrCnpj(cnpjDest);

  const addItem = () => setItens([...itens, novoItem()]);
  const removeItem = (idx: number) => setItens(itens.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItens(itens.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const handleClient = (id: string) => {
    setClient(id);
    const c = clients.find(x => x.id === id);
    if (c?.cnpj) setCnpjDest(maskCpfCnpj(c.cnpj));
  };

  const emitir = async () => {
    if (!client || !numero || itens.some(i => !i.descricao)) {
      toast.error("Preencha cliente, número e descrição de todos os itens"); return;
    }
    if (cnpjDest && !isValidCpfOrCnpj(cnpjDest)) {
      toast.error("CNPJ/CPF do destinatário inválido"); return;
    }
    const cliente = clients.find(c => c.id === client);
    const { data: nfe, error } = await supabase.from("nfe_emitidas").insert({
      user_id: userId, client_id: client, numero, serie: "1",
      natureza_operacao: natureza, uf_destino: uf,
      cnpj_destinatario: cnpjDest || cliente?.cnpj || "",
      razao_destinatario: cliente?.company_name || "",
      info_complementares: info,
      valor_produtos: totalProdutos, valor_icms: totalIcms, valor_ipi: totalIpi,
      valor_total: totalNfe, status: "autorizada",
    }).select().single();

    if (error || !nfe) { toast.error("Erro: " + error?.message); return; }

    const itensInsert = itens.map((it, idx) => ({ nfe_id: nfe.id, numero_item: idx + 1, ...it }));
    const { error: e2 } = await supabase.from("nfe_itens").insert(itensInsert);
    if (e2) toast.error("NF-e criada, mas itens falharam: " + e2.message);
    else toast.success(`NF-e nº ${numero} emitida!`);
    onSuccess();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Cliente (destinatário)</Label>
            <Select value={client} onValueChange={handleClient}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CNPJ/CPF destinatário</Label>
            <Input
              value={cnpjDest}
              onChange={e => setCnpjDest(maskCpfCnpj(e.target.value))}
              placeholder="00.000.000/0001-00"
              className={cnpjDest && !cnpjValid ? "border-destructive" : ""}
            />
            {cnpjDest && !cnpjValid && <p className="text-xs text-destructive mt-1">CNPJ/CPF inválido</p>}
          </div>
          <div>
            <Label>Número da NF</Label>
            <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="000001" />
          </div>
          <div>
            <Label>UF destino</Label>
            <Input value={uf} onChange={e => setUf(e.target.value.toUpperCase())} maxLength={2} />
          </div>
          <div className="md:col-span-2">
            <Label>Natureza da operação</Label>
            <Input value={natureza} onChange={e => setNatureza(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base">Itens</Label>
            <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-4 h-4" /> Item</Button>
          </div>
          <div className="space-y-3">
            {itens.map((it, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                  {itens.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </div>
                <Input placeholder="Descrição" value={it.descricao} onChange={e => updateItem(idx, { descricao: e.target.value })} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input placeholder="NCM" value={it.ncm} onChange={e => updateItem(idx, { ncm: e.target.value })} />
                  <Input placeholder="CFOP" value={it.cfop} onChange={e => updateItem(idx, { cfop: e.target.value })} />
                  <Input placeholder="Un" value={it.unidade} onChange={e => updateItem(idx, { unidade: e.target.value })} />
                  <Input type="number" placeholder="Qtd" value={it.quantidade} onChange={e => updateItem(idx, { quantidade: Number(e.target.value) })} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Input type="number" step="0.01" placeholder="Valor unit." value={it.valor_unitario} onChange={e => updateItem(idx, { valor_unitario: Number(e.target.value) })} />
                  <Input type="number" step="0.01" placeholder="ICMS %" value={it.icms_aliquota} onChange={e => updateItem(idx, { icms_aliquota: Number(e.target.value) })} />
                  <Input type="number" step="0.01" placeholder="IPI %" value={it.ipi_aliquota} onChange={e => updateItem(idx, { ipi_aliquota: Number(e.target.value) })} />
                  <div className="text-right text-sm font-mono pt-2">
                    Subtotal: <span className="font-semibold">R$ {(it.quantidade * it.valor_unitario).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Textarea placeholder="Informações complementares" value={info} onChange={e => setInfo(e.target.value)} rows={2} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50">
          <div><p className="text-xs text-muted-foreground">Produtos</p><p className="font-mono font-semibold">R$ {totalProdutos.toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">ICMS</p><p className="font-mono font-semibold">R$ {totalIcms.toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">IPI</p><p className="font-mono font-semibold">R$ {totalIpi.toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">Total NF</p><p className="font-mono font-bold text-primary">R$ {totalNfe.toFixed(2)}</p></div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={emitir}>Emitir NF-e</Button>
      </DialogFooter>
    </>
  );
}
