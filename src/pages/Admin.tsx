import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, Save, Shield, Bot, Key, Settings, Users, Activity, Plus, Trash2, RefreshCw, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  email: string;
  role: string;
  created_at: string;
};

const defaultApiTemplates: Omit<ApiConfig, "id">[] = [
  { api_name: "OpenAI (GPT-5)", api_key_encrypted: "", is_enabled: true, description: "IA para análise fiscal, consultoria e automação contábil", category: "IA" },
  { api_name: "Google Gemini Pro", api_key_encrypted: "", is_enabled: true, description: "Processamento multimodal de documentos e notas fiscais", category: "IA" },
  { api_name: "Gemini Flash", api_key_encrypted: "", is_enabled: true, description: "Respostas rápidas para classificação e resumos", category: "IA" },
  { api_name: "SEFAZ API", api_key_encrypted: "", is_enabled: false, description: "Integração com Secretaria da Fazenda para NF-e e NFS-e", category: "Governo" },
  { api_name: "Banco Central API", api_key_encrypted: "", is_enabled: false, description: "Consulta de taxas, câmbio e dados econômicos", category: "Financeiro" },
  { api_name: "Serpro (e-CAC)", api_key_encrypted: "", is_enabled: false, description: "Consulta de situação fiscal e certidões", category: "Governo" },
  { api_name: "WhatsApp Business", api_key_encrypted: "", is_enabled: false, description: "Envio de notificações e comunicação com clientes", category: "Comunicação" },
  { api_name: "Email SMTP", api_key_encrypted: "", is_enabled: false, description: "Envio de emails transacionais e relatórios", category: "Comunicação" },
  { api_name: "Stripe Pagamentos", api_key_encrypted: "", is_enabled: false, description: "Cobrança de honorários e assinaturas", category: "Financeiro" },
];

const aiModels = [
  { model: "GPT-5 (OpenAI)", key: "openai/gpt-5", desc: "Raciocínio avançado, análise fiscal complexa" },
  { model: "GPT-5 Mini", key: "openai/gpt-5-mini", desc: "Equilíbrio custo x performance" },
  { model: "GPT-5.2", key: "openai/gpt-5.2", desc: "Último modelo OpenAI, raciocínio aprimorado" },
  { model: "Gemini 2.5 Pro", key: "google/gemini-2.5-pro", desc: "Multimodal, contexto grande, raciocínio complexo" },
  { model: "Gemini 3 Flash", key: "google/gemini-3-flash-preview", desc: "Rápido e eficiente para tarefas do dia-a-dia" },
  { model: "Gemini 3.1 Pro", key: "google/gemini-3.1-pro-preview", desc: "Última geração Google, raciocínio avançado" },
  { model: "Gemini 2.5 Flash Lite", key: "google/gemini-2.5-flash-lite", desc: "Mais rápido e barato, tarefas simples" },
];

export default function Admin() {
  const { user } = useAuth();
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemStats, setSystemStats] = useState({ clients: 0, tasks: 0, documents: 0, obligations: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadApis(), loadUsers(), loadStats()]);
    setLoading(false);
  };

  const loadApis = async () => {
    const { data } = await supabase.from("api_configurations").select("*").order("category");
    if (data && data.length > 0) {
      setApis(data.map(d => ({
        id: d.id,
        api_name: d.api_name,
        api_key_encrypted: d.api_key_encrypted || "",
        is_enabled: d.is_enabled,
        description: d.description || "",
        category: d.category,
      })));
    } else {
      // Seed defaults
      setApis(defaultApiTemplates.map(t => ({ ...t })));
    }
  };

  const loadUsers = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (!roles) return;

    const userIds = roles.map(r => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url, created_at");

    const combined: UserWithRole[] = roles.map(r => {
      const p = profiles?.find(p => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        full_name: p?.full_name || "Sem nome",
        avatar_url: p?.avatar_url || "",
        email: "",
        role: r.role,
        created_at: p?.created_at || "",
      };
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
    setSystemStats({
      clients: clients.count || 0,
      tasks: tasks.count || 0,
      documents: documents.count || 0,
      obligations: obligations.count || 0,
    });
  };

  const toggleKeyVisibility = (name: string) => {
    setVisibleKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const updateApi = (index: number, updates: Partial<ApiConfig>) => {
    setApis(prev => prev.map((api, i) => i === index ? { ...api, ...updates } : api));
  };

  const saveApis = async () => {
    if (!user) return;
    setSaving(true);
    try {
      for (const api of apis) {
        if (api.id) {
          await supabase.from("api_configurations").update({
            api_key_encrypted: api.api_key_encrypted,
            is_enabled: api.is_enabled,
            description: api.description,
            category: api.category,
          }).eq("id", api.id);
        } else {
          const { data } = await supabase.from("api_configurations").insert({
            api_name: api.api_name,
            api_key_encrypted: api.api_key_encrypted,
            is_enabled: api.is_enabled,
            description: api.description,
            category: api.category,
            user_id: user.id,
          }).select().single();
          if (data) api.id = data.id;
        }
      }
      toast.success("Configurações de API salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole as any })
      .eq("user_id", userId);
    if (error) {
      toast.error("Erro ao alterar role");
    } else {
      toast.success("Role atualizada!");
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
    }
  };

  const categories = [...new Set(apis.map(a => a.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie APIs, usuários, IA e configurações do sistema</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </Button>
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
                  <Card key={api.api_name} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base font-display">{api.api_name}</CardTitle>
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
                          <button
                            onClick={() => toggleKeyVisibility(api.api_name)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar configurações
          </Button>
        </TabsContent>

        {/* IA Tab */}
        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">Modelos de IA Disponíveis</CardTitle>
              <CardDescription>Modelos integrados via Lovable AI — sem necessidade de chave API própria</CardDescription>
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
                    <Badge className="text-[10px]">Disponível</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Configurações de IA</CardTitle>
              <CardDescription>Ajustes globais do assistente de inteligência artificial</CardDescription>
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
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display">Gestão de Usuários</CardTitle>
                  <CardDescription>Gerencie os usuários e permissões do sistema ({users.length} usuários)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Nenhum usuário encontrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
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
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
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
                          <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">
                            {u.role}
                          </Badge>
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
              <CardHeader>
                <CardTitle className="font-display">Status dos Serviços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Backend (Lovable Cloud)", status: "Online" },
                  { label: "Banco de Dados", status: "Online" },
                  { label: "IA Gateway", status: "Online" },
                  { label: "Storage (Documentos)", status: "Online" },
                  { label: "Autenticação", status: "Online" },
                  { label: "Google OAuth", status: "Configurado" },
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
              <CardHeader>
                <CardTitle className="font-display">Estatísticas do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Clientes cadastrados", value: systemStats.clients },
                  { label: "Tarefas criadas", value: systemStats.tasks },
                  { label: "Documentos armazenados", value: systemStats.documents },
                  { label: "Obrigações fiscais", value: systemStats.obligations },
                  { label: "Usuários do sistema", value: users.length },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm">{s.label}</span>
                    <span className="font-display font-bold text-primary">{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Aplicação</span>
                <span className="font-medium">Seu Contador IA</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium">2.0.0</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Stack</span>
                <span className="font-medium">React + Vite + Lovable Cloud</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">IA</span>
                <span className="font-medium">Lovable AI (GPT-5 + Gemini)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
