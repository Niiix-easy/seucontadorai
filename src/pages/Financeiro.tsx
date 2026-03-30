import ModulePage from "@/components/ModulePage";
import { DollarSign } from "lucide-react";

export default function Financeiro() {
  return (
    <ModulePage
      icon={DollarSign}
      title="Financeiro do Escritório"
      description="Cobrança de honorários, faturamento e fluxo de caixa."
      tools={["Omie", "ContaAzul", "Nibo", "Domínio Honorários", "Asaas", "QuickBooks"]}
      features={[
        "Cobrança automática de clientes",
        "Emissão de boleto e PIX",
        "Faturamento mensal",
        "Fluxo de caixa",
        "Controle de inadimplência",
        "Relatórios financeiros"
      ]}
    />
  );
}
