import ModulePage from "@/components/ModulePage";
import { Bot } from "lucide-react";

export default function IAContabil() {
  return (
    <ModulePage
      icon={Bot}
      title="IA Contábil"
      description="Inteligência artificial para classificação, previsão fiscal e chatbot."
      tools={["OpenAI", "Claude", "Gemini"]}
      features={[
        "Classificação contábil por IA",
        "Leitura automática de notas fiscais",
        "Chatbot contábil para clientes",
        "Previsão fiscal inteligente",
        "Verificação automática de erros",
        "Cálculo inteligente de impostos",
        "Sugestões de economia tributária"
      ]}
    />
  );
}
