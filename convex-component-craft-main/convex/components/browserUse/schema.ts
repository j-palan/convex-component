import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Browser Use Component Schema
 * 
 * Tracks browser sessions, tasks, and execution history.
 */
export default defineSchema({
  // Active browser sessions
  sessions: defineTable({
    status: v.union(
      v.literal("starting"),
      v.literal("active"),
      v.literal("idle"),
      v.literal("ended"),
      v.literal("error")
    ),
    browserbaseSessionId: v.optional(v.string()),
    cdpUrl: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
    createdAt: v.number(),
    lastActivityAt: v.number(),
    metadata: v.optional(v.object({
      userAgent: v.optional(v.string()),
      viewport: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
    })),
  }).index("by_status", ["status"]),

  // Automation tasks queue
  tasks: defineTable({
    sessionId: v.optional(v.id("sessions")),
    type: v.union(
      v.literal("navigate"),
      v.literal("extract"),
      v.literal("act"),
      v.literal("observe"),
      v.literal("agent"),
      v.literal("screenshot")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    instruction: v.string(),
    url: v.optional(v.string()),
    schema: v.optional(v.any()), // Zod schema as JSON
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    retryCount: v.number(),
    maxRetries: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Execution history for debugging
  executionLogs: defineTable({
    taskId: v.optional(v.id("tasks")),
    sessionId: v.optional(v.id("sessions")),
    level: v.union(
      v.literal("info"),
      v.literal("warn"),
      v.literal("error"),
      v.literal("debug")
    ),
    message: v.string(),
    data: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_session", ["sessionId"])
    .index("by_level", ["level"]),

  // Workflow definitions
  workflows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    steps: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("navigate"),
        v.literal("extract"),
        v.literal("act"),
        v.literal("observe"),
        v.literal("condition"),
        v.literal("loop")
      ),
      instruction: v.string(),
      config: v.optional(v.any()),
      onSuccess: v.optional(v.string()), // Next step ID
      onFailure: v.optional(v.string()), // Step ID on failure
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  // Workflow executions
  workflowRuns: defineTable({
    workflowId: v.id("workflows"),
    sessionId: v.optional(v.id("sessions")),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    currentStepId: v.optional(v.string()),
    completedSteps: v.array(v.string()),
    context: v.optional(v.any()), // Accumulated data from steps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"]),
});
