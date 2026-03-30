import ModulePage from "@/components/ModulePage";
import { Building2 } from "lucide-react";

export default function Sefaz() {
  return (
    <ModulePage
      icon={Building2}
      title="Integração SEFAZ"
      description="Comunicação direta com a Secretaria da Fazenda."
      tools={["WebService SEFAZ", "API NF-e", "SPED"]}
      features={[
        "Emissão de NF-e direta",
        "Consulta de notas na SEFAZ",
        "Manifestação de destinatário",
        "Cancelamento e carta de correção",
        "Download automático de XML",
        "Monitoramento de status"
      ]}
    />
  );
}
