import ModulePage from "@/components/ModulePage";
import { Users } from "lucide-react";

export default function Folha() {
  return (
    <ModulePage
      icon={Users}
      title="Folha de Pagamento"
      description="Processamento de folha, encargos e obrigações trabalhistas."
      tools={["Domínio Folha", "Alterdata DP", "Fortes Ponto", "ADP"]}
      features={[
        "Cálculo de folha automático",
        "eSocial integrado",
        "Encargos trabalhistas (FGTS, INSS, IRRF)",
        "Férias e 13º salário",
        "Rescisões e homologações",
        "Controle de ponto",
        "CAGED / RAIS / DIRF",
        "Integração contábil automática"
      ]}
    />
  );
}
