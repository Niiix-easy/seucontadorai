import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Send, Sparkles, FileText, Calculator, Brain, Loader2 } from "lucide-react";

const iaTools = [
  { nome: "Classificação Contábil", desc: "Classifica automaticamente lançamentos contábeis usando padrões e histórico", modelo: "Gemini 3 Flash", tipo: "Classificação", icon: FileText },
  { nome: "Análise de Notas Fiscais", desc: "Lê e extrai dados de notas fiscais via OCR inteligente", modelo: "Gemini 2.5 Pro", tipo: "OCR", icon: FileText },
  { nome: "Cálculo Inteligente de Impostos", desc: "Calcula impostos considerando regime tributário e benefícios fiscais", modelo: "GPT-5", tipo: "Cálculo", icon: Calculator },
  { nome: "Previsão Fiscal", desc: "Prevê obrigações e valores de impostos futuros com base em dados históricos", modelo: "GPT-5 Mini", tipo: "Previsão", icon: Brain },
  { nome: "Verificação de Erros", desc: "Detecta inconsistências em lançamentos, duplicidades e erros de classificação", modelo: "Gemini 3 Flash", tipo: "Auditoria", icon: Sparkles },
  { nome: "Economia Tributária", desc: "Sugere oportunidades de economia fiscal com base no perfil do cliente", modelo: "GPT-5.2", tipo: "Consultoria", icon: Calculator },
];

const modelosDisp = [
  { nome: "GPT-5 (OpenAI)", key: "openai/gpt-5", desc: "Raciocínio avançado para cálculos complexos", status: "Automático" },
  { nome: "GPT-5 Mini", key: "openai/gpt-5-mini", desc: "Equilíbrio performance x custo", status: "Automático" },
  { nome: "GPT-5.2", key: "openai/gpt-5.2", desc: "Último modelo OpenAI", status: "Automático" },
  { nome: "Gemini 2.5 Pro", key: "google/gemini-2.5-pro", desc: "Multimodal, ideal para documentos", status: "Automático" },
  { nome: "Gemini 3 Flash", key: "google/gemini-3-flash-preview", desc: "Rápido para classificações", status: "Automático" },
  { nome: "Gemini 3.1 Pro", key: "google/gemini-3.1-pro-preview", desc: "Última geração Google", status: "Automático" },
];

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
          <TabsTrigger value="modelos">Modelos Disponíveis</TabsTrigger>
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
                    <div>
                      <CardTitle className="text-sm font-display">{tool.nome}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{tool.tipo}</Badge>
                        <span className="text-[10px] text-muted-foreground">{tool.modelo}</span>
                      </div>
                    </div>
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
                  <div className="flex items-center gap-3">
                    <code className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{m.key}</code>
                    <Badge className="text-[10px]">{m.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
