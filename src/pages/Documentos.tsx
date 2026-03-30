import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Upload, Search, FileText, Download, Trash2, Loader2, File, Image } from "lucide-react";
import { toast } from "sonner";

const categoryLabels: Record<string, string> = {
  contabil: "Contábil", fiscal: "Fiscal", folha: "Folha", contratos: "Contratos",
  societario: "Societário", outros: "Outros",
};

const fileIcons: Record<string, typeof FileText> = { pdf: FileText, xml: File, jpg: Image, png: Image, jpeg: Image };

export default function Documentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents"] }); toast.success("Documento removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { error: dbErr } = await supabase.from("documents").insert({
          name: file.name, file_path: path, file_type: file.type,
          file_size: file.size, category: "outros", user_id: user.id,
        });
        if (dbErr) throw dbErr;
      }
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Upload concluído!");
    } catch (err: any) { toast.error(err.message); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const downloadDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const filtered = documents.filter((d: any) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || d.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalSize = documents.reduce((s: number, d: any) => s + (d.file_size || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-primary" /> Gestão de Documentos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{documents.length} documentos • {(totalSize / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <Button className="gap-2 relative" disabled={uploading}>
          <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Upload"}
          <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} accept=".pdf,.xml,.jpg,.png,.doc,.docx,.xls,.xlsx" />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar documentos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum documento</p>
          <p className="text-sm">Faça upload para começar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((doc: any) => {
            const ext = doc.name.split(".").pop()?.toLowerCase() || "";
            const Icon = fileIcons[ext] || FileText;
            return (
              <div key={doc.id} className="bg-card border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{categoryLabels[doc.category] || doc.category}</Badge>
                    {doc.file_size && <span>{(doc.file_size / 1024).toFixed(0)} KB</span>}
                    <span>{new Date(doc.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => downloadDoc(doc)}><Download className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(doc)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
