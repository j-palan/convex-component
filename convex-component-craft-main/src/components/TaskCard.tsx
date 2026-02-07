import { formatDistanceToNow } from "date-fns";
import { Task } from "@/hooks/useBrowserUse";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { 
  Navigation, 
  FileText, 
  MousePointer, 
  Eye, 
  Bot, 
  Camera,
  ChevronDown,
  ChevronUp 
} from "lucide-react";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
}

const typeIcons = {
  navigate: Navigation,
  extract: FileText,
  act: MousePointer,
  observe: Eye,
  agent: Bot,
  screenshot: Camera,
};

const typeLabels = {
  navigate: "Navigate",
  extract: "Extract",
  act: "Action",
  observe: "Observe",
  agent: "Agent",
  screenshot: "Screenshot",
};

export function TaskCard({ task }: TaskCardProps) {
  // Auto-expand completed or failed tasks so the user sees results immediately
  const hasOutput = !!(task.result || task.error);
  const [expanded, setExpanded] = useState(
    hasOutput && (task.status === "completed" || task.status === "failed")
  );
  const Icon = typeIcons[task.type];
  const isRunning = task.status === "running";

  // Build a short preview string for collapsed view
  const resultPreview = (() => {
    if (task.error) return `Error: ${task.error.slice(0, 80)}`;
    if (!task.result) return null;
    const str = typeof task.result === "string"
      ? task.result
      : JSON.stringify(task.result);
    return str.length > 100 ? str.slice(0, 100) + "…" : str;
  })();

  return (
    <div
      className={cn(
        "card-cyber overflow-hidden transition-all duration-300",
        isRunning && "border-primary/50",
        task.status === "completed" && "border-accent/30",
        task.status === "failed" && "border-destructive/30"
      )}
    >
      <div
        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              isRunning ? "bg-primary/20" : "bg-muted"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4",
                isRunning ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                {typeLabels[task.type]}
              </span>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-foreground line-clamp-2">
              {task.instruction}
            </p>
            {task.url && (
              <p className="text-xs text-muted-foreground font-mono mt-1 truncate">
                {task.url}
              </p>
            )}
            {/* Show a brief preview when collapsed */}
            {!expanded && resultPreview && (
              <p className={cn(
                "text-xs mt-2 line-clamp-2 font-mono",
                task.error ? "text-destructive/80" : "text-accent/80"
              )}>
                {resultPreview}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(task.createdAt, { addSuffix: true })}
            </span>
            {hasOutput && (
              expanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </div>
        </div>
      </div>

      {expanded && hasOutput && (
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          {task.error ? (
            <div className="code-block text-destructive">
              <span className="text-xs font-bold">Error: </span>
              <span className="text-xs">{task.error}</span>
            </div>
          ) : (
            <div className="code-block max-h-96 overflow-y-auto scrollbar-cyber">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-accent">
                {typeof task.result === "string"
                  ? task.result
                  : JSON.stringify(task.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
