import { cn } from "@/lib/utils";

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TerminalWindow({ title, children, className }: TerminalWindowProps) {
  return (
    <div className={cn("terminal-window", className)}>
      <div className="terminal-header">
        <div className="flex gap-1.5">
          <div className="terminal-dot terminal-dot-red" />
          <div className="terminal-dot terminal-dot-yellow" />
          <div className="terminal-dot terminal-dot-green" />
        </div>
        {title && (
          <span className="ml-4 text-xs font-mono text-muted-foreground">
            {title}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
