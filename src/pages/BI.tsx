import ModulePage from "@/components/ModulePage";
import { BarChart3 } from "lucide-react";

export default function BI() {
  return (
    <ModulePage
      icon={BarChart3}
      title="BI & Relatórios"
      description="Dashboards, indicadores contábeis e relatórios fiscais."
      tools={["Power BI", "Looker", "Tableau", "Metabase", "Superset"]}
      features={[
        "Dashboard de clientes",
        "Indicadores contábeis em tempo real",
        "Relatórios fiscais automatizados",
        "Análise de rentabilidade",
        "Exportação PDF e Excel",
        "Gráficos interativos"
      ]}
    />
  );
}
