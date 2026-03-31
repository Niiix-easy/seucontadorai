import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, Receipt, FileText, Users, ClipboardList,
  FolderOpen, DollarSign, BarChart3, Bot, Globe, PenTool, Building2,
  Landmark, ChevronLeft, ChevronRight, Zap, Shield, MessageSquare, LogOut, FileKey, Calculator
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const modules = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", section: "" },
  { path: "/contabil", icon: BookOpen, label: "Contábil", section: "Core" },
  { path: "/fiscal", icon: Receipt, label: "Fiscal", section: "Core" },
  { path: "/calculadora-icms-st", icon: Calculator, label: "Calculadora ICMS-ST", section: "Core" },
  { path: "/folha", icon: Users, label: "Folha de Pagamento", section: "Core" },
  { path: "/xml", icon: FileText, label: "Importação XML", section: "Automação" },
  { path: "/automacao", icon: Zap, label: "Automação Contábil", section: "Automação" },
  { path: "/crm", icon: Users, label: "CRM Clientes", section: "Gestão" },
  { path: "/tarefas", icon: ClipboardList, label: "Tarefas", section: "Gestão" },
  { path: "/documentos", icon: FolderOpen, label: "Documentos", section: "Gestão" },
  { path: "/financeiro", icon: DollarSign, label: "Financeiro", section: "Gestão" },
  { path: "/bi", icon: BarChart3, label: "BI & Relatórios", section: "Análise" },
  { path: "/ia", icon: Bot, label: "IA Contábil", section: "Análise" },
  { path: "/ia-chat", icon: MessageSquare, label: "Chat IA", section: "Análise" },
  { path: "/portal", icon: Globe, label: "Portal do Cliente", section: "Integrações" },
  { path: "/assinatura", icon: PenTool, label: "Assinatura Digital", section: "Integrações" },
  { path: "/sefaz", icon: Building2, label: "Integração SEFAZ", section: "Integrações" },
  { path: "/bancos", icon: Landmark, label: "Integração Bancos", section: "Integrações" },
  { path: "/certificados", icon: FileKey, label: "Certificados Digitais", section: "Integrações" },
  { path: "/admin", icon: Shield, label: "Administração", section: "Sistema" },
];

export default function AppSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const sections = [...new Set(modules.map(m => m.section))];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado!");
    navigate("/");
  };

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col transition-all duration-300 ease-in-out border-r",
        "bg-sidebar-background text-sidebar-foreground border-sidebar-border",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-primary-foreground tracking-tight font-display">
              Seu Contador IA
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60">ERP Contábil 2026</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sections.map(section => (
          <div key={section}>
            {section && !collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold px-3 pt-4 pb-1">
                {section}
              </p>
            )}
            {modules.filter(m => m.section === section).map(mod => {
              const isActive = location.pathname === mod.path;
              return (
                <NavLink
                  key={mod.path}
                  to={mod.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  title={mod.label}
                >
                  <mod.icon className={cn("w-4 h-4 shrink-0", isActive && "text-sidebar-primary")} />
                  {!collapsed && <span className="truncate">{mod.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout + Collapse */}
      <div className="border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-5 py-3 w-full text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 w-full border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
