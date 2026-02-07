/**
 * Browser Use Component - Core Library
 * 
 * Provides browser automation capabilities:
 * - Session management (start, end, resume)
 * - Data extraction with AI
 * - Action execution via natural language
 * - Element observation
 * - Autonomous agent mode
 */

import { v } from "convex/values";
import { action, mutation, query, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// Types
// ============================================================================

export const sessionStatusValidator = v.union(
  v.literal("starting"),
  v.literal("active"),
  v.literal("idle"),
  v.literal("ended"),
  v.literal("error")
);

export const taskTypeValidator = v.union(
  v.literal("navigate"),
  v.literal("extract"),
  v.literal("act"),
  v.literal("observe"),
  v.literal("agent"),
  v.literal("screenshot")
);

export const taskStatusValidator = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

/** Resolve API keys from args or Convex env (Dashboard → Settings → Environment Variables). */
function getApiKeys(args: {
  browserbaseApiKey?: string;
  browserbaseProjectId?: string;
  modelApiKey?: string;
}) {
  const browserbaseApiKey = args.browserbaseApiKey ?? process.env.BROWSERBASE_API_KEY;
  const browserbaseProjectId = args.browserbaseProjectId ?? process.env.BROWSERBASE_PROJECT_ID;
  const modelApiKey = args.modelApiKey ?? process.env.MODEL_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!browserbaseApiKey || !browserbaseProjectId) {
    throw new Error(
      "Missing Browserbase keys. Set BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID in Convex Dashboard → Settings → Environment Variables, or pass them as arguments."
    );
  }
  if (!modelApiKey) {
    throw new Error(
      "Missing model API key. Set MODEL_API_KEY or OPENAI_API_KEY in Convex Dashboard → Settings → Environment Variables, or pass modelApiKey as an argument."
    );
  }
  return { browserbaseApiKey, browserbaseProjectId, modelApiKey };
}

