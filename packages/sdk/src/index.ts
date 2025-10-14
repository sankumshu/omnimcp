/**
 * @omnimcp/sdk
 * Official SDK for building MCP servers on the OmniMCP platform
 */

export { OmniMCP } from './client.js';
export type {
  OmniMCPConfig,
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  DeploymentResult,
  ServerStatus,
  ToolParameterSchema,
} from './types.js';

// Re-export zod for convenience
export { z } from 'zod';
