import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "starting" | "active" | "idle" | "ended" | "error" | "pending" | "running" | "completed" | "failed" | "cancelled";
  className?: string;
}

const statusConfig = {
  starting: { label: "Starting", color: "bg-neon-yellow", textColor: "text-neon-yellow" },
  active: { label: "Active", color: "bg-accent", textColor: "text-accent" },
  idle: { label: "Idle", color: "bg-muted-foreground", textColor: "text-muted-foreground" },
  ended: { label: "Ended", color: "bg-muted-foreground", textColor: "text-muted-foreground" },
  error: { label: "Error", color: "bg-destructive", textColor: "text-destructive" },
  pending: { label: "Pending", color: "bg-neon-yellow", textColor: "text-neon-yellow" },
  running: { label: "Running", color: "bg-primary", textColor: "text-primary" },
  completed: { label: "Completed", color: "bg-accent", textColor: "text-accent" },
  failed: { label: "Failed", color: "bg-destructive", textColor: "text-destructive" },
  cancelled: { label: "Cancelled", color: "bg-muted-foreground", textColor: "text-muted-foreground" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          config.color,
          (status === "active" || status === "running") && "animate-pulse"
        )}
        style={{
          boxShadow: (status === "active" || status === "running") 
            ? `0 0 8px hsl(var(--${status === "active" ? "accent" : "primary"}))` 
            : undefined
        }}
      />
      <span className={cn("text-xs font-mono uppercase tracking-wider", config.textColor)}>
        {config.label}
      </span>
    </div>
  );
}
