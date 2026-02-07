/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as browserUse from "../browserUse.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  browserUse: typeof browserUse;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  browserUse: {
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
        { actionDescription: string; message: string; success: boolean }
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
        }
      >;
      endSession: FunctionReference<
        "action",
        "internal",
        { browserbaseApiKey?: string; sessionId: string },
        { success: boolean }
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
        any
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
        }>
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
        }>
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
        }>
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
        }>
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
        { browserbaseSessionId?: string; cdpUrl?: string; sessionId: string }
      >;
    };
  };
};