function getBrowserbaseApiKey(browserbaseApiKey?: string): string {
  const key = browserbaseApiKey ?? process.env.BROWSERBASE_API_KEY;
  if (!key) {
    throw new Error(
      "Missing BROWSERBASE_API_KEY. Set it in Convex Dashboard → Settings → Environment Variables, or pass browserbaseApiKey as an argument."
    );
  }
  return key;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Start a new browser session
 */
export const startSession = action({
  args: {
    url: v.optional(v.string()),
    browserbaseSessionId: v.optional(v.string()),
    options: v.optional(v.object({
      timeout: v.optional(v.number()),
      waitUntil: v.optional(v.union(
        v.literal("load"),
        v.literal("domcontentloaded"),
        v.literal("networkidle")
      )),
      viewport: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
      userAgent: v.optional(v.string()),
    })),
    browserbaseApiKey: v.optional(v.string()),
    browserbaseProjectId: v.optional(v.string()),
    modelApiKey: v.optional(v.string()),
    modelName: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.string(),
    browserbaseSessionId: v.optional(v.string()),
    cdpUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ sessionId: string; browserbaseSessionId?: string; cdpUrl?: string }> => {
    const keys = getApiKeys(args);
    // Create session record
    const sessionId: string = await ctx.runMutation(internal.lib.createSession, {
      status: "starting" as const,
      browserbaseSessionId: args.browserbaseSessionId,
      metadata: {
        viewport: args.options?.viewport,
        userAgent: args.options?.userAgent,
      },
    });

    try {
      // Initialize browser via Browserbase API
      const response = await initializeBrowserSession({
        browserbaseApiKey: keys.browserbaseApiKey,
        browserbaseProjectId: keys.browserbaseProjectId,
        existingSessionId: args.browserbaseSessionId,
      });

      // Update session with connection details
      await ctx.runMutation(internal.lib.updateSession, {
        sessionId,
        status: "active",
        browserbaseSessionId: response.id,
        cdpUrl: response.connectUrl,
        currentUrl: args.url,
      });

      // Navigate to initial URL if provided
      if (args.url) {
        await navigateToUrl({
          cdpUrl: response.connectUrl,
          url: args.url,
          timeout: args.options?.timeout ?? 30000,
          waitUntil: args.options?.waitUntil ?? "networkidle",
        });
      }

      // Log session start
      await ctx.runMutation(internal.lib.logExecution, {
        sessionId,
        level: "info",
        message: `Session started${args.url ? ` and navigated to ${args.url}` : ""}`,
        data: { browserbaseSessionId: response.id },
      });

      return {
        sessionId,
        browserbaseSessionId: response.id,
        cdpUrl: response.connectUrl,
      };
    } catch (error) {
      // Update session to error state
      await ctx.runMutation(internal.lib.updateSession, {
        sessionId,
        status: "error",
      });

      await ctx.runMutation(internal.lib.logExecution, {
        sessionId,
        level: "error",
        message: `Failed to start session: ${error instanceof Error ? error.message : "Unknown error"}`,
      });

      throw error;
    }
  },
});

/**
 * End a browser session
 */
export const endSession = action({
  args: {
    sessionId: v.string(),
    browserbaseApiKey: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const browserbaseApiKey = getBrowserbaseApiKey(args.browserbaseApiKey);
    const session = await ctx.runQuery(internal.lib.getSession, {
      sessionId: args.sessionId,
    });

    if (!session) {
      throw new Error(`Session ${args.sessionId} not found`);
    }

    if (session.browserbaseSessionId) {
      try {
        await closeBrowserSession({
          browserbaseApiKey,
          sessionId: session.browserbaseSessionId,
        });
      } catch (error) {
        console.error("Failed to close Browserbase session:", error);
      }
    }

    await ctx.runMutation(internal.lib.updateSession, {
      sessionId: args.sessionId,
      status: "ended",
    });

    await ctx.runMutation(internal.lib.logExecution, {
      sessionId: args.sessionId,
      level: "info",
      message: "Session ended",
    });

    return { success: true };
  },
});

// ============================================================================
// Browser Operations
// ============================================================================

/**
 * Extract structured data from a page using AI
 */
export const extract = action({
  args: {
    sessionId: v.optional(v.string()),
    url: v.optional(v.string()),
    instruction: v.string(),
    schema: v.any(), // JSON Schema
    browserbaseApiKey: v.optional(v.string()),
    browserbaseProjectId: v.optional(v.string()),
    modelApiKey: v.optional(v.string()),
    modelName: v.optional(v.string()),
    options: v.optional(v.object({
      timeout: v.optional(v.number()),
      waitUntil: v.optional(v.string()),
    })),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const keys = getApiKeys(args);
    // Create task record
    const taskId = await ctx.runMutation(internal.lib.createTask, {
      sessionId: args.sessionId,
      type: "extract",
      instruction: args.instruction,
      url: args.url,
      schema: args.schema,
    });

    try {
      // Mark task as running
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "running",
        startedAt: Date.now(),
      });

      // Get or create session
      let sessionInfo: { cdpUrl: string; browserbaseSessionId: string; isTemporary: boolean };

      if (args.sessionId) {
        const session = await ctx.runQuery(internal.lib.getSession, {
          sessionId: args.sessionId,
        });
        if (!session || !session.cdpUrl) {
          throw new Error("Invalid session or session not connected");
        }
        sessionInfo = {
          cdpUrl: session.cdpUrl,
          browserbaseSessionId: session.browserbaseSessionId ?? "",
          isTemporary: false,
        };
      } else if (args.url) {
        // Create temporary session
        const tempSession = await initializeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          browserbaseProjectId: keys.browserbaseProjectId,
        });

        await navigateToUrl({
          cdpUrl: tempSession.connectUrl,
          url: args.url,
          timeout: args.options?.timeout ?? 30000,
          waitUntil: args.options?.waitUntil ?? "networkidle",
        });

        sessionInfo = {
          cdpUrl: tempSession.connectUrl,
          browserbaseSessionId: tempSession.id,
          isTemporary: true,
        };
      } else {
        throw new Error("Either sessionId or url must be provided");
      }

      // Perform extraction using AI
      const result = await performExtraction({
        cdpUrl: sessionInfo.cdpUrl,
        instruction: args.instruction,
        schema: args.schema,
        modelApiKey: keys.modelApiKey,
        modelName: args.modelName ?? "gpt-4o",
      });

      // Close temporary session
      if (sessionInfo.isTemporary) {
        await closeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          sessionId: sessionInfo.browserbaseSessionId,
        });
      }

      // Update task with result
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "completed",
        result,
        completedAt: Date.now(),
      });

      return result;
    } catch (error) {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Perform a browser action using natural language
 */
export const act = action({
  args: {
    sessionId: v.optional(v.string()),
    url: v.optional(v.string()),
    action: v.string(),
    browserbaseApiKey: v.optional(v.string()),
    browserbaseProjectId: v.optional(v.string()),
    modelApiKey: v.optional(v.string()),
    modelName: v.optional(v.string()),
    options: v.optional(v.object({
      timeout: v.optional(v.number()),
      waitUntil: v.optional(v.string()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    actionDescription: v.string(),
  }),
  handler: async (ctx, args) => {
    const keys = getApiKeys(args);
    const taskId = await ctx.runMutation(internal.lib.createTask, {
      sessionId: args.sessionId,
      type: "act",
      instruction: args.action,
      url: args.url,
    });

    try {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "running",
        startedAt: Date.now(),
      });

      // Get or create session
      let sessionInfo: { cdpUrl: string; browserbaseSessionId: string; isTemporary: boolean };

      if (args.sessionId) {
        const session = await ctx.runQuery(internal.lib.getSession, {
          sessionId: args.sessionId,
        });
        if (!session || !session.cdpUrl) {
          throw new Error("Invalid session or session not connected");
        }
        sessionInfo = {
          cdpUrl: session.cdpUrl,
          browserbaseSessionId: session.browserbaseSessionId ?? "",
          isTemporary: false,
        };
      } else if (args.url) {
        const tempSession = await initializeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          browserbaseProjectId: keys.browserbaseProjectId,
        });

        await navigateToUrl({
          cdpUrl: tempSession.connectUrl,
          url: args.url,
          timeout: args.options?.timeout ?? 30000,
          waitUntil: args.options?.waitUntil ?? "networkidle",
        });

        sessionInfo = {
          cdpUrl: tempSession.connectUrl,
          browserbaseSessionId: tempSession.id,
          isTemporary: true,
        };
      } else {
        throw new Error("Either sessionId or url must be provided");
      }

      // Perform action using AI
      const result = await performAction({
        cdpUrl: sessionInfo.cdpUrl,
        action: args.action,
        modelApiKey: keys.modelApiKey,
        modelName: args.modelName ?? "gpt-4o",
      });

      // Close temporary session
      if (sessionInfo.isTemporary) {
        await closeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          sessionId: sessionInfo.browserbaseSessionId,
        });
      }

      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "completed",
        result,
        completedAt: Date.now(),
      });

      return result;
    } catch (error) {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Observe available actions on a page
 */
export const observe = action({
  args: {
    sessionId: v.optional(v.string()),
    url: v.optional(v.string()),
    instruction: v.optional(v.string()),
    browserbaseApiKey: v.optional(v.string()),
    browserbaseProjectId: v.optional(v.string()),
    modelApiKey: v.optional(v.string()),
    modelName: v.optional(v.string()),
    options: v.optional(v.object({
      timeout: v.optional(v.number()),
      waitUntil: v.optional(v.string()),
    })),
  },
  returns: v.array(v.object({
    description: v.string(),
    selector: v.string(),
    method: v.string(),
    arguments: v.optional(v.array(v.string())),
  })),
  handler: async (ctx, args) => {
    const keys = getApiKeys(args);
    const taskId = await ctx.runMutation(internal.lib.createTask, {
      sessionId: args.sessionId,
      type: "observe",
      instruction: args.instruction ?? "Find all interactive elements",
      url: args.url,
    });

    try {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "running",
        startedAt: Date.now(),
      });

      let sessionInfo: { cdpUrl: string; browserbaseSessionId: string; isTemporary: boolean };

      if (args.sessionId) {
        const session = await ctx.runQuery(internal.lib.getSession, {
          sessionId: args.sessionId,
        });
        if (!session || !session.cdpUrl) {
          throw new Error("Invalid session or session not connected");
        }
        sessionInfo = {
          cdpUrl: session.cdpUrl,
          browserbaseSessionId: session.browserbaseSessionId ?? "",
          isTemporary: false,
        };
      } else if (args.url) {
        const tempSession = await initializeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          browserbaseProjectId: keys.browserbaseProjectId,
        });

        await navigateToUrl({
          cdpUrl: tempSession.connectUrl,
          url: args.url,
          timeout: args.options?.timeout ?? 30000,
          waitUntil: args.options?.waitUntil ?? "networkidle",
        });

        sessionInfo = {
          cdpUrl: tempSession.connectUrl,
          browserbaseSessionId: tempSession.id,
          isTemporary: true,
        };
      } else {
        throw new Error("Either sessionId or url must be provided");
      }

      const result = await performObservation({
        cdpUrl: sessionInfo.cdpUrl,
        instruction: args.instruction ?? "Find all interactive elements",
        modelApiKey: keys.modelApiKey,
        modelName: args.modelName ?? "gpt-4o",
      });

      if (sessionInfo.isTemporary) {
        await closeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          sessionId: sessionInfo.browserbaseSessionId,
        });
      }

      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "completed",
        result,
        completedAt: Date.now(),
      });

      return result;
    } catch (error) {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

/**
 * Run an autonomous agent to complete a multi-step task
 */
export const agent = action({
  args: {
    sessionId: v.optional(v.string()),
    url: v.optional(v.string()),
    instruction: v.string(),
    browserbaseApiKey: v.optional(v.string()),
    browserbaseProjectId: v.optional(v.string()),
    modelApiKey: v.optional(v.string()),
    modelName: v.optional(v.string()),
    options: v.optional(v.object({
      maxSteps: v.optional(v.number()),
      timeout: v.optional(v.number()),
      waitUntil: v.optional(v.string()),
      systemPrompt: v.optional(v.string()),
    })),
  },
  returns: v.object({
    actions: v.array(v.object({
      type: v.string(),
      action: v.optional(v.string()),
      reasoning: v.optional(v.string()),
      timeMs: v.optional(v.number()),
    })),
    completed: v.boolean(),
    message: v.string(),
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const keys = getApiKeys(args);
    const taskId = await ctx.runMutation(internal.lib.createTask, {
      sessionId: args.sessionId,
      type: "agent",
      instruction: args.instruction,
      url: args.url,
    });

    try {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "running",
        startedAt: Date.now(),
      });

      let sessionInfo: { cdpUrl: string; browserbaseSessionId: string; isTemporary: boolean };

      if (args.sessionId) {
        const session = await ctx.runQuery(internal.lib.getSession, {
          sessionId: args.sessionId,
        });
        if (!session || !session.cdpUrl) {
          throw new Error("Invalid session or session not connected");
        }
        sessionInfo = {
          cdpUrl: session.cdpUrl,
          browserbaseSessionId: session.browserbaseSessionId ?? "",
          isTemporary: false,
        };
      } else if (args.url) {
        const tempSession = await initializeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          browserbaseProjectId: keys.browserbaseProjectId,
        });

        await navigateToUrl({
          cdpUrl: tempSession.connectUrl,
          url: args.url,
          timeout: args.options?.timeout ?? 30000,
          waitUntil: args.options?.waitUntil ?? "networkidle",
        });

        sessionInfo = {
          cdpUrl: tempSession.connectUrl,
          browserbaseSessionId: tempSession.id,
          isTemporary: true,
        };
      } else {
        throw new Error("Either sessionId or url must be provided");
      }

      const result = await runAgent({
        cdpUrl: sessionInfo.cdpUrl,
        instruction: args.instruction,
        modelApiKey: keys.modelApiKey,
        modelName: args.modelName ?? "gpt-4o",
        maxSteps: args.options?.maxSteps ?? 10,
        systemPrompt: args.options?.systemPrompt,
      });

      if (sessionInfo.isTemporary) {
        await closeBrowserSession({
          browserbaseApiKey: keys.browserbaseApiKey,
          sessionId: sessionInfo.browserbaseSessionId,
        });
      }

      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: result.success ? "completed" : "failed",
        result,
        completedAt: Date.now(),
      });

      return result;
    } catch (error) {
      await ctx.runMutation(internal.lib.updateTask, {
        taskId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: Date.now(),
      });

      throw error;
    }
  },
});

