import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isValidCpfOrCnpj, maskCpfCnpj } from "@/lib/br-validators";

type Props = {
  userId: string;
  clients: Array<{ id: string; company_name: string; cnpj?: string | null }>;
  onSuccess: () => void;
  onCancel: () => void;
};

export function NFSeForm({ userId, clients, onSuccess, onCancel }: Props) {
  const [client, setClient] = useState("");
  const [numero, setNumero] = useState("");
  const [codigo, setCodigo] = useState("");
  const [discriminacao, setDiscriminacao] = useState("");
  const [valor, setValor] = useState(0);
  const [deducoes, setDeducoes] = useState(0);
  const [iss, setIss] = useState(5);
  const [municipio, setMunicipio] = useState("São Paulo");
  const [cnpjTomador, setCnpjTomador] = useState("");

  const baseCalc = Math.max(0, valor - deducoes);
  const issValor = (baseCalc * iss) / 100;
  const valorLiquido = valor - issValor;
  const cnpjValid = !cnpjTomador || isValidCpfOrCnpj(cnpjTomador);

  const handleClient = (id: string) => {
    setClient(id);
    const c = clients.find(x => x.id === id);
    if (c?.cnpj) setCnpjTomador(maskCpfCnpj(c.cnpj));
  };

  const emitir = async () => {
    if (!client || !numero || !discriminacao || valor <= 0) {
      toast.error("Preencha cliente, número, discriminação e valor"); return;
    }
    if (cnpjTomador && !isValidCpfOrCnpj(cnpjTomador)) {
      toast.error("CNPJ/CPF do tomador inválido"); return;
    }
    const cliente = clients.find(c => c.id === client);
    const { error } = await supabase.from("nfse_emitidas").insert({
      user_id: userId, client_id: client, numero, serie: "1",
      cnpj_tomador: cnpjTomador || cliente?.cnpj || "",
      razao_tomador: cliente?.company_name || "",
      municipio_prestacao: municipio, codigo_servico: codigo,
      discriminacao,
      valor_servicos: valor, valor_deducoes: deducoes, base_calculo: baseCalc,
      iss_aliquota: iss, iss_valor: issValor, valor_liquido: valorLiquido,
      status: "autorizada",
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`NFS-e nº ${numero} emitida!`);
    onSuccess();
  };

  return (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Cliente (tomador)</Label>
            <Select value={client} onValueChange={handleClient}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CNPJ/CPF tomador</Label>
            <Input
              value={cnpjTomador}
              onChange={e => setCnpjTomador(maskCpfCnpj(e.target.value))}
              placeholder="00.000.000/0001-00"
              className={cnpjTomador && !cnpjValid ? "border-destructive" : ""}
            />
            {cnpjTomador && !cnpjValid && <p className="text-xs text-destructive mt-1">CNPJ/CPF inválido</p>}
          </div>
          <div>
            <Label>Número da NFS-e</Label>
            <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="000001" />
          </div>
          <div>
            <Label>Município de prestação</Label>
            <Input value={municipio} onChange={e => setMunicipio(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Código de serviço (LC 116)</Label>
            <Input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="17.19" />
          </div>
        </div>

        <div>
          <Label>Discriminação dos serviços</Label>
          <Textarea value={discriminacao} onChange={e => setDiscriminacao(e.target.value)} rows={3} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div><Label>Valor</Label><Input type="number" step="0.01" value={valor} onChange={e => setValor(Number(e.target.value))} /></div>
          <div><Label>Deduções</Label><Input type="number" step="0.01" value={deducoes} onChange={e => setDeducoes(Number(e.target.value))} /></div>
          <div><Label>ISS %</Label><Input type="number" step="0.01" value={iss} onChange={e => setIss(Number(e.target.value))} /></div>
        </div>

        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50">
          <div><p className="text-xs text-muted-foreground">Base de cálculo</p><p className="font-mono font-semibold">R$ {baseCalc.toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">ISS</p><p className="font-mono font-semibold">R$ {issValor.toFixed(2)}</p></div>
          <div><p className="text-xs text-muted-foreground">Valor líquido</p><p className="font-mono font-bold text-primary">R$ {valorLiquido.toFixed(2)}</p></div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={emitir}>Emitir NFS-e</Button>
      </DialogFooter>
    </>
  );
}
