/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      act: FunctionReference<
        "action",
        "internal",
        {
          action: string;
          browserbaseApiKey?: string;
          browserbaseProjectId?: string;
          modelApiKey?: string;
          modelName?: string;
          options?: { timeout?: number; waitUntil?: string };
          sessionId?: string;
          url?: string;
        },
        { actionDescription: string; message: string; success: boolean },
        Name
      >;
      agent: FunctionReference<
        "action",
        "internal",
        {
          browserbaseApiKey?: string;
          browserbaseProjectId?: string;
          instruction: string;
          modelApiKey?: string;
          modelName?: string;
          options?: {
            maxSteps?: number;
            systemPrompt?: string;
            timeout?: number;
            waitUntil?: string;
          };
          sessionId?: string;
          url?: string;
        },
        {
          actions: Array<{
            action?: string;
            reasoning?: string;
            timeMs?: number;
            type: string;
          }>;
          completed: boolean;
          message: string;
          success: boolean;
        },
        Name
      >;
      endSession: FunctionReference<
        "action",
        "internal",
        { browserbaseApiKey?: string; sessionId: string },
        { success: boolean },
        Name
      >;
      extract: FunctionReference<
        "action",
        "internal",
        {
          browserbaseApiKey?: string;
          browserbaseProjectId?: string;
          instruction: string;
          modelApiKey?: string;
          modelName?: string;
          options?: { timeout?: number; waitUntil?: string };
          schema: any;
          sessionId?: string;
          url?: string;
        },
        any,
        Name
      >;
      getLogs: FunctionReference<
        "query",
        "internal",
        {
          level?: "info" | "warn" | "error" | "debug";
          limit?: number;
          sessionId?: string;
          taskId?: string;
        },
        Array<{
          _id: string;
          data?: any;
          level: string;
          message: string;
          timestamp: number;
        }>,
        Name
      >;
      listSessions: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          status?: "starting" | "active" | "idle" | "ended" | "error";
        },
        Array<{
          _id: string;
          browserbaseSessionId?: string;
          createdAt: number;
          currentUrl?: string;
          lastActivityAt: number;
          status: "starting" | "active" | "idle" | "ended" | "error";
        }>,
        Name
      >;
      listTasks: FunctionReference<
        "query",
        "internal",
        {
          limit?: number;
          sessionId?: string;
          status?: "pending" | "running" | "completed" | "failed" | "cancelled";
        },
        Array<{
          _id: string;
          completedAt?: number;
          createdAt: number;
          error?: string;
          instruction: string;
          result?: any;
          status: "pending" | "running" | "completed" | "failed" | "cancelled";
          type:
            | "navigate"
            | "extract"
            | "act"
            | "observe"
            | "agent"
            | "screenshot";
          url?: string;
        }>,
        Name
      >;
      observe: FunctionReference<
        "action",
        "internal",
        {
          browserbaseApiKey?: string;
          browserbaseProjectId?: string;
          instruction?: string;
          modelApiKey?: string;
          modelName?: string;
          options?: { timeout?: number; waitUntil?: string };
          sessionId?: string;
          url?: string;
        },
        Array<{
          arguments?: Array<string>;
          description: string;
          method: string;
          selector: string;
        }>,
        Name
      >;
      startSession: FunctionReference<
        "action",
        "internal",
        {
          browserbaseApiKey?: string;
          browserbaseProjectId?: string;
          browserbaseSessionId?: string;
          modelApiKey?: string;
          modelName?: string;
          options?: {
            timeout?: number;
            userAgent?: string;
            viewport?: { height: number; width: number };
            waitUntil?: "load" | "domcontentloaded" | "networkidle";
          };
          url?: string;
        },
        { browserbaseSessionId?: string; cdpUrl?: string; sessionId: string },
        Name
      >;
    };
  };