// ============================================================================
// Internal Mutations and Queries
// ============================================================================

export const createSession = internalMutation({
  args: {
    status: sessionStatusValidator,
    browserbaseSessionId: v.optional(v.string()),
    metadata: v.optional(v.object({
      viewport: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
      userAgent: v.optional(v.string()),
    })),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("sessions", {
      status: args.status,
      browserbaseSessionId: args.browserbaseSessionId,
      metadata: args.metadata,
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    });
    return id;
  },
});

export const updateSession = internalMutation({
  args: {
    sessionId: v.string(),
    status: v.optional(sessionStatusValidator),
    browserbaseSessionId: v.optional(v.string()),
    cdpUrl: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    await ctx.db.patch(sessionId as any, {
      ...updates,
      lastActivityAt: Date.now(),
    });
  },
});

export const getSession = internalQuery({
  args: { sessionId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("sessions"),
      status: sessionStatusValidator,
      browserbaseSessionId: v.optional(v.string()),
      cdpUrl: v.optional(v.string()),
      currentUrl: v.optional(v.string()),
      createdAt: v.number(),
      lastActivityAt: v.number(),
      metadata: v.optional(v.any()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.sessionId as Id<"sessions">);
    if (!doc) return null;
    return {
      _id: doc._id,
      status: doc.status,
      browserbaseSessionId: doc.browserbaseSessionId,
      cdpUrl: doc.cdpUrl,
      currentUrl: doc.currentUrl,
      createdAt: doc.createdAt,
      lastActivityAt: doc.lastActivityAt,
      metadata: doc.metadata,
    };
  },
});

