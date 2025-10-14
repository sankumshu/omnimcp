/**
 * Type definitions for the OmniMCP SDK
 */

import { z } from 'zod';

/**
 * SDK Configuration
 */
export interface OmniMCPConfig {
  /** Your OmniMCP platform API key */
  apiKey: string;
  /** Name of your MCP server */
  name: string;
  /** Description of your MCP server */
  description?: string;
  /** Version of your MCP server */
  version?: string;
  /** Base URL of the OmniMCP platform (defaults to production) */
  baseUrl?: string;
}

/**
 * Tool parameter schema using Zod
 */
export type ToolParameterSchema = z.ZodType<any, any, any>;

/**
 * Tool definition
 */
export interface ToolDefinition<TParams = any, TResult = any> {
  /** Unique name for the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Zod schema for parameters */
  parameters: ToolParameterSchema;
  /** Handler function that executes the tool */
  handler: (params: TParams) => Promise<TResult> | TResult;
}

/**
 * Resource definition
 */
export interface ResourceDefinition<TContent = any> {
  /** Unique URI for the resource */
  uri: string;
  /** Name of the resource */
  name: string;
  /** Description of the resource */
  description?: string;
  /** MIME type of the resource content */
  mimeType?: string;
  /** Handler function that returns the resource content */
  handler: () => Promise<TContent> | TContent;
}

/**
 * Prompt definition
 */
export interface PromptDefinition<TArgs = any> {
  /** Unique name for the prompt */
  name: string;
  /** Description of the prompt */
  description?: string;
  /** Arguments schema */
  arguments?: ToolParameterSchema;
  /** Handler function that generates the prompt */
  handler: (args: TArgs) => Promise<string> | string;
}

/**
 * Deployment result
 */
export interface DeploymentResult {
  /** Whether deployment was successful */
  success: boolean;
  /** Deployment ID */
  deploymentId?: string;
  /** MCP server URL on the platform */
  serverUrl?: string;
  /** Error message if deployment failed */
  error?: string;
}

/**
 * Server status
 */
export interface ServerStatus {
  /** Whether the server is active */
  active: boolean;
  /** Number of requests handled */
  requestCount: number;
  /** Last request timestamp */
  lastRequestAt?: Date;
  /** Server health status */
  health: 'healthy' | 'degraded' | 'unhealthy';
}
