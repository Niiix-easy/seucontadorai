import { LucideIcon } from "lucide-react";

interface ModulePageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tools: string[];
  features: string[];
}

export default function ModulePage({ icon: Icon, title, description, tools, features }: ModulePageProps) {
  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tools */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold font-[Space_Grotesk]">🛠 Ferramentas Integradas</h2>
          <div className="flex flex-wrap gap-2">
            {tools.map(t => (
              <span key={t} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">{t}</span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold font-[Space_Grotesk]">⚡ Funcionalidades</h2>
          <ul className="space-y-2">
            {features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Placeholder content area */}
      <div className="bg-card rounded-xl border p-8 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold font-[Space_Grotesk]">Módulo em Desenvolvimento</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Este módulo está sendo construído. Em breve você poderá acessar todas as funcionalidades listadas acima.
        </p>
      </div>
    </div>
  );
}
