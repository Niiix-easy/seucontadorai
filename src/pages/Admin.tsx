import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, Shield, Bot, Key, Settings, Users, Activity } from "lucide-react";
import { toast } from "sonner";

type ApiConfig = { name: string; key: string; enabled: boolean; description: string; category: string };

const defaultApis: ApiConfig[] = [
  { name: "OpenAI (GPT-5)", key: "", enabled: true, description: "IA para análise fiscal, consultoria e automação contábil", category: "IA" },
  { name: "Google Gemini Pro", key: "", enabled: true, description: "Processamento multimodal de documentos e notas fiscais", category: "IA" },
  { name: "Google Gemini Flash", key: "", enabled: true, description: "Respostas rápidas para classificação e resumos", category: "IA" },
  { name: "SEFAZ API", key: "", enabled: false, description: "Integração com Secretaria da Fazenda para NF-e e NFS-e", category: "Governo" },
  { name: "Banco Central API", key: "", enabled: false, description: "Consulta de taxas, câmbio e dados econômicos", category: "Financeiro" },
  { name: "Serpro (e-CAC)", key: "", enabled: false, description: "Consulta de situação fiscal e certidões", category: "Governo" },
  { name: "WhatsApp Business", key: "", enabled: false, description: "Envio de notificações e comunicação com clientes", category: "Comunicação" },
  { name: "Email SMTP", key: "", enabled: false, description: "Envio de emails transacionais e relatórios", category: "Comunicação" },
  { name: "Stripe Pagamentos", key: "", enabled: false, description: "Cobrança de honorários e assinaturas", category: "Financeiro" },
];

export default function Admin() {
  const [apis, setApis] = useState<ApiConfig[]>(defaultApis);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (name: string) => {
    setVisibleKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const updateApi = (index: number, updates: Partial<ApiConfig>) => {
    setApis(prev => prev.map((api, i) => i === index ? { ...api, ...updates } : api));
  };

  const saveConfig = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  const categories = [...new Set(apis.map(a => a.category))];

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Painel Administrativo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie APIs, usuários e configurações do sistema</p>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="apis" className="gap-2"><Key className="w-3.5 h-3.5" /> APIs</TabsTrigger>
          <TabsTrigger value="ia" className="gap-2"><Bot className="w-3.5 h-3.5" /> IA</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="w-3.5 h-3.5" /> Usuários</TabsTrigger>
          <TabsTrigger value="system" className="gap-2"><Settings className="w-3.5 h-3.5" /> Sistema</TabsTrigger>
        </TabsList>

        {/* APIs Tab */}
        <TabsContent value="apis" className="space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                <Badge variant="outline">{cat}</Badge>
              </h3>
              <div className="grid gap-4">
                {apis.map((api, idx) => api.category === cat && (
                  <Card key={api.name} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-display">{api.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{api.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={api.enabled ? "default" : "secondary"} className="text-[10px]">
                            {api.enabled ? "Ativo" : "Inativo"}
                          </Badge>
                          <Switch checked={api.enabled} onCheckedChange={v => updateApi(idx, { enabled: v })} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={visibleKeys[api.name] ? "text" : "password"}
                            placeholder="Cole a chave da API aqui..."
                            value={api.key}
                            onChange={e => updateApi(idx, { key: e.target.value })}
                            className="pr-10 font-mono text-xs"
                          />
                          <button
                            onClick={() => toggleKeyVisibility(api.name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {visibleKeys[api.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={saveConfig} className="gap-2">
            <Save className="w-4 h-4" /> Salvar configurações
          </Button>
        </TabsContent>

        {/* IA Tab */}
        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Modelos de IA Disponíveis</CardTitle>
              <CardDescription>Configure os modelos de inteligência artificial integrados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { model: "GPT-5 (OpenAI)", status: "Ativo", usage: "1.247 chamadas/mês", cost: "R$ 89,30" },
                { model: "GPT-5 Mini", status: "Ativo", usage: "3.891 chamadas/mês", cost: "R$ 45,20" },
                { model: "Gemini 2.5 Pro", status: "Ativo", usage: "2.156 chamadas/mês", cost: "R$ 62,50" },
                { model: "Gemini 3 Flash", status: "Ativo", usage: "8.432 chamadas/mês", cost: "R$ 28,70" },
                { model: "Gemini 2.5 Flash Lite", status: "Inativo", usage: "0 chamadas/mês", cost: "R$ 0,00" },
              ].map(ai => (
                <div key={ai.model} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{ai.model}</p>
                      <p className="text-xs text-muted-foreground">{ai.usage}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono">{ai.cost}</span>
                    <Badge variant={ai.status === "Ativo" ? "default" : "secondary"} className="text-[10px]">{ai.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Configurações de IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Modelo padrão para chat</Label>
                  <p className="text-xs text-muted-foreground">Modelo usado no assistente de IA</p>
                </div>
                <Badge>Gemini 3 Flash</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-classificação de documentos</Label>
                  <p className="text-xs text-muted-foreground">Classificar documentos automaticamente com IA</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Sugestões inteligentes</Label>
                  <p className="text-xs text-muted-foreground">IA sugere lançamentos e classificações</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Gestão de Usuários</CardTitle>
              <CardDescription>Gerencie os usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Admin Principal", email: "admin@escritorio.com", role: "admin", status: "Ativo" },
                  { name: "Maria Silva", email: "maria@escritorio.com", role: "contador", status: "Ativo" },
                  { name: "João Santos", email: "joao@escritorio.com", role: "auxiliar", status: "Ativo" },
                ].map(u => (
                  <div key={u.email} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">{u.role}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{u.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Backend (Lovable Cloud)", status: "Online", icon: Activity },
                { label: "Banco de Dados", status: "Online", icon: Activity },
                { label: "IA Gateway", status: "Online", icon: Bot },
                { label: "Storage", status: "Online", icon: Activity },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <s.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm">{s.label}</span>
                  </div>
                  <Badge className="bg-success text-success-foreground text-[10px]">{s.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
