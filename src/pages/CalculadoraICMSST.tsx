import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, Info, RotateCcw, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

// MVA padrão simplificado (em produção, usar tabela NCM completa)
const MVA_PADRAO: Record<string, number> = {
  "AC": 40, "AL": 40, "AM": 40, "AP": 40, "BA": 40, "CE": 40, "DF": 40,
  "ES": 40, "GO": 40, "MA": 40, "MG": 40, "MS": 40, "MT": 40, "PA": 40,
  "PB": 40, "PE": 40, "PI": 40, "PR": 40, "RJ": 40, "RN": 40, "RO": 40,
  "RR": 40, "RS": 40, "SC": 40, "SE": 40, "SP": 40, "TO": 40,
};

type Resultado = {
  baseICMSProprio: number;
  icmsProprio: number;
  mvaAjustado: number;
  baseICMSST: number;
  icmsST: number;
  valorTotalNF: number;
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help inline ml-1" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export default function CalculadoraICMSST() {
  const [valorProduto, setValorProduto] = useState("");
  const [frete, setFrete] = useState("");
  const [seguro, setSeguro] = useState("");
  const [outrasDespesas, setOutrasDespesas] = useState("");
  const [ipi, setIpi] = useState("");
  const [desconto, setDesconto] = useState("");
  const [aliqICMSInterna, setAliqICMSInterna] = useState("");
  const [aliqICMSInterestadual, setAliqICMSInterestadual] = useState("");
  const [mvaOriginal, setMvaOriginal] = useState("");
  const [ufOrigem, setUfOrigem] = useState("");
  const [ufDestino, setUfDestino] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [usarMVAAjustado, setUsarMVAAjustado] = useState(true);

  const calcular = () => {
    const vp = parseFloat(valorProduto.replace(",", ".")) || 0;
    const fr = parseFloat(frete.replace(",", ".")) || 0;
    const sg = parseFloat(seguro.replace(",", ".")) || 0;
    const od = parseFloat(outrasDespesas.replace(",", ".")) || 0;
    const ipiVal = parseFloat(ipi.replace(",", ".")) || 0;
    const desc = parseFloat(desconto.replace(",", ".")) || 0;
    const aliqInterna = parseFloat(aliqICMSInterna.replace(",", ".")) || 0;
    const aliqInter = parseFloat(aliqICMSInterestadual.replace(",", ".")) || 0;
    const mvaOrig = parseFloat(mvaOriginal.replace(",", ".")) || MVA_PADRAO[ufDestino] || 40;

    if (vp <= 0) return;

    // Base ICMS Próprio = Valor Produto + Frete + Seguro + Outras Despesas - Desconto
    const baseICMSProprio = vp + fr + sg + od - desc;

    // ICMS Próprio
    const icmsProprio = baseICMSProprio * (aliqInter / 100);

    // MVA Ajustado (quando alíquota interestadual é diferente da interna)
    let mvaAjustado = mvaOrig;
    if (usarMVAAjustado && aliqInter > 0 && aliqInterna > 0 && aliqInter !== aliqInterna) {
      // Fórmula: MVA Ajustado = [(1 + MVA Original/100) × (1 - aliq inter/100) / (1 - aliq interna/100) - 1] × 100
      mvaAjustado = ((1 + mvaOrig / 100) * (1 - aliqInter / 100) / (1 - aliqInterna / 100) - 1) * 100;
    }

    // Base ICMS-ST = (Base ICMS Próprio + IPI) × (1 + MVA Ajustado / 100)
    const baseICMSST = (baseICMSProprio + ipiVal) * (1 + mvaAjustado / 100);

    // ICMS-ST = (Base ICMS-ST × Alíq Interna) - ICMS Próprio
    const icmsST = Math.max(0, (baseICMSST * (aliqInterna / 100)) - icmsProprio);

    // Valor Total NF = Valor Produto + Frete + Seguro + Outras Despesas + IPI + ICMS-ST - Desconto
    const valorTotalNF = vp + fr + sg + od + ipiVal + icmsST - desc;

    setResultado({
      baseICMSProprio,
      icmsProprio,
      mvaAjustado,
      baseICMSST,
      icmsST,
      valorTotalNF,
    });
  };

  const limpar = () => {
    setValorProduto("");
    setFrete("");
    setSeguro("");
    setOutrasDespesas("");
    setIpi("");
    setDesconto("");
    setAliqICMSInterna("");
    setAliqICMSInterestadual("");
    setMvaOriginal("");
    setUfOrigem("");
    setUfDestino("");
    setResultado(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Calculadora ICMS-ST</h1>
          <p className="text-sm text-muted-foreground">Substituição tributária com MVA ajustado</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados da Operação */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Dados da Operação
            </CardTitle>
            <CardDescription>Informe os valores da nota fiscal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* UF Origem / Destino */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">UF Origem</Label>
                <Select value={ufOrigem} onValueChange={setUfOrigem}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UF Destino</Label>
                <Select value={ufDestino} onValueChange={setUfDestino}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Valores */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Valor do Produto (R$)
                  <InfoTip text="Valor total dos produtos sem impostos" />
                </Label>
                <Input className="h-9 text-sm" placeholder="0,00" value={valorProduto} onChange={e => setValorProduto(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Frete (R$)</Label>
                <Input className="h-9 text-sm" placeholder="0,00" value={frete} onChange={e => setFrete(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Seguro (R$)</Label>
                <Input className="h-9 text-sm" placeholder="0,00" value={seguro} onChange={e => setSeguro(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Outras Despesas (R$)</Label>
                <Input className="h-9 text-sm" placeholder="0,00" value={outrasDespesas} onChange={e => setOutrasDespesas(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  IPI (R$)
                  <InfoTip text="Valor do IPI destacado na nota" />
                </Label>
                <Input className="h-9 text-sm" placeholder="0,00" value={ipi} onChange={e => setIpi(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Desconto (R$)</Label>
                <Input className="h-9 text-sm" placeholder="0,00" value={desconto} onChange={e => setDesconto(e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Alíquotas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Alíq. ICMS Interestadual (%)
                  <InfoTip text="Alíquota ICMS entre estados (ex: 4%, 7% ou 12%)" />
                </Label>
                <Input className="h-9 text-sm" placeholder="12" value={aliqICMSInterestadual} onChange={e => setAliqICMSInterestadual(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Alíq. ICMS Interna (%)
                  <InfoTip text="Alíquota ICMS interna do estado de destino (ex: 17%, 18%)" />
                </Label>
                <Input className="h-9 text-sm" placeholder="18" value={aliqICMSInterna} onChange={e => setAliqICMSInterna(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  MVA Original (%)
                  <InfoTip text="Margem de Valor Agregado conforme NCM do produto e legislação do estado de destino" />
                </Label>
                <Input className="h-9 text-sm" placeholder="40" value={mvaOriginal} onChange={e => setMvaOriginal(e.target.value)} />
              </div>
            </div>

            {/* MVA Ajustado toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mva-ajustado"
                checked={usarMVAAjustado}
                onChange={e => setUsarMVAAjustado(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="mva-ajustado" className="text-xs cursor-pointer">
                Calcular MVA Ajustado automaticamente
                <InfoTip text="Ajusta o MVA quando a alíquota interestadual é diferente da interna, conforme Convênio ICMS 142/2018" />
              </Label>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button onClick={calcular} className="flex-1 h-10">
                <Calculator className="w-4 h-4 mr-2" />
                Calcular ICMS-ST
              </Button>
              <Button variant="outline" onClick={limpar} className="h-10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultado */}
        <Card className={resultado ? "border-primary/30 shadow-md" : ""}>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Resultado</CardTitle>
            <CardDescription>Valores calculados do ICMS-ST</CardDescription>
          </CardHeader>
          <CardContent>
            {!resultado ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="w-12 h-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Preencha os dados e clique em calcular</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ResultRow label="Base ICMS Próprio" value={formatCurrency(resultado.baseICMSProprio)} />
                <ResultRow label="ICMS Próprio" value={formatCurrency(resultado.icmsProprio)} />
                <Separator />
                <ResultRow
                  label="MVA Ajustado"
                  value={`${resultado.mvaAjustado.toFixed(2)}%`}
                  highlight={usarMVAAjustado}
                />
                <ResultRow label="Base ICMS-ST" value={formatCurrency(resultado.baseICMSST)} />
                <Separator />
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <ResultRow
                    label="ICMS-ST a Recolher"
                    value={formatCurrency(resultado.icmsST)}
                    bold
                  />
                </div>
                <Separator />
                <ResultRow
                  label="Valor Total da NF"
                  value={formatCurrency(resultado.valorTotalNF)}
                  bold
                />

                {/* Fórmulas */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Fórmulas utilizadas</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong>MVA Ajustado</strong> = [(1 + MVA/100) × (1 - Alíq Inter/100) / (1 - Alíq Interna/100) - 1] × 100
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong>Base ST</strong> = (Base ICMS + IPI) × (1 + MVA Ajustado/100)
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong>ICMS-ST</strong> = (Base ST × Alíq Interna) - ICMS Próprio
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium">Sobre o cálculo do ICMS-ST</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                O ICMS-ST (Substituição Tributária) é o regime em que a responsabilidade pelo recolhimento do ICMS
                é atribuída a um contribuinte diferente do que realiza a operação. O MVA (Margem de Valor Agregado)
                é definido pela legislação de cada estado conforme o NCM do produto. Consulte sempre a tabela
                vigente do CEST/NCM para obter o MVA correto. Base legal: Convênio ICMS 142/2018 e legislação estadual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold text-primary" : ""} ${highlight ? "text-primary" : ""}`}>
        {value}
        {highlight && <Badge variant="outline" className="ml-2 text-[9px] px-1.5 py-0">ajustado</Badge>}
      </span>
    </div>
  );
}
