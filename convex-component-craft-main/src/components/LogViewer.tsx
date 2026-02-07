import { formatDistanceToNow } from "date-fns";
import { Log } from "@/hooks/useBrowserUse";
import { cn } from "@/lib/utils";
import { Info, AlertTriangle, XCircle, Bug } from "lucide-react";

interface LogViewerProps {
  logs: Log[];
  maxHeight?: string;
}

const levelConfig = {
  info: { icon: Info, color: "text-primary", bgColor: "bg-primary/10" },
  warn: { icon: AlertTriangle, color: "text-neon-yellow", bgColor: "bg-neon-yellow/10" },
  error: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  debug: { icon: Bug, color: "text-neon-purple", bgColor: "bg-neon-purple/10" },
};

export function LogViewer({ logs, maxHeight = "400px" }: LogViewerProps) {
  return (
    <div
      className="bg-muted/30 rounded-lg border border-border overflow-hidden"
      style={{ maxHeight }}
    >
      <div className="overflow-y-auto scrollbar-cyber h-full">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No logs yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((log) => {
              const config = levelConfig[log.level];
              const Icon = config.icon;

              return (
                <div
                  key={log._id}
                  className={cn(
                    "px-4 py-2.5 flex items-start gap-3 hover:bg-muted/30 transition-colors",
                    config.bgColor
                  )}
                >
                  <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-mono", config.color)}>
                      {log.message}
                    </p>
                    {log.data && (
                      <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
