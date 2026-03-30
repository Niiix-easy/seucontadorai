import ModulePage from "@/components/ModulePage";
import { PenTool } from "lucide-react";

export default function Assinatura() {
  return (
    <ModulePage
      icon={PenTool}
      title="Assinatura Digital"
      description="Assinatura eletrônica e certificado digital integrado."
      tools={["DocuSign", "Clicksign", "D4Sign", "ICP-Brasil"]}
      features={[
        "Assinatura eletrônica de contratos",
        "Certificado digital A1/A3",
        "Assinatura em lote",
        "Validade jurídica",
        "Integração com documentos",
        "Auditoria de assinaturas"
      ]}
    />
  );
}
