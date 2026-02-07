import { useState, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Types that match the Convex schema output
export interface Session {
  _id: string;
  status: "starting" | "active" | "idle" | "ended" | "error";
  browserbaseSessionId?: string;
  currentUrl?: string;
  createdAt: number;
  lastActivityAt: number;
}

export interface Task {
  _id: string;
  type: "navigate" | "extract" | "act" | "observe" | "agent" | "screenshot";
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  instruction: string;
  url?: string;
  result?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface Log {
  _id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: any;
  timestamp: number;
}

export function useBrowserUse() {
  const [isLoading, setIsLoading] = useState(false);

  // --- Reactive queries: auto-update when DB changes ---
  const sessions = (useQuery(api.browserUse.listSessions, {}) ?? []) as Session[];
  const tasks = (useQuery(api.browserUse.listTasks, {}) ?? []) as Task[];
  const logs = (useQuery(api.browserUse.getLogs, {}) ?? []) as Log[];

  // --- Actions ---
  const startSessionAction = useAction(api.browserUse.startSession);
  const endSessionAction = useAction(api.browserUse.endSession);
  const runExtractionAction = useAction(api.browserUse.runExtraction);
  const runActionAction = useAction(api.browserUse.runAction);
  const runAgentAction = useAction(api.browserUse.runAgent);

  const startSession = useCallback(
    async (url?: string) => {
      setIsLoading(true);
      try {
        const result = await startSessionAction({ url });
        return result;
      } catch (err) {
        console.error("Failed to start session:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [startSessionAction]
  );

  const endSession = useCallback(
    async (sessionId: string) => {
      setIsLoading(true);
      try {
        await endSessionAction({ sessionId });
      } catch (err) {
        console.error("Failed to end session:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [endSessionAction]
  );

  const runExtraction = useCallback(
    async (url: string, instruction: string) => {
      setIsLoading(true);
      try {
        const result = await runExtractionAction({ url, instruction });
        return result;
      } catch (err) {
        console.error("Extraction failed:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [runExtractionAction]
  );

  const runAction = useCallback(
    async (url: string, instruction: string) => {
      setIsLoading(true);
      try {
        const result = await runActionAction({ url, instruction });
        return result;
      } catch (err) {
        console.error("Action failed:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [runActionAction]
  );

  const runAgent = useCallback(
    async (url: string, instruction: string) => {
      setIsLoading(true);
      try {
        const result = await runAgentAction({ url, instruction });
        return result;
      } catch (err) {
        console.error("Agent failed:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [runAgentAction]
  );

  return {
    sessions,
    tasks,
    logs,
    isLoading,
    startSession,
    endSession,
    runExtraction,
    runAction,
    runAgent,
  };
}
