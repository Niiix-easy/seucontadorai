import ModulePage from "@/components/ModulePage";
import { FileText } from "lucide-react";

export default function ImportacaoXML() {
  return (
    <ModulePage
      icon={FileText}
      title="Importação de XML / Notas"
      description="Download automático e gerenciamento de NF-e, CT-e, NFS-e."
      tools={["Sieg", "Arquivei", "NFe.io", "Qive", "Jettax", "Dootax", "NFe Cloud"]}
      features={[
        "Download automático de NF-e",
        "Download de CT-e e NFS-e",
        "Consulta direta na SEFAZ",
        "Armazenamento seguro de XML",
        "OCR de notas fiscais",
        "Manifestação de destinatário",
        "Classificação automática",
        "Exportação para sistema contábil"
      ]}
    />
  );
}
