import ModulePage from "@/components/ModulePage";
import { FolderOpen } from "lucide-react";

export default function Documentos() {
  return (
    <ModulePage
      icon={FolderOpen}
      title="Gestão de Documentos"
      description="Armazenamento, organização e assinatura digital de documentos."
      tools={["Arquivei", "Nibo Docs", "E-CLIC", "DocuWare", "GED Contábil"]}
      features={[
        "Armazenamento seguro na nuvem",
        "Assinatura digital integrada",
        "Workflow de aprovação",
        "Busca inteligente por OCR",
        "Organização por cliente e período",
        "Versionamento de documentos"
      ]}
    />
  );
}