export const createTask = internalMutation({
  args: {
    sessionId: v.optional(v.string()),
    type: taskTypeValidator,
    instruction: v.string(),
    url: v.optional(v.string()),
    schema: v.optional(v.any()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("tasks", {
      sessionId: args.sessionId as any,
      type: args.type,
      status: "pending",
      instruction: args.instruction,
      url: args.url,
      schema: args.schema,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    });
    return id;
  },
});

export const updateTask = internalMutation({
  args: {
    taskId: v.string(),
    status: v.optional(taskStatusValidator),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...updates } = args;
    await ctx.db.patch(taskId as any, updates);
  },
});

export const logExecution = internalMutation({
  args: {
    taskId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    level: v.union(
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
      v.literal("debug")
    ),
    message: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("executionLogs", {
      taskId: args.taskId as any,
      sessionId: args.sessionId as any,
      level: args.level,
      message: args.message,
      data: args.data,
      timestamp: Date.now(),
    });
  },
});

// ============================================================================
// Query Functions
// ============================================================================

export const listSessions = query({
  args: {
    status: v.optional(sessionStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("sessions"),
    status: sessionStatusValidator,
    browserbaseSessionId: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastActivityAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const sessions = args.status
      ? await ctx.db.query("sessions")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit)
      : await ctx.db.query("sessions")
          .order("desc")
          .take(limit);

    return sessions.map((s) => ({
      _id: s._id,
      status: s.status,
      browserbaseSessionId: s.browserbaseSessionId,
      currentUrl: s.currentUrl,
      createdAt: s.createdAt,
      lastActivityAt: s.lastActivityAt,
    }));
  },
});

