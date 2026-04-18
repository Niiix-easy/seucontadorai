import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-3 px-5 py-3 w-full text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors",
            collapsed && "justify-center px-0"
          )}
          title="Alterar tema"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-4 h-4 shrink-0" />
          ) : (
            <Sun className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && <span>Tema</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuItem onClick={() => setTheme("light")} className={cn(theme === "light" && "bg-accent")}>
          <Sun className="w-4 h-4 mr-2" /> Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className={cn(theme === "dark" && "bg-accent")}>
          <Moon className="w-4 h-4 mr-2" /> Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className={cn(theme === "system" && "bg-accent")}>
          <Monitor className="w-4 h-4 mr-2" /> Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeToggleSimple() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
      title={resolvedTheme === "dark" ? "Modo claro" : "Modo escuro"}
      aria-label="Alternar tema"
    >
      {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
