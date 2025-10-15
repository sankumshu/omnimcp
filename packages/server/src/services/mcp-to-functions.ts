/**
 * MCP to Function Converter
 * Converts MCP tool definitions to LLM function calling format
 */

import type { MCPServer, Tool } from '../types/index.js';
import { getMCPTools as getToolsFromDB } from './mcp-database.js';

/**
 * Build tools array from user's enabled MCPs
 * Converts MCP tools into format suitable for LLM function calling
 */
export async function buildToolsFromMCPs(
  enabledMCPs: MCPServer[]
): Promise<Tool[]> {
  const tools: Tool[] = [];

  for (const mcp of enabledMCPs) {
    // Check if MCP has tools defined directly (for locally registered MCPs)
    const mcpWithTools = mcp as any;
    if (mcpWithTools.tools && Array.isArray(mcpWithTools.tools)) {
      // Use tools from MCP definition
      for (const tool of mcpWithTools.tools) {
        tools.push({
          id: tool.id || `${mcp.id}_${tool.name}`,
          serverId: mcp.id,
          name: `${mcp.id}__${tool.name}`, // Namespace by MCP ID
          description: `[${mcp.name}] ${tool.description}`,
          parameters: tool.parameters,
          createdAt: tool.createdAt || new Date(),
        });
      }
    } else {
      // Fall back to database for database-backed MCPs
      const mcpTools = await getMCPTools(mcp.id);
      for (const tool of mcpTools) {
        tools.push({
          id: tool.id,
          serverId: mcp.id,
          name: `${mcp.id}__${tool.name}`, // Namespace by MCP ID
          description: `[${mcp.name}] ${tool.description}`,
          parameters: tool.parameters,
          createdAt: tool.createdAt,
        });
      }
    }
  }

  return tools;
}

/**
 * Parse namespaced tool call back to server + tool
 * e.g., "github__create_issue" -> { serverId: "github", toolName: "create_issue" }
 */
export function parseToolCall(namespacedTool: string): {
  serverId: string;
  toolName: string;
} {
  const [serverId, toolName] = namespacedTool.split('__');

  if (!serverId || !toolName) {
    throw new Error(`Invalid tool name format: ${namespacedTool}`);
  }

  return { serverId, toolName };
}

/**
 * Get tools for an MCP server
 */
async function getMCPTools(serverId: string): Promise<Tool[]> {
  return getToolsFromDB(serverId);
}

/**
 * Format tool call result for LLM
 */
export function formatToolResult(result: any): string {
  if (typeof result === 'string') {
    return result;
  }

  return JSON.stringify(result, null, 2);
}
