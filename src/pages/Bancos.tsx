import ModulePage from "@/components/ModulePage";
import { Landmark } from "lucide-react";

export default function Bancos() {
  return (
    <ModulePage
      icon={Landmark}
      title="Integração Bancos"
      description="Conexão com bancos para extrato automático e conciliação."
      tools={["Open Banking", "OFX", "API Bancária", "Pluggy"]}
      features={[
        "Importação automática de extratos",
        "Conciliação bancária inteligente",
        "Múltiplas contas e bancos",
        "Open Banking / Open Finance",
        "Classificação automática de transações",
        "Alertas de movimentações"
      ]}
    />
  );
}
