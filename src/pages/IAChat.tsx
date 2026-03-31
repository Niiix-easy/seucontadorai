import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Loader2, Settings2, Plus, Trash2, Paperclip, X, FileText } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Attachment = {
  name: string;
  type: string;
  size: number;
  url?: string;
  textContent?: string;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const MODELS = [
  { key: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Rápido" },
  { key: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Avançado" },
  { key: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Multimodal" },
  { key: "openai/gpt-5", label: "GPT-5", desc: "Precisão" },
  { key: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Equilibrado" },
  { key: "openai/gpt-5.2", label: "GPT-5.2", desc: "Último OpenAI" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "text/plain", "text/csv", "text/xml", "application/json",
  "application/pdf", "application/xml",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png", "image/jpeg", "image/webp",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function IAChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-3-flash-preview");
  const [showSettings, setShowSettings] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_chat_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data && data.length > 0) {
      setMessages(data.map(d => ({ role: d.role as "user" | "assistant", content: d.content })));
    }
  };

  const saveMessage = async (role: string, content: string, model?: string) => {
    if (!user) return;
    await supabase.from("ai_chat_history").insert({
      user_id: user.id,
      role,
      content,
      model: model || selectedModel,
    });
  };

  const clearHistory = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("ai_chat_history")
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao limpar histórico");
      return;
    }
    setMessages([]);
    toast.success("Histórico limpo!");
  };

  const newChat = () => {
    setMessages([]);
    setPendingFiles([]);
    toast.success("Nova conversa iniciada!");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} excede o limite de 10MB`);
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(txt|csv|xml|json|pdf|xlsx|docx|png|jpg|jpeg|webp)$/i)) {
        toast.error(`Tipo de arquivo não suportado: ${file.name}`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length + pendingFiles.length > 5) {
      toast.error("Máximo de 5 arquivos por mensagem");
      return;
    }

    setPendingFiles(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAndProcessFiles = async (): Promise<Attachment[]> => {
    if (!user || pendingFiles.length === 0) return [];

    const attachments: Attachment[] = [];

    for (const file of pendingFiles) {
      // For text files, read content directly
      if (file.type.startsWith("text/") || file.type === "application/json" || file.type === "application/xml" || file.name.match(/\.(txt|csv|xml|json)$/i)) {
        const text = await file.text();
        attachments.push({
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          textContent: text.slice(0, 50000), // limit to 50k chars
        });
        continue;
      }

      // Upload binary files to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("chat-documents")
        .upload(filePath, file);

      if (error) {
        toast.error(`Erro ao enviar ${file.name}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("chat-documents")
        .getPublicUrl(filePath);

      attachments.push({
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData?.publicUrl,
      });
    }

    return attachments;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

    setIsLoading(true);
    setUploading(pendingFiles.length > 0);

    let attachments: Attachment[] = [];
    if (pendingFiles.length > 0) {
      attachments = await uploadAndProcessFiles();
      setPendingFiles([]);
      setUploading(false);
    }

    // Build user message content
    let userContent = input.trim();
    const fileContext = attachments.map(a => {
      if (a.textContent) {
        return `\n\n📎 Arquivo: ${a.name} (${formatFileSize(a.size)})\n\`\`\`\n${a.textContent}\n\`\`\``;
      }
      return `\n\n📎 Arquivo enviado: ${a.name} (${a.type}, ${formatFileSize(a.size)})`;
    }).join("");

    const fullContent = userContent + fileContext;
    const displayContent = userContent || "📎 Documento(s) enviado(s)";

    const userMsg: Msg = {
      role: "user",
      content: displayContent,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
    setInput("");
    setMessages(prev => [...prev, userMsg]);

    // Persist user message
    await saveMessage("user", displayContent);

    let assistantSoFar = "";
    const allMessages = [...messages, { role: "user" as const, content: fullContent }].map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, model: selectedModel }),
      });

      if (resp.status === 429) {
        toast.error("Muitas requisições. Tente novamente em alguns segundos.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Créditos de IA esgotados. Adicione mais créditos.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) throw new Error("Falha ao conectar com IA");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await saveMessage("assistant", assistantSoFar, selectedModel);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const currentModel = MODELS.find(m => m.key === selectedModel);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Assistente IA Contábil</h1>
            <p className="text-xs text-muted-foreground">Modelo: {currentModel?.label || selectedModel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={newChat} title="Nova conversa">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} title="Configurações">
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={clearHistory} title="Limpar histórico">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Model selector */}
      {showSettings && (
        <div className="mb-4 p-4 rounded-lg border bg-card space-y-3 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modelo de IA</p>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map(m => (
                <SelectItem key={m.key} value={m.key}>
                  <span className="font-medium">{m.label}</span>
                  <span className="text-muted-foreground ml-2">— {m.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground">
            {messages.length} mensagens • Histórico salvo automaticamente • Upload: PDF, DOCX, CSV, TXT, imagens
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="font-display text-lg font-semibold text-muted-foreground">Como posso ajudar?</h2>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
              Pergunte sobre contabilidade, envie documentos para análise, ou peça ajuda com cálculos fiscais.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-6 max-w-md">
              {[
                "Quais obrigações vencem esse mês?",
                "Como calcular ICMS-ST?",
                "Diferença entre SPED e EFD?",
                "Como funciona o Simples Nacional?",
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs text-left p-3 rounded-lg border bg-card hover:bg-muted transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            }`}>
              {/* Attachment badges */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.attachments.map((a, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] gap-1 bg-primary-foreground/20 text-primary-foreground">
                      <FileText className="w-3 h-3" />
                      {a.name} ({formatFileSize(a.size)})
                    </Badge>
                  ))}
                </div>
              )}
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {uploading ? "Enviando documento(s)..." : "Pensando..."}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Pending files */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1 pb-2">
          {pendingFiles.map((file, i) => (
            <Badge key={i} variant="outline" className="text-xs gap-1.5 pr-1">
              <FileText className="w-3 h-3" />
              {file.name} ({formatFileSize(file.size)})
              <button onClick={() => removePendingFile(i)} className="ml-1 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.csv,.xml,.json,.pdf,.xlsx,.docx,.png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title="Anexar documento"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={pendingFiles.length > 0 ? "Descreva o que fazer com o(s) documento(s)..." : "Pergunte algo sobre contabilidade..."}
          className="h-12"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
