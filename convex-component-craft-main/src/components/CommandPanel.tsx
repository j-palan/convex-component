import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { 
  Globe, 
  FileText, 
  MousePointer, 
  Bot, 
  Play,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type OperationType = "extract" | "act" | "agent";

interface CommandPanelProps {
  onStartSession: (url?: string) => Promise<any>;
  onRunExtraction: (url: string, instruction: string) => Promise<any>;
  onRunAction: (url: string, action: string) => Promise<any>;
  onRunAgent: (url: string, instruction: string) => Promise<any>;
  isLoading: boolean;
}

const operations = [
  { id: "extract" as const, label: "Extract", icon: FileText, description: "Extract structured data" },
  { id: "act" as const, label: "Action", icon: MousePointer, description: "Perform browser action" },
  { id: "agent" as const, label: "Agent", icon: Bot, description: "Autonomous multi-step" },
];

export function CommandPanel({
  onStartSession,
  onRunExtraction,
  onRunAction,
  onRunAgent,
  isLoading,
}: CommandPanelProps) {
  const [url, setUrl] = useState("https://news.ycombinator.com");
  const [instruction, setInstruction] = useState("");
  const [selectedOp, setSelectedOp] = useState<OperationType>("extract");

  const handleRun = async () => {
    if (!url || !instruction) return;

    switch (selectedOp) {
      case "extract":
        await onRunExtraction(url, instruction);
        break;
      case "act":
        await onRunAction(url, instruction);
        break;
      case "agent":
        await onRunAgent(url, instruction);
        break;
    }

    setInstruction("");
  };

  const placeholders = {
    extract: "Extract the top 5 stories with title, score, and link...",
    act: "Click on the 'new' link to see newest stories...",
    agent: "Search for 'Convex' and extract the top 3 results...",
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Target URL
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="pl-10 font-mono text-sm bg-muted/50 border-border focus:border-primary focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Operation Type */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Operation
        </label>
        <div className="grid grid-cols-3 gap-2">
          {operations.map((op) => {
            const Icon = op.icon;
            const isSelected = selectedOp === op.id;

            return (
              <button
                key={op.id}
                onClick={() => setSelectedOp(op.id)}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 text-left",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-neon-sm"
                    : "border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/30"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 mb-1.5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <p
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {op.label}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {op.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Instruction Input */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Instruction
        </label>
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={placeholders[selectedOp]}
          className="min-h-[100px] font-mono text-sm bg-muted/50 border-border focus:border-primary focus:ring-primary/20 resize-none"
        />
      </div>

      {/* Run Button */}
      <Button
        onClick={handleRun}
        disabled={isLoading || !url || !instruction}
        className="w-full btn-cyber"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Run {operations.find((o) => o.id === selectedOp)?.label}
          </>
        )}
      </Button>

      {/* Quick Start Session */}
      <Button
        variant="outline"
        onClick={() => onStartSession(url)}
        disabled={isLoading}
        className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary"
      >
        <Globe className="w-4 h-4 mr-2" />
        Start New Session
      </Button>
    </div>
  );
}
