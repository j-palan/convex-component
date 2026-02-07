/**
 * Top-level wrapper functions that expose the browserUse component's API
 * to the frontend. Component functions are "internal" from the app's
 * perspective, so we create public query/action wrappers here.
 *
 * IMPORTANT: Convex components are sandboxed and cannot read the parent
 * app's process.env. So we read the env vars here (app level) and pass
 * them as arguments to the component functions.
 */

import { v } from "convex/values";
import { query, action } from "./_generated/server";
import { components } from "./_generated/api";

/** Read API keys from the app's environment (Convex Dashboard). */
function getKeys() {
  const browserbaseApiKey = process.env.BROWSERBASE_API_KEY;
  const browserbaseProjectId = process.env.BROWSERBASE_PROJECT_ID;
  const modelApiKey =
    process.env.OPENAI_API_KEY ?? process.env.MODEL_API_KEY;

  if (!browserbaseApiKey || !browserbaseProjectId) {
    throw new Error(
      "Missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID. " +
        "Set them in Convex Dashboard → Settings → Environment Variables."
    );
  }
  if (!modelApiKey) {
    throw new Error(
      "Missing OPENAI_API_KEY (or MODEL_API_KEY). " +
        "Set it in Convex Dashboard → Settings → Environment Variables."
    );
  }
  return { browserbaseApiKey, browserbaseProjectId, modelApiKey };
}

// ============================================================================
// Public Queries (reactive, used by useQuery on the client)
// ============================================================================

export const listSessions = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("starting"),
        v.literal("active"),
        v.literal("idle"),
        v.literal("ended"),
        v.literal("error")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.browserUse.lib.listSessions, args);
  },
});

export const listTasks = query({
  args: {
    sessionId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.browserUse.lib.listTasks, args);
  },
});

export const getLogs = query({
  args: {
    taskId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    level: v.optional(
      v.union(
        v.literal("info"),
        v.literal("warn"),
        v.literal("error"),
        v.literal("debug")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.browserUse.lib.getLogs, args);
  },
});

// ============================================================================
// Public Actions (called by useAction / useMutation on the client)
// ============================================================================

export const startSession = action({
  args: {
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const keys = getKeys();
    return await ctx.runAction(components.browserUse.lib.startSession, {
      url: args.url,
      ...keys,
    });
  },
});

export const endSession = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const { browserbaseApiKey } = getKeys();
    return await ctx.runAction(components.browserUse.lib.endSession, {
      sessionId: args.sessionId,
      browserbaseApiKey,
    });
  },
});

export const runExtraction = action({
  args: {
    url: v.string(),
    instruction: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const keys = getKeys();
    return await ctx.runAction(components.browserUse.lib.extract, {
      url: args.url,
      instruction: args.instruction,
      sessionId: args.sessionId,
      schema: { type: "object" },
      ...keys,
    });
  },
});

export const runAction = action({
  args: {
    url: v.string(),
    instruction: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const keys = getKeys();
    return await ctx.runAction(components.browserUse.lib.act, {
      url: args.url,
      action: args.instruction,
      sessionId: args.sessionId,
      ...keys,
    });
  },
});

export const runAgent = action({
  args: {
    url: v.string(),
    instruction: v.string(),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const keys = getKeys();
    return await ctx.runAction(components.browserUse.lib.agent, {
      url: args.url,
      instruction: args.instruction,
      sessionId: args.sessionId,
      ...keys,
    });
  },
});
