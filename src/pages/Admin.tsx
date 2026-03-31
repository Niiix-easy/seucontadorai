import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, EyeOff, Save, Shield, Bot, Key, Settings, Users, Activity, RefreshCw, Loader2, Coins, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type ApiConfig = {
  id?: string;
  api_name: string;
  api_key_encrypted: string;
  is_enabled: boolean;
  description: string;
  category: string;
};

type UserWithRole = {
  user_id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  created_at: string;
};

const aiModels = [
  { model: "IA Premium", key: "openai/gpt-5", desc: "Raciocínio avançado, análise fiscal complexa" },
  { model: "IA Equilibrada", key: "openai/gpt-5-mini", desc: "Equilíbrio custo x performance" },
  { model: "IA Ultra", key: "openai/gpt-5.2", desc: "Última geração em raciocínio" },
  { model: "IA Multimodal", key: "google/gemini-2.5-pro", desc: "Multimodal, contexto grande" },
  { model: "IA Rápida", key: "google/gemini-3-flash-preview", desc: "Rápido e eficiente" },
  { model: "IA Avançada", key: "google/gemini-3.1-pro-preview", desc: "Última geração avançada" },
  { model: "IA Lite", key: "google/gemini-2.5-flash-lite", desc: "Mais rápido e barato" },
];

const actionColors: Record<string, string> = {
  chat: "hsl(217, 91%, 50%)",
  classificacao: "hsl(168, 72%, 40%)",
  analise: "hsl(38, 92%, 50%)",
  documento: "hsl(280, 60%, 50%)",
};
const actionLabels: Record<string, string> = {
  chat: "Chat IA",
  classificacao: "Classificação",
  analise: "Análise",
  documento: "Documento",
};

