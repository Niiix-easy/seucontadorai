import ModulePage from "@/components/ModulePage";
import { Zap } from "lucide-react";

export default function Automacao() {
  return (
    <ModulePage
      icon={Zap}
      title="Automação Contábil"
      description="Classificação automática, conciliação e lançamentos inteligentes."
      tools={["Contabilizei Engine", "ContaAzul Contador", "Mister Contador", "Escritório Inteligente", "Acessórias Bot"]}
      features={[
        "Classificação contábil automática",
        "Conciliação bancária automática",
        "Importação de extratos",
        "Lançamentos automáticos",
        "Regras de classificação por IA",
        "Fluxo de lançamentos recorrentes"
      ]}
    />
  );
}
