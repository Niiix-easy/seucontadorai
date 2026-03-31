import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color?: string;
  delay?: number;
}

export default function StatCard({ title, value, change, changeType = "neutral", icon: Icon, color, delay = 0 }: StatCardProps) {
  return (
    <div
      className="bg-card rounded-xl border p-5 hover:shadow-lg hover:scale-[1.02] hover:border-primary/20 transition-all duration-300 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-display tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === "up" && "text-success",
              changeType === "down" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          color || "bg-primary/10"
        )}>
          <Icon className={cn("w-5 h-5", color ? "text-card-foreground" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
