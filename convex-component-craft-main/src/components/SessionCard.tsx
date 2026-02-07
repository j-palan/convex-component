import { formatDistanceToNow } from "date-fns";
import { Session } from "@/hooks/useBrowserUse";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { Globe, Power, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
  onEnd: (sessionId: string) => void;
}

export function SessionCard({ session, onEnd }: SessionCardProps) {
  const isActive = session.status === "active" || session.status === "starting";

  return (
    <div
      className={cn(
        "card-cyber p-4 space-y-3 transition-all duration-300",
        isActive && "border-primary/50"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isActive ? "bg-primary/20" : "bg-muted"
            )}
          >
            <Globe
              className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>
          <div>
            <p className="font-mono text-sm text-foreground">
              {(session.browserbaseSessionId ?? session._id)?.slice(0, 16)}...
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(session.createdAt, { addSuffix: true })}
            </p>
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>

      {session.currentUrl && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md">
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground truncate flex-1">
            {session.currentUrl}
          </span>
        </div>
      )}

      {isActive && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => onEnd(session._id)}
        >
          <Power className="w-3.5 h-3.5 mr-2" />
          End Session
        </Button>
      )}
    </div>
  );
}
