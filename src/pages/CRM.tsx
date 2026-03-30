import ModulePage from "@/components/ModulePage";
import { Users } from "lucide-react";

export default function CRM() {
  return (
    <ModulePage
      icon={Users}
      title="CRM Clientes"
      description="Gestão de relacionamento, atendimento e comunicação com clientes."
      tools={["Zap Contábil", "Digisac", "One Cloud", "WhatsApp Business API", "HubSpot", "PipeRun"]}
      features={[
        "WhatsApp integrado",
        "Chatbot de atendimento",
        "CRM completo",
        "Tickets de atendimento",
        "Histórico de comunicações",
        "Pipeline de vendas"
      ]}
    />
  );
}
