import ModulePage from "@/components/ModulePage";
import { Globe } from "lucide-react";

export default function Portal() {
  return (
    <ModulePage
      icon={Globe}
      title="Portal do Cliente"
      description="Área do cliente para envio de documentos, consultas e chamados."
      tools={["Portal Web", "App Mobile", "API REST"]}
      features={[
        "Envio de documentos pelo cliente",
        "Visualização de impostos",
        "Acesso a relatórios contábeis",
        "Pagamento de honorários",
        "Abertura de chamados",
        "Notificações automáticas"
      ]}
    />
  );
}