export const listTasks = query({
  args: {
    sessionId: v.optional(v.string()),
    status: v.optional(taskStatusValidator),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("tasks"),
    type: taskTypeValidator,
    status: taskStatusValidator,
    instruction: v.string(),
    url: v.optional(v.string()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const tasks = args.sessionId
      ? await ctx.db.query("tasks")
          .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId as Id<"sessions">))
          .order("desc")
          .take(limit)
      : args.status
        ? await ctx.db.query("tasks")
            .withIndex("by_status", (q) => q.eq("status", args.status!))
            .order("desc")
            .take(limit)
        : await ctx.db.query("tasks")
            .order("desc")
            .take(limit);

    return tasks.map((t) => ({
      _id: t._id,
      type: t.type,
      status: t.status,
      instruction: t.instruction,
      url: t.url,
      result: t.result,
      error: t.error,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }));
  },
});

export const getLogs = query({
  args: {
    taskId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    level: v.optional(v.union(
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
      v.literal("debug")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("executionLogs"),
    level: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    timestamp: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const logs = args.taskId
      ? await ctx.db.query("executionLogs")
          .withIndex("by_task", (q) => q.eq("taskId", args.taskId as Id<"tasks">))
          .order("desc")
          .take(limit)
      : args.sessionId
        ? await ctx.db.query("executionLogs")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId as Id<"sessions">))
            .order("desc")
            .take(limit)
        : args.level
          ? await ctx.db.query("executionLogs")
              .withIndex("by_level", (q) => q.eq("level", args.level!))
              .order("desc")
              .take(limit)
          : await ctx.db.query("executionLogs")
              .order("desc")
              .take(limit);

    return logs.map((l) => ({
      _id: l._id,
      level: l.level,
      message: l.message,
      data: l.data,
      timestamp: l.timestamp,
    }));
  },
});

