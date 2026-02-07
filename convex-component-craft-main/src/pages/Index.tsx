import { useBrowserUse } from "@/hooks/useBrowserUse";
import { TerminalWindow } from "@/components/TerminalWindow";
import { SessionCard } from "@/components/SessionCard";
import { TaskCard } from "@/components/TaskCard";
import { LogViewer } from "@/components/LogViewer";
import { CommandPanel } from "@/components/CommandPanel";
import { 
  Monitor, 
  Activity, 
  Terminal as TerminalIcon,
  Zap,
  Github,
  ExternalLink
} from "lucide-react";

const Index = () => {
  const {
    sessions,
    tasks,
    logs,
    isLoading,
    startSession,
    endSession,
    runExtraction,
    runAction,
    runAgent,
  } = useBrowserUse();

  const activeSessions = sessions.filter((s) => s.status === "active" || s.status === "starting");

  return (
    <div className="min-h-screen bg-background bg-grid-pattern">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      
      {/* Header */}
      <header className="relative border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-cyan-sm">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="text-glow">Browser Use</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-primary/20 text-primary rounded">
                    CONVEX
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground font-mono">
                  AI-powered browser automation component
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://www.convex.dev/components/challenge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Contest
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <Github className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Command Panel */}
          <div className="lg:col-span-1 space-y-6">
            <TerminalWindow title="command.ts">
              <CommandPanel
                onStartSession={startSession}
                onRunExtraction={runExtraction}
                onRunAction={runAction}
                onRunAgent={runAgent}
                isLoading={isLoading}
              />
            </TerminalWindow>

            {/* Sessions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-mono uppercase tracking-wider text-foreground">
                  Sessions
                </h2>
                <span className="text-xs font-mono px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                  {activeSessions.length} active
                </span>
              </div>
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <SessionCard
                    key={session._id}
                    session={session}
                    onEnd={endSession}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Tasks */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-foreground">
                Tasks
              </h2>
              <span className="text-xs font-mono px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                {tasks.length} total
              </span>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task._id} task={task} />
              ))}
            </div>
          </div>

          {/* Right Column - Logs */}
          <div className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-mono uppercase tracking-wider text-foreground">
                Execution Logs
              </h2>
            </div>
            <LogViewer logs={logs} maxHeight="calc(100vh - 200px)" />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🎯"
            title="Extract Data"
            description="Use natural language to extract structured data from any webpage with AI-powered understanding."
            code={`await browserUse.extract(ctx, {
  url: "https://example.com",
  instruction: "Get all products",
  schema: z.object({...})
});`}
          />
          <FeatureCard
            icon="🤖"
            title="Autonomous Agent"
            description="Let the AI agent figure out multi-step tasks autonomously with reasoning and actions."
            code={`await browserUse.agent(ctx, {
  url: "https://google.com",
  instruction: "Search and extract",
  options: { maxSteps: 10 }
});`}
          />
          <FeatureCard
            icon="⚡"
            title="Convex Workflows"
            description="Leverage Convex's durable workflows for reliable, resumable browser automation."
            code={`// Workflow persists state
// Automatic retries
// Survives deployments
// Real-time updates`}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground font-mono">
              Built with Convex Components SDK
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://docs.convex.dev/components"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
              >
                Docs
              </a>
              <a
                href="https://www.convex.dev/components"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
              >
                Components
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

function FeatureCard({
  icon,
  title,
  description,
  code,
}: {
  icon: string;
  title: string;
  description: string;
  code: string;
}) {
  return (
    <div className="card-cyber p-6 space-y-4 group hover:border-primary/30 transition-all duration-300">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="code-block">
        <pre className="text-[11px] text-accent whitespace-pre-wrap">{code}</pre>
      </div>
    </div>
  );
}

export default Index;