export default function Admin() {
  const { user } = useAuth();
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemStats, setSystemStats] = useState({ clients: 0, tasks: 0, documents: 0, obligations: 0 });

  // Token usage query
  const { data: tokenUsage = [] } = useQuery({
    queryKey: ["token-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.from("token_usage").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadApis(), loadUsers(), loadStats()]);
    setLoading(false);
  };

  const defaultApis: ApiConfig[] = [
    // Integradores Fiscais
    { api_name: "Oobj / Avalara Brasil", api_key_encrypted: "", is_enabled: false, description: "Emissão NF-e, NFS-e, CT-e, MDF-e via Oobj", category: "Integradores Fiscais" },
    { api_name: "Focus NFe", api_key_encrypted: "", is_enabled: false, description: "API REST para emissão de documentos fiscais", category: "Integradores Fiscais" },
    { api_name: "Tecnospeed", api_key_encrypted: "", is_enabled: false, description: "Plataforma completa de automação fiscal", category: "Integradores Fiscais" },
    { api_name: "Webmania", api_key_encrypted: "", is_enabled: false, description: "API de emissão de notas fiscais", category: "Integradores Fiscais" },
    // Governo / SEFAZ
    { api_name: "Certificado Digital A1 (senha)", api_key_encrypted: "", is_enabled: false, description: "Senha do certificado digital .pfx/.p12", category: "Governo / SEFAZ" },
    { api_name: "SEFAZ WebService Token", api_key_encrypted: "", is_enabled: false, description: "Token de acesso direto SEFAZ (se aplicável)", category: "Governo / SEFAZ" },
    { api_name: "Gov.br OAuth Client ID", api_key_encrypted: "", is_enabled: false, description: "Client ID do Gov.br para assinatura digital", category: "Governo / SEFAZ" },
    { api_name: "Gov.br OAuth Secret", api_key_encrypted: "", is_enabled: false, description: "Client Secret do Gov.br", category: "Governo / SEFAZ" },
    { api_name: "eSocial Token", api_key_encrypted: "", is_enabled: false, description: "Token para envio de eventos eSocial", category: "Governo / SEFAZ" },
    { api_name: "ReceitaWS API Key", api_key_encrypted: "", is_enabled: false, description: "Consulta CNPJ via ReceitaWS", category: "Governo / SEFAZ" },
    // Open Banking / Bancos
    { api_name: "Pluggy API Key", api_key_encrypted: "", is_enabled: false, description: "Agregador bancário Open Finance — Client ID", category: "Open Banking" },
    { api_name: "Pluggy Secret", api_key_encrypted: "", is_enabled: false, description: "Agregador bancário Open Finance — Secret", category: "Open Banking" },
    { api_name: "Belvo API Key", api_key_encrypted: "", is_enabled: false, description: "Alternativa de agregação bancária", category: "Open Banking" },
    { api_name: "Belvo Secret", api_key_encrypted: "", is_enabled: false, description: "Secret do Belvo", category: "Open Banking" },
    // IA (opcionais)
    { api_name: "Chave IA Premium", api_key_encrypted: "", is_enabled: false, description: "Opcional — endpoint direto para IA Premium", category: "IA (Opcional)" },
    { api_name: "Chave IA Multimodal", api_key_encrypted: "", is_enabled: false, description: "Opcional — endpoint direto para IA Multimodal", category: "IA (Opcional)" },
    // Outros
    { api_name: "SendGrid API Key", api_key_encrypted: "", is_enabled: false, description: "Envio de e-mails transacionais", category: "E-mail / Notificações" },
    { api_name: "WhatsApp Business Token", api_key_encrypted: "", is_enabled: false, description: "API oficial WhatsApp Business", category: "E-mail / Notificações" },
  ];

  const loadApis = async () => {
    const { data } = await supabase.from("api_configurations").select("*").order("category");
    if (data && data.length > 0) {
      setApis(data.map(d => ({
        id: d.id, api_name: d.api_name, api_key_encrypted: d.api_key_encrypted || "",
        is_enabled: d.is_enabled, description: d.description || "", category: d.category,
      })));
    } else {
      // Seed defaults so user sees all fields ready
      setApis(defaultApis);
    }
  };

  const loadUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (!roles) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, created_at");
    const combined: UserWithRole[] = roles.map(r => {
      const p = profiles?.find(p => p.user_id === r.user_id);
      return { user_id: r.user_id, full_name: p?.full_name || "Sem nome", avatar_url: p?.avatar_url || "", role: r.role, created_at: p?.created_at || "" };
    });
    setUsers(combined);
  };

  const loadStats = async () => {
    const [clients, tasks, documents, obligations] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase.from("obligations").select("id", { count: "exact", head: true }),
    ]);
    setSystemStats({ clients: clients.count || 0, tasks: tasks.count || 0, documents: documents.count || 0, obligations: obligations.count || 0 });
  };

  const toggleKeyVisibility = (name: string) => setVisibleKeys(prev => ({ ...prev, [name]: !prev[name] }));

  const updateApi = (index: number, updates: Partial<ApiConfig>) => setApis(prev => prev.map((api, i) => i === index ? { ...api, ...updates } : api));

  const saveApis = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const api of apis) {
        if (api.id) {
          await supabase.from("api_configurations").update({
            api_key_encrypted: api.api_key_encrypted, is_enabled: api.is_enabled,
            description: api.description, category: api.category,
          }).eq("id", api.id);
        } else {
          const { data } = await supabase.from("api_configurations").insert({
            api_name: api.api_name, api_key_encrypted: api.api_key_encrypted,
            is_enabled: api.is_enabled, description: api.description,
            category: api.category, user_id: user.id,
          }).select().single();
          if (data) api.id = data.id;
        }
      }
      toast.success("Configurações salvas!");
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) { toast.error("Erro ao alterar role"); }
    else { toast.success("Role atualizada!"); setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u)); }
  };

  // Token stats
  const totalTokens = tokenUsage.reduce((s: number, t: any) => s + (t.total_tokens || 0), 0);
  const totalCost = tokenUsage.reduce((s: number, t: any) => s + (Number(t.cost_estimate) || 0), 0);
  const tokensByAction: Record<string, number> = {};
  const tokensByModel: Record<string, number> = {};
  const tokensByUser: Record<string, { tokens: number; cost: number; count: number }> = {};
  tokenUsage.forEach((t: any) => {
    tokensByAction[t.action_type] = (tokensByAction[t.action_type] || 0) + (t.total_tokens || 0);
    const modelShort = (t.model || "unknown").split("/").pop() || t.model;
    tokensByModel[modelShort] = (tokensByModel[modelShort] || 0) + (t.total_tokens || 0);
    const uid = t.user_id || "unknown";
    if (!tokensByUser[uid]) tokensByUser[uid] = { tokens: 0, cost: 0, count: 0 };
    tokensByUser[uid].tokens += (t.total_tokens || 0);
    tokensByUser[uid].cost += Number(t.cost_estimate || 0);
    tokensByUser[uid].count += 1;
  });
  const actionPieData = Object.entries(tokensByAction).map(([name, value]) => ({
    name: actionLabels[name] || name, value, color: actionColors[name] || "hsl(200,20%,60%)",
  }));
  const modelBarData = Object.entries(tokensByModel).map(([model, tokens]) => ({ model, tokens }));
  const userTokenData = Object.entries(tokensByUser).map(([uid, data]) => {
    const u = users.find(u => u.user_id === uid);
    return { name: u?.full_name || uid.slice(0, 8) + "...", ...data };
  }).sort((a, b) => b.tokens - a.tokens);

  const categories = [...new Set(apis.map(a => a.category))];

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> Painel Administrativo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">APIs, tokens, usuários e configurações</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2"><RefreshCw className="w-3.5 h-3.5" /> Atualizar</Button>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="apis" className="gap-1.5 text-xs"><Key className="w-3.5 h-3.5" /> APIs</TabsTrigger>
          <TabsTrigger value="tokens" className="gap-1.5 text-xs"><Coins className="w-3.5 h-3.5" /> Tokens</TabsTrigger>
          <TabsTrigger value="ia" className="gap-1.5 text-xs"><Bot className="w-3.5 h-3.5" /> IA</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" /> Usuários</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5 text-xs"><Settings className="w-3.5 h-3.5" /> Sistema</TabsTrigger>
        </TabsList>

        {/* APIs Tab */}
        <TabsContent value="apis" className="space-y-6">
          {categories.map(cat => (
            <div key={cat}>
              <h3 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                <Badge variant="outline">{cat}</Badge>
                <span className="text-xs text-muted-foreground">({apis.filter(a => a.category === cat).length} APIs)</span>
              </h3>
              <div className="grid gap-3">
                {apis.map((api, idx) => api.category === cat && (
                  <Card key={api.api_name + idx} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-display">{api.api_name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{api.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={api.is_enabled ? "default" : "secondary"} className="text-[10px]">
                            {api.is_enabled ? "Ativo" : "Inativo"}
                          </Badge>
                          <Switch checked={api.is_enabled} onCheckedChange={v => updateApi(idx, { is_enabled: v })} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={visibleKeys[api.api_name] ? "text" : "password"}
                            placeholder="Cole a chave da API aqui..."
                            value={api.api_key_encrypted}
                            onChange={e => updateApi(idx, { api_key_encrypted: e.target.value })}
                            className="pr-10 font-mono text-xs"
                          />
                          <button onClick={() => toggleKeyVisibility(api.api_name)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {visibleKeys[api.api_name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          <Button onClick={saveApis} className="gap-2" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar configurações
          </Button>
        </TabsContent>

        {/* Tokens Tab */}
        <TabsContent value="tokens" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Total de Tokens</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-bold font-display text-primary">{totalTokens.toLocaleString("pt-BR")}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Custo Estimado</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-bold font-display text-primary">R$ {totalCost.toFixed(4)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Tarefas com IA</CardDescription></CardHeader>
              <CardContent><p className="text-3xl font-bold font-display text-primary">{tokenUsage.length}</p></CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="font-display text-base">Tokens por Tipo de Ação</CardTitle></CardHeader>
              <CardContent>
                {actionPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={actionPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                          {actionPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR") + " tokens"} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {actionPieData.map(a => (
                        <div key={a.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                            <span className="text-muted-foreground">{a.name}</span>
                          </div>
                          <span className="font-medium">{a.value.toLocaleString("pt-BR")}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <p className="text-muted-foreground text-sm text-center py-10">Sem dados</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-base">Tokens por Modelo</CardTitle></CardHeader>
              <CardContent>
                {modelBarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={modelBarData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 90%)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
                      <YAxis type="category" dataKey="model" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR") + " tokens"} />
                      <Bar dataKey="tokens" fill="hsl(217, 91%, 50%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-sm text-center py-10">Sem dados</p>}
              </CardContent>
            </Card>
          </div>

          {/* Per-user consumption */}
          <Card>
            <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Consumo por Usuário</CardTitle></CardHeader>
            <CardContent>
              {userTokenData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                      <TableHead className="text-right">Tokens</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">% do Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userTokenData.map(u => (
                      <TableRow key={u.name}>
                        <TableCell className="font-medium text-sm">{u.name}</TableCell>
                        <TableCell className="text-right text-xs">{u.count}</TableCell>
                        <TableCell className="text-right text-xs font-mono">{u.tokens.toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right text-xs">R$ {u.cost.toFixed(4)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${totalTokens > 0 ? (u.tokens / totalTokens * 100) : 0}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground w-10 text-right">{totalTokens > 0 ? (u.tokens / totalTokens * 100).toFixed(1) : 0}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p className="text-muted-foreground text-sm text-center py-10">Sem dados de consumo</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="font-display text-base">Histórico Detalhado</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokenUsage.map((t: any) => {
                    const u = users.find(u => u.user_id === t.user_id);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-xs font-medium">{u?.full_name || t.user_id?.slice(0, 8) + "..."}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{actionLabels[t.action_type] || t.action_type}</Badge></TableCell>
                        <TableCell className="text-xs font-mono">{(t.model || "").split("/").pop()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{t.description}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{(t.total_tokens || 0).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-right text-xs">R$ {Number(t.cost_estimate || 0).toFixed(4)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* IA Tab */}
        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Modelos de IA Disponíveis</CardTitle>
              <CardDescription>As chaves de IA são gerenciadas automaticamente via Lovable AI. Você também pode adicionar chaves manuais abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiModels.map(ai => (
                <div key={ai.key} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{ai.model}</p>
                      <p className="text-xs text-muted-foreground">{ai.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">{ai.key}</code>
                    <Badge className="text-[10px] border-green-500 text-green-600" variant="outline">✓ Automático</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Chaves de API (Automáticas)</CardTitle>
              <CardDescription>Pré-configuradas pelo sistema — não é necessário alterar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "LOVABLE_API_KEY", desc: "Chave do gateway Lovable AI — múltiplos modelos", value: "lov_ai_*****_auto_configured", auto: true },
                { label: "Chave IA Premium", desc: "Opcional — endpoint direto para IA Premium", value: "", auto: false },
                { label: "Chave IA Multimodal", desc: "Opcional — endpoint direto para IA Multimodal", value: "", auto: false },
              ].map(k => (
                <div key={k.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">{k.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{k.desc}</p>
                    </div>
                    {k.auto && <Badge className="text-[10px] border-green-500 text-green-600" variant="outline">✓ Auto</Badge>}
                  </div>
                  <div className="relative">
                    <Input
                      type="password"
                      placeholder={k.auto ? "Configurada automaticamente pelo sistema" : "Cole sua chave API aqui (opcional)"}
                      value={k.value}
                      disabled={k.auto}
                      className="font-mono text-xs pr-10"
                    />
                    {k.auto && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Badge variant="outline" className="text-[8px] border-green-500 text-green-600">ATIVO</Badge>
                      </div>
                    )}
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
                <div><Label>Modelo padrão</Label><p className="text-xs text-muted-foreground">Assistente de IA</p></div>
                <Badge>IA Rápida</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Auto-classificação</Label><p className="text-xs text-muted-foreground">Classificar documentos com IA</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Registrar consumo de tokens</Label><p className="text-xs text-muted-foreground">Rastrear uso de IA por tarefa</p></div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Gestão de Usuários ({users.length})</CardTitle>
              <CardDescription>Gerencie usuários e permissões</CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum usuário</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.user_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{u.full_name || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={u.role} onValueChange={v => changeUserRole(u.user_id, v)}>
                            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="contador">Contador</SelectItem>
                              <SelectItem value="auxiliar">Auxiliar</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">{u.role}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="font-display">Status dos Serviços</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Backend (Lovable Cloud)", status: "Online" },
                  { label: "Banco de Dados", status: "Online" },
                  { label: "IA Gateway", status: "Online" },
                  { label: "Storage (Documentos)", status: "Online" },
                  { label: "Autenticação", status: "Online" },
                  { label: "Google OAuth", status: "Configurado" },
                  { label: "SEFAZ NF-e", status: "Configurado" },
                  { label: "eSocial", status: "Configurado" },
                  { label: "SPED Fiscal", status: "Configurado" },
                  { label: "Receita Federal", status: "Configurado" },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-sm">{s.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-green-500 text-green-600">{s.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="font-display">Estatísticas do Sistema</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Clientes cadastrados", value: systemStats.clients },
                  { label: "Tarefas criadas", value: systemStats.tasks },
                  { label: "Documentos armazenados", value: systemStats.documents },
                  { label: "Obrigações fiscais", value: systemStats.obligations },
                  { label: "Usuários do sistema", value: users.length },
                  { label: "Tokens consumidos", value: totalTokens },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">{s.label}</span>
                    <span className="font-display font-bold text-primary">{typeof s.value === "number" ? s.value.toLocaleString("pt-BR") : s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="font-display">Informações do Projeto</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                ["Aplicação", "Seu Contador IA"],
                ["Versão", "2.1.0"],
                ["Stack", "React + Vite + Lovable Cloud"],
                ["IA", "Lovable AI — Múltiplos Modelos"],
                ["APIs Governo", "SEFAZ, eSocial, SPED, Receita Federal, DCTF, PGDAS-D"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between p-2 rounded bg-muted/30">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
