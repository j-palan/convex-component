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
  const [expanded, setExpanded] = useState(false);
  const Icon = typeIcons[task.type];
  const isRunning = task.status === "running";

  return (
    <div
      className={cn(
        "card-cyber overflow-hidden transition-all duration-300",
        isRunning && "border-primary/50"
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
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(task.createdAt, { addSuffix: true })}
            </span>
            {(task.result || task.error) && (
              expanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )
            )}
          </div>
        </div>
      </div>

      {expanded && (task.result || task.error) && (
        <div className="border-t border-border px-4 py-3 bg-muted/20">
          {task.error ? (
            <div className="code-block text-destructive">
              <span className="text-xs">Error: </span>
              {task.error}
            </div>
          ) : (
            <div className="code-block">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(task.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
