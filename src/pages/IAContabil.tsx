import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Send, Sparkles, FileText, Calculator, Brain, Network, Plug, Cpu, Workflow } from "lucide-react";

const iaTools = [
  { nome: "Classificação Contábil", desc: "Classifica automaticamente lançamentos contábeis usando padrões e histórico", modelo: "IA Rápida", tipo: "Classificação", icon: FileText, endpoint: "ai-structured" },
  { nome: "Análise de Notas Fiscais", desc: "Lê e extrai dados de notas fiscais via OCR inteligente", modelo: "IA Multimodal", tipo: "OCR", icon: FileText, endpoint: "ai-structured" },
  { nome: "Cálculo Inteligente de Impostos", desc: "Calcula impostos considerando regime tributário e benefícios fiscais", modelo: "IA Premium", tipo: "Cálculo", icon: Calculator, endpoint: "ai-chat" },
  { nome: "Previsão Fiscal", desc: "Prevê obrigações e valores de impostos futuros com base em dados históricos", modelo: "IA Equilibrada", tipo: "Previsão", icon: Brain, endpoint: "ai-chat" },
  { nome: "Verificação de Erros", desc: "Detecta inconsistências em lançamentos, duplicidades e erros de classificação", modelo: "IA Rápida", tipo: "Auditoria", icon: Sparkles, endpoint: "ai-structured" },
  { nome: "Economia Tributária", desc: "Sugere oportunidades de economia fiscal com base no perfil do cliente", modelo: "IA Ultra", tipo: "Consultoria", icon: Calculator, endpoint: "ai-chat" },
];

const modelosDisp = [
  { nome: "GPT-5 (OpenAI)", key: "openai/gpt-5", desc: "Raciocínio avançado para cálculos complexos", status: "Automático", tier: "Premium" },
  { nome: "GPT-5 Mini", key: "openai/gpt-5-mini", desc: "Equilíbrio performance x custo", status: "Automático", tier: "Standard" },
  { nome: "GPT-5.2", key: "openai/gpt-5.2", desc: "Último modelo OpenAI", status: "Automático", tier: "Premium" },
  { nome: "Gemini 2.5 Pro", key: "google/gemini-2.5-pro", desc: "Multimodal, ideal para documentos", status: "Automático", tier: "Premium" },
  { nome: "Gemini 2.5 Flash", key: "google/gemini-2.5-flash", desc: "Multimodal equilibrado", status: "Automático", tier: "Standard" },
  { nome: "Gemini 3 Flash", key: "google/gemini-3-flash-preview", desc: "Rápido para classificações", status: "Automático", tier: "Fast" },
  { nome: "Gemini 3.1 Pro", key: "google/gemini-3.1-pro-preview", desc: "Última geração Google", status: "Automático", tier: "Premium" },
  { nome: "GPT-5 Nano", key: "openai/gpt-5-nano", desc: "Ultra rápido e econômico", status: "Automático", tier: "Fast" },
  { nome: "Gemini 2.5 Flash Lite", key: "google/gemini-2.5-flash-lite", desc: "Mais rápido e barato", status: "Automático", tier: "Fast" },
];

const integrations = [
  { nome: "Lovable AI Gateway", desc: "Chat, classificação, análise — todos os modelos via gateway unificado", status: "Ativo", icon: Cpu, type: "LLM" },
  { nome: "MCP Proxy", desc: "Conecte servidores MCP externos para expandir as capacidades da IA", status: "Pronto", icon: Network, type: "MCP" },
  { nome: "Saída Estruturada (Tool Calling)", desc: "Extraia dados estruturados de textos, notas fiscais e documentos", status: "Ativo", icon: Workflow, type: "LLM" },
  { nome: "Geração de Imagens", desc: "Gemini 3 Pro Image — geração de gráficos, relatórios visuais", status: "Disponível", icon: Sparkles, type: "Generativa" },
  { nome: "APIs Externas (OpenAI/Google direto)", desc: "Use suas próprias chaves API para acesso direto (opcional)", status: "Configurável", icon: Plug, type: "LLM" },
];

const tierColors: Record<string, string> = {
  Premium: "border-amber-500 text-amber-600",
  Standard: "border-blue-500 text-blue-600",
  Fast: "border-green-500 text-green-600",
};

export default function IAContabil() {
  const navigate = useNavigate();

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" /> IA Contábil
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Inteligência artificial aplicada à contabilidade</p>
        </div>
        <Button onClick={() => navigate("/ia-chat")} className="gap-2"><Send className="w-4 h-4" /> Abrir Chat IA</Button>
      </div>

      <Tabs defaultValue="ferramentas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ferramentas">Ferramentas IA</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="ferramentas">
          <div className="grid md:grid-cols-2 gap-4">
            {iaTools.map(tool => (
              <Card key={tool.nome} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm font-display">{tool.nome}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{tool.tipo}</Badge>
                        <span className="text-[10px] text-muted-foreground">{tool.modelo}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{tool.endpoint}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="modelos">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Modelos de IA Integrados</CardTitle>
              <CardDescription>Todos os modelos são fornecidos automaticamente via Lovable AI — sem necessidade de chave API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {modelosDisp.map(m => (
                <div key={m.key} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{m.nome}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono hidden sm:block">{m.key}</code>
                    <Badge variant="outline" className={`text-[10px] ${tierColors[m.tier] || ""}`}>{m.tier}</Badge>
                    <Badge className="text-[10px]">{m.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Infraestrutura de IA</CardTitle>
                <CardDescription>Caminhos prontos para integração com LLMs, MCP e IA generativa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {integrations.map(i => (
                  <div key={i.nome} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <i.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{i.nome}</p>
                        <p className="text-xs text-muted-foreground">{i.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{i.type}</Badge>
                      <Badge
                        variant={i.status === "Ativo" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {i.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Edge Functions Disponíveis</CardTitle>
                <CardDescription>Endpoints de IA prontos para uso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { fn: "ai-chat", desc: "Chat com streaming SSE, suporte a múltiplos modelos, reasoning", method: "POST", stream: true },
                  { fn: "ai-structured", desc: "Saída estruturada via tool calling — classificação, extração, parsing", method: "POST", stream: false },
                  { fn: "mcp-proxy", desc: "Proxy para servidores MCP externos (JSON-RPC over HTTP)", method: "POST", stream: false },
                ].map(f => (
                  <div key={f.fn} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">{f.fn}</code>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{f.method}</Badge>
                      {f.stream && <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">Stream</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display">Como Integrar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                  <p className="font-semibold text-xs">1. Chat com IA (streaming)</p>
                  <code className="text-[10px] block bg-muted p-2 rounded font-mono">
                    POST /functions/v1/ai-chat {'{'} messages, model?, reasoning? {'}'}
                  </code>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                  <p className="font-semibold text-xs">2. Saída Estruturada</p>
                  <code className="text-[10px] block bg-muted p-2 rounded font-mono">
                    POST /functions/v1/ai-structured {'{'} prompt, tool_schema, model? {'}'}
                  </code>
                </div>
                <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
                  <p className="font-semibold text-xs">3. MCP Proxy</p>
                  <code className="text-[10px] block bg-muted p-2 rounded font-mono">
                    POST /functions/v1/mcp-proxy {'{'} mcp_server_url, jsonrpc_payload {'}'}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