// ============================================================================
// Helper Functions (Simulated - would use real Browserbase/AI APIs)
// ============================================================================

async function initializeBrowserSession(args: {
  browserbaseApiKey: string;
  browserbaseProjectId: string;
  existingSessionId?: string;
}): Promise<{ id: string; connectUrl: string }> {
  // In production, this would call the Browserbase API
  // For now, return mock data for the component structure
  const sessionId = args.existingSessionId || `bb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return {
    id: sessionId,
    connectUrl: `wss://connect.browserbase.com/session/${sessionId}`,
  };
}

async function closeBrowserSession(args: {
  browserbaseApiKey: string;
  sessionId: string;
}): Promise<void> {
  // Would close the Browserbase session
  console.log(`Closing session: ${args.sessionId}`);
}

async function navigateToUrl(args: {
  cdpUrl: string;
  url: string;
  timeout: number;
  waitUntil: string;
}): Promise<void> {
  // Would use CDP to navigate
  console.log(`Navigating to: ${args.url}`);
}

async function performExtraction(args: {
  cdpUrl: string;
  instruction: string;
  schema: any;
  modelApiKey: string;
  modelName: string;
}): Promise<any> {
  // Would use AI to extract data based on schema
  console.log(`Extracting: ${args.instruction}`);
  return { extracted: true, instruction: args.instruction };
}

async function performAction(args: {
  cdpUrl: string;
  action: string;
  modelApiKey: string;
  modelName: string;
}): Promise<{ success: boolean; message: string; actionDescription: string }> {
  // Would use AI to perform browser action
  console.log(`Performing action: ${args.action}`);
  return {
    success: true,
    message: "Action completed successfully",
    actionDescription: args.action,
  };
}

async function performObservation(args: {
  cdpUrl: string;
  instruction: string;
  modelApiKey: string;
  modelName: string;
}): Promise<Array<{ description: string; selector: string; method: string; arguments?: string[] }>> {
  // Would use AI to find interactive elements
  console.log(`Observing: ${args.instruction}`);
  return [
    { description: "Search input", selector: "input[type='search']", method: "fill" },
    { description: "Submit button", selector: "button[type='submit']", method: "click" },
  ];
}

async function runAgent(args: {
  cdpUrl: string;
  instruction: string;
  modelApiKey: string;
  modelName: string;
  maxSteps: number;
  systemPrompt?: string;
}): Promise<{
  actions: Array<{ type: string; action?: string; reasoning?: string; timeMs?: number }>;
  completed: boolean;
  message: string;
  success: boolean;
}> {
  // Would run autonomous agent
  console.log(`Running agent: ${args.instruction}`);
  return {
    actions: [
      { type: "navigate", action: "Opened page", reasoning: "Starting task", timeMs: 1500 },
      { type: "act", action: "Clicked element", reasoning: "Found target", timeMs: 800 },
    ],
    completed: true,
    message: "Task completed successfully",
    success: true,
  };
}
