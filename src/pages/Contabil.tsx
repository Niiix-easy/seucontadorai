import ModulePage from "@/components/ModulePage";
import { BookOpen } from "lucide-react";

export default function Contabil() {
  return (
    <ModulePage
      icon={BookOpen}
      title="Sistema Contábil"
      description="Gestão contábil completa com plano de contas, balancete, livros e SPED."
      tools={["Domínio", "Alterdata", "Prosoft", "Questor", "Contmatic", "Fortes", "Mastermaq"]}
      features={[
        "Plano de contas personalizado",
        "Balancete em tempo real",
        "Livro diário e razão",
        "SPED contábil (ECD/ECF)",
        "Integração fiscal automática",
        "Integração com folha de pagamento",
        "Relatórios gerenciais",
        "Conciliação bancária"
      ]}
    />
  );
}
