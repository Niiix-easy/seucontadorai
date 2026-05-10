import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Search, Building2, Gauge, Scale, Sparkles, FileSearch, BarChart3,
  Bot, AlertTriangle, CheckCircle2, TrendingUp, Send, Loader2, Download, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ───────────────────────────── Helpers ─────────────────────────────

function onlyDigits(s: string) { return s.replace(/\D/g, ""); }
function formatCNPJ(s: string) {
  const d = onlyDigits(s).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function isValidCNPJ(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((a, n, i) => a + parseInt(n) * weights[i], 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const dv1 = calc(d.slice(0, 12), w1);
  const dv2 = calc(d.slice(0, 12) + dv1, w2);
  return dv1 === parseInt(d[12]) && dv2 === parseInt(d[13]);
}
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ───────────────────────────── Types ─────────────────────────────

type EmpresaInfo = {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  cnaeDescricao: string;
  regime: "MEI" | "Simples Nacional" | "Lucro Presumido" | "Lucro Real";
  uf: string;
  municipio: string;
  capitalSocial: number;
  faturamentoAnual: number;
  situacao: string;
  abertura: string;
  porte: string;
};

type ScoreFiscal = {
  total: number;
  regimeIdeal: number;
  creditos: number;
  riscoFiscal: number;
  compliance: number;
  historico: number;
};

type RegimeComparado = {
  regime: string;
  cargaTotal: number;
  aliquotaEfetiva: number;
  recomendado: boolean;
};

type Tese = {
  id: string;
  titulo: string;
  fundamento: string;
  exitoEstimado: number;
  valorEstimado: number;
  prazo: string;
  status: "identificada" | "em_analise" | "aplicavel";
};

type Alerta = {
  id: string;
  categoria: "risco" | "oportunidade" | "compliance" | "legislacao";
  titulo: string;
  descricao: string;
  severidade: "alta" | "media" | "baixa";
};

type ChatMsg = { role: "user" | "assistant"; content: string };

// ───────────────────────────── Mock generator ─────────────────────────────

function gerarAnalise(cnpj: string): {
  empresa: EmpresaInfo;
  score: ScoreFiscal;
  regimes: RegimeComparado[];
  teses: Tese[];
  alertas: Alerta[];
  benchmark: { setor: string; percentil: number; mediaCargaSetor: number; cargaEmpresa: number };
} {
  const d = onlyDigits(cnpj);
  const seed = parseInt(d.slice(0, 6)) || 100000;
  const rand = (min: number, max: number) =>
    min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);

  const faturamento = Math.round(rand(800_000, 25_000_000));
  const regimes: RegimeComparado[] = [
    { regime: "MEI", cargaTotal: faturamento * 0.06, aliquotaEfetiva: 6, recomendado: false },
    { regime: "Simples Nacional", cargaTotal: faturamento * (rand(7, 14) / 100), aliquotaEfetiva: rand(7, 14), recomendado: false },
    { regime: "Lucro Presumido", cargaTotal: faturamento * (rand(11, 18) / 100), aliquotaEfetiva: rand(11, 18), recomendado: false },
    { regime: "Lucro Real", cargaTotal: faturamento * (rand(9, 22) / 100), aliquotaEfetiva: rand(9, 22), recomendado: false },
  ];
  const menor = regimes.reduce((a, b) => (a.cargaTotal < b.cargaTotal ? a : b));
  menor.recomendado = true;

  const score: ScoreFiscal = {
    regimeIdeal: Math.round(rand(15, 25)),
    creditos: Math.round(rand(8, 20)),
    riscoFiscal: Math.round(rand(10, 20)),
    compliance: Math.round(rand(12, 20)),
    historico: Math.round(rand(8, 15)),
    total: 0,
  };
  score.total = score.regimeIdeal + score.creditos + score.riscoFiscal + score.compliance + score.historico;

  const teses: Tese[] = [
    {
      id: "t1",
      titulo: "Exclusão do ICMS da base de PIS/COFINS",
      fundamento: "STF RE 574.706 — Tema 69",
      exitoEstimado: 95,
      valorEstimado: faturamento * 0.018,
      prazo: "5 anos retroativos",
      status: "aplicavel",
    },
    {
      id: "t2",
      titulo: "Restituição de ICMS-ST por base presumida maior",
      fundamento: "STJ REsp 1.168.625",
      exitoEstimado: 82,
      valorEstimado: faturamento * 0.011,
      prazo: "5 anos retroativos",
      status: "aplicavel",
    },
    {
      id: "t3",
      titulo: "Créditos de PIS/COFINS sobre insumos essenciais",
      fundamento: "STJ REsp 1.221.170 — Tema 779",
      exitoEstimado: 78,
      valorEstimado: faturamento * 0.009,
      prazo: "5 anos retroativos",
      status: "em_analise",
    },
    {
      id: "t4",
      titulo: "Exclusão de verbas indenizatórias do INSS",
      fundamento: "CARF + STJ Tema 985",
      exitoEstimado: 65,
      valorEstimado: faturamento * 0.006,
      prazo: "5 anos retroativos",
      status: "identificada",
    },
    {
      id: "t5",
      titulo: "GILRAT — revisão do FAP",
      fundamento: "STF RE 343.446",
      exitoEstimado: 70,
      valorEstimado: faturamento * 0.004,
      prazo: "5 anos retroativos",
      status: "identificada",
    },
  ];

  const alertas: Alerta[] = [
    { id: "a1", categoria: "oportunidade", severidade: "alta",
      titulo: "Migração de regime pode reduzir carga em até 28%",
      descricao: `Análise indica que ${menor.regime} pode reduzir tributos anuais.` },
    { id: "a2", categoria: "risco", severidade: "media",
      titulo: "Divergência potencial em CFOP de saída",
      descricao: "Padrão de notas sugere reclassificação de operações para evitar autuação." },
    { id: "a3", categoria: "legislacao", severidade: "media",
      titulo: "Reforma Tributária EC 132/2023 — adequação CBS/IBS",
      descricao: "Plano de transição recomendado iniciar em 2026 com simulações trimestrais." },
    { id: "a4", categoria: "compliance", severidade: "baixa",
      titulo: "EFD-Contribuições com 2 inconsistências menores",
      descricao: "Códigos de receita divergentes detectados em apurações recentes." },
  ];

  const cnaes = [
    "47.11-3-02 — Comércio varejista de mercadorias",
    "62.01-5-01 — Desenvolvimento de software sob encomenda",
    "10.91-1-02 — Fabricação de produtos de panificação",
    "46.46-0-01 — Comércio atacadista de cosméticos",
  ];
  const ufs = ["SP", "RJ", "MG", "PR", "RS", "SC", "BA"];
  const regs: EmpresaInfo["regime"][] = ["Simples Nacional", "Lucro Presumido", "Lucro Real"];

  const empresa: EmpresaInfo = {
    cnpj: formatCNPJ(d),
    razaoSocial: `Empresa Demonstrativa ${d.slice(0, 4)} LTDA`,
    nomeFantasia: `Demo ${d.slice(0, 4)}`,
    cnae: cnaes[Math.floor(rand(0, cnaes.length))],
    cnaeDescricao: "Atividade principal mockada",
    regime: regs[Math.floor(rand(0, regs.length))],
    uf: ufs[Math.floor(rand(0, ufs.length))],
    municipio: "São Paulo",
    capitalSocial: Math.round(rand(50_000, 2_000_000)),
    faturamentoAnual: faturamento,
    situacao: "ATIVA",
    abertura: "2014-03-12",
    porte: faturamento > 4_800_000 ? "Demais" : faturamento > 360_000 ? "EPP" : "ME",
  };

  const benchmark = {
    setor: empresa.cnae.split("—")[1]?.trim() || "Setor",
    percentil: Math.round(rand(35, 88)),
    mediaCargaSetor: rand(13, 19),
    cargaEmpresa: (menor.cargaTotal / faturamento) * 100,
  };

  return { empresa, score, regimes, teses, alertas, benchmark };
}

// ───────────────────────────── Page ─────────────────────────────

export default function RecuperacaoTributaria() {
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReturnType<typeof gerarAnalise> | null>(null);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const totalRecuperavel = useMemo(
    () => data?.teses.reduce((sum, t) => sum + t.valorEstimado * (t.exitoEstimado / 100), 0) ?? 0,
    [data]
  );

  const analisar = async () => {
    if (!isValidCNPJ(cnpj)) {
      toast.error("CNPJ inválido");
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setData(gerarAnalise(cnpj));
    setLoading(false);
    toast.success("Análise tributária concluída");
  };

  const limpar = () => {
    setData(null);
    setCnpj("");
    setChat([]);
    toast.info("Análise removida");
  };

  const exportarRelatorio = () => {
    if (!data) return;
    const linhas = [
      `Relatório de Recuperação Tributária`,
      `Empresa: ${data.empresa.razaoSocial}`,
      `CNPJ: ${data.empresa.cnpj}`,
      `Regime atual: ${data.empresa.regime}`,
      `Faturamento anual estimado: ${brl(data.empresa.faturamentoAnual)}`,
      ``,
      `Score Fiscal: ${data.score.total}/100`,
      `Total potencial recuperável (ponderado): ${brl(totalRecuperavel)}`,
      ``,
      `Teses identificadas:`,
      ...data.teses.map(t => `- ${t.titulo} | êxito ${t.exitoEstimado}% | est. ${brl(t.valorEstimado)} | ${t.fundamento}`),
      ``,
      `Alertas:`,
      ...data.alertas.map(a => `- [${a.severidade.toUpperCase()}] ${a.titulo}: ${a.descricao}`),
    ].join("\n");
    const blob = new Blob([linhas], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recuperacao-tributaria-${onlyDigits(data.empresa.cnpj)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  };

  const enviarChat = async () => {
    const pergunta = chatInput.trim();
    if (!pergunta) return;
    if (!data) {
      toast.error("Faça uma análise por CNPJ antes de conversar com o copiloto");
      return;
    }
    const novoChat = [...chat, { role: "user" as const, content: pergunta }];
    setChat(novoChat);
    setChatInput("");
    setChatLoading(true);

    const contexto = `
Você é um copiloto jurídico tributário brasileiro. Use a base normativa: CTN, leis fiscais federais/estaduais, jurisprudência STF/STJ/CARF/COSIT e Reforma Tributária EC 132/2023. Seja objetivo e cite fundamentos quando possível.

Contexto da empresa analisada:
- Razão social: ${data.empresa.razaoSocial}
- CNPJ: ${data.empresa.cnpj}
- Regime: ${data.empresa.regime}
- CNAE: ${data.empresa.cnae}
- UF: ${data.empresa.uf}
- Faturamento anual estimado: ${brl(data.empresa.faturamentoAnual)}
- Score fiscal: ${data.score.total}/100
- Teses aplicáveis: ${data.teses.map(t => t.titulo).join("; ")}
`.trim();

    try {
      const { data: resp, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: novoChat,
          system_prompt: contexto,
          stream: false,
          model: "google/gemini-2.5-flash",
        },
      });
      if (error) throw error;
      const content =
        resp?.choices?.[0]?.message?.content ||
        "Não foi possível gerar resposta no momento.";
      setChat([...novoChat, { role: "assistant", content }]);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao consultar o copiloto");
      setChat([
        ...novoChat,
        { role: "assistant", content: "Falha ao processar a consulta. Tente novamente em instantes." },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight">Recuperação Tributária IA</h1>
            <p className="text-sm text-muted-foreground">
              Análise inteligente por CNPJ — score fiscal, regimes, teses e copiloto jurídico
            </p>
          </div>
        </div>
        {data && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarRelatorio}>
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
            <Button variant="ghost" onClick={limpar}>
              <Trash2 className="w-4 h-4 mr-2" /> Limpar
            </Button>
          </div>
        )}
      </div>

      {/* CNPJ search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5" /> Consulta inteligente por CNPJ
          </CardTitle>
          <CardDescription>
            Informe o CNPJ para gerar análise tributária completa com IA. Dados demonstrativos para fins de avaliação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="cnpj" className="sr-only">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && analisar()}
                maxLength={18}
              />
            </div>
            <Button onClick={analisar} disabled={loading} className="sm:w-44">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? "Analisando..." : "Analisar com IA"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!data && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <FileSearch className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              Nenhuma análise gerada. Informe um CNPJ válido para começar.
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* Empresa overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5" /> {data.empresa.razaoSocial}
              </CardTitle>
              <CardDescription>{data.empresa.cnpj} · {data.empresa.municipio}/{data.empresa.uf}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-muted-foreground text-xs">Regime atual</div><div className="font-medium">{data.empresa.regime}</div></div>
              <div><div className="text-muted-foreground text-xs">Porte</div><div className="font-medium">{data.empresa.porte}</div></div>
              <div><div className="text-muted-foreground text-xs">CNAE</div><div className="font-medium truncate" title={data.empresa.cnae}>{data.empresa.cnae}</div></div>
              <div><div className="text-muted-foreground text-xs">Situação</div><Badge variant="secondary">{data.empresa.situacao}</Badge></div>
              <div><div className="text-muted-foreground text-xs">Capital social</div><div className="font-medium">{brl(data.empresa.capitalSocial)}</div></div>
              <div><div className="text-muted-foreground text-xs">Faturamento estimado</div><div className="font-medium">{brl(data.empresa.faturamentoAnual)}</div></div>
              <div><div className="text-muted-foreground text-xs">Abertura</div><div className="font-medium">{new Date(data.empresa.abertura).toLocaleDateString("pt-BR")}</div></div>
              <div><div className="text-muted-foreground text-xs">Potencial recuperável</div><div className="font-semibold text-primary">{brl(totalRecuperavel)}</div></div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="score" className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="score"><Gauge className="w-4 h-4 mr-2" />Score Fiscal</TabsTrigger>
              <TabsTrigger value="regimes"><Scale className="w-4 h-4 mr-2" />Comparador de Regimes</TabsTrigger>
              <TabsTrigger value="teses"><Sparkles className="w-4 h-4 mr-2" />Teses de Recuperação</TabsTrigger>
              <TabsTrigger value="benchmark"><BarChart3 className="w-4 h-4 mr-2" />Benchmark Setorial</TabsTrigger>
              <TabsTrigger value="alertas"><AlertTriangle className="w-4 h-4 mr-2" />Alertas</TabsTrigger>
              <TabsTrigger value="copiloto"><Bot className="w-4 h-4 mr-2" />Copiloto IA</TabsTrigger>
            </TabsList>

            {/* SCORE */}
            <TabsContent value="score">
              <div className="grid lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Score Fiscal</CardTitle>
                    <CardDescription>Avaliação consolidada 0–100</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <div className="text-6xl font-bold text-primary font-display">{data.score.total}</div>
                    <Progress value={data.score.total} className="h-3" />
                    <Badge variant={data.score.total > 75 ? "default" : data.score.total > 50 ? "secondary" : "destructive"}>
                      {data.score.total > 75 ? "Excelente" : data.score.total > 50 ? "Adequado" : "Atenção"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Componentes do score</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "Regime ideal", value: data.score.regimeIdeal, max: 25 },
                      { label: "Aproveitamento de créditos", value: data.score.creditos, max: 20 },
                      { label: "Risco fiscal", value: data.score.riscoFiscal, max: 20 },
                      { label: "Compliance", value: data.score.compliance, max: 20 },
                      { label: "Histórico fiscal", value: data.score.historico, max: 15 },
                    ].map((c) => (
                      <div key={c.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{c.label}</span>
                          <span className="font-medium text-muted-foreground">{c.value}/{c.max}</span>
                        </div>
                        <Progress value={(c.value / c.max) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* REGIMES */}
            <TabsContent value="regimes">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparador de Regimes Tributários</CardTitle>
                  <CardDescription>Simulação anual sobre faturamento estimado de {brl(data.empresa.faturamentoAnual)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.regimes.map((r) => (
                    <div key={r.regime} className={`p-4 rounded-lg border ${r.recomendado ? "border-primary bg-primary/5" : ""}`}>
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{r.regime}</span>
                          {r.recomendado && <Badge><CheckCircle2 className="w-3 h-3 mr-1" />Recomendado</Badge>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Carga anual estimada</div>
                          <div className="font-bold text-lg">{brl(r.cargaTotal)}</div>
                          <div className="text-xs text-muted-foreground">Alíquota efetiva: {r.aliquotaEfetiva.toFixed(2)}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TESES */}
            <TabsContent value="teses">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Teses de Recuperação Identificadas</CardTitle>
                  <CardDescription>
                    Potencial total ponderado por probabilidade de êxito: <span className="font-semibold text-primary">{brl(totalRecuperavel)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.teses.map((t) => (
                    <div key={t.id} className="p-4 rounded-lg border space-y-2">
                      <div className="flex justify-between items-start gap-3 flex-wrap">
                        <div>
                          <div className="font-semibold">{t.titulo}</div>
                          <div className="text-xs text-muted-foreground">{t.fundamento} · {t.prazo}</div>
                        </div>
                        <Badge variant={t.status === "aplicavel" ? "default" : t.status === "em_analise" ? "secondary" : "outline"}>
                          {t.status === "aplicavel" ? "Aplicável" : t.status === "em_analise" ? "Em análise" : "Identificada"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-muted-foreground">Êxito estimado</div>
                          <div className="font-medium">{t.exitoEstimado}%</div>
                          <Progress value={t.exitoEstimado} className="h-1.5 mt-1" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Valor estimado</div>
                          <div className="font-medium">{brl(t.valorEstimado)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Esperado ponderado</div>
                          <div className="font-medium text-primary">{brl(t.valorEstimado * t.exitoEstimado / 100)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* BENCHMARK */}
            <TabsContent value="benchmark">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Benchmark Setorial</CardTitle>
                  <CardDescription>Comparação com empresas similares no Brasil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border">
                      <div className="text-xs text-muted-foreground">Setor</div>
                      <div className="font-semibold">{data.benchmark.setor}</div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="text-xs text-muted-foreground">Carga média do setor</div>
                      <div className="font-semibold">{data.benchmark.mediaCargaSetor.toFixed(2)}%</div>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="text-xs text-muted-foreground">Sua carga estimada (ideal)</div>
                      <div className="font-semibold">{data.benchmark.cargaEmpresa.toFixed(2)}%</div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Percentil de eficiência tributária</span>
                      <span className="font-medium">{data.benchmark.percentil}º percentil</span>
                    </div>
                    <Progress value={data.benchmark.percentil} className="h-3" />
                  </div>
                  <Alert>
                    <TrendingUp className="w-4 h-4" />
                    <AlertTitle>Insight</AlertTitle>
                    <AlertDescription>
                      {data.benchmark.percentil > 60
                        ? "Sua empresa está acima da média de eficiência tributária do setor."
                        : "Há espaço para otimização — veja as teses e o regime recomendado."}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ALERTAS */}
            <TabsContent value="alertas">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertas Inteligentes</CardTitle>
                  <CardDescription>Riscos, oportunidades e atualizações de legislação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.alertas.map((a) => (
                    <Alert key={a.id} variant={a.severidade === "alta" ? "destructive" : "default"}>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertTitle className="flex items-center gap-2">
                        {a.titulo}
                        <Badge variant="outline" className="text-[10px] uppercase">{a.categoria}</Badge>
                      </AlertTitle>
                      <AlertDescription>{a.descricao}</AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* COPILOTO */}
            <TabsContent value="copiloto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Bot className="w-5 h-5" /> Copiloto Jurídico Tributário
                  </CardTitle>
                  <CardDescription>
                    Tira-dúvidas com base no contexto da empresa, jurisprudência (STF/STJ/CARF) e Reforma Tributária.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ScrollArea className="h-80 border rounded-lg p-3" ref={chatScrollRef as any}>
                    {chat.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-8">
                        Faça uma pergunta sobre as teses, riscos ou oportunidades identificadas.
                      </div>
                    )}
                    <div className="space-y-3">
                      {chat.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                            m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}>
                            {m.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Pensando...
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Ex: como aplicar a tese da exclusão do ICMS na base do PIS/COFINS?"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          enviarChat();
                        }
                      }}
                      rows={2}
                      className="resize-none"
                    />
                    <Button onClick={enviarChat} disabled={chatLoading || !chatInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}