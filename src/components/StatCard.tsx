import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ title, value, change, changeType = "neutral", icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-[Space_Grotesk] tracking-tight">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === "up" && "text-[hsl(var(--success))]",
              changeType === "down" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color || "bg-primary/10")}>
          <Icon className={cn("w-5 h-5", color ? "text-card-foreground" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
