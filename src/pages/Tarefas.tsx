import ModulePage from "@/components/ModulePage";
import { ClipboardList } from "lucide-react";

export default function Tarefas() {
  return (
    <ModulePage
      icon={ClipboardList}
      title="Gestor de Tarefas Contábeis"
      description="Controle de obrigações, prazos fiscais e tarefas por cliente."
      tools={["Gestta", "GClick", "Acessórias", "Conta Azul Tarefas", "Trello", "Notion", "ClickUp"]}
      features={[
        "Tarefas organizadas por cliente",
        "Controle de obrigações acessórias",
        "Prazos fiscais com alertas",
        "Calendário de obrigações",
        "Distribuição de tarefas por equipe",
        "Relatórios de produtividade"
      ]}
    />
  );
}
