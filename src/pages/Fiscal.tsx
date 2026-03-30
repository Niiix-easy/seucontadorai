import ModulePage from "@/components/ModulePage";
import { Receipt } from "lucide-react";

export default function Fiscal() {
  return (
    <ModulePage
      icon={Receipt}
      title="Módulo Fiscal"
      description="Apuração de impostos, obrigações acessórias e consulta tributária."
      tools={["Econet", "IOB", "Lefisc", "Systax", "Cenofisco"]}
      features={[
        "Apuração ICMS/IPI/ISS/PIS/COFINS",
        "Legislação tributária atualizada",
        "Consulta de alíquotas",
        "Cálculo automático de impostos",
        "Regras fiscais por NCM/CFOP",
        "Reforma tributária 2026",
        "SPED Fiscal",
        "DCTF / DIRF / EFD"
      ]}
    />
  );
}
