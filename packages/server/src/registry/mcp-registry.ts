/**
 * MCP Registry
 * Manages both platform-hosted and developer-hosted MCP servers
 */

import axios from 'axios';
import type {
  MCPServer,
  Tool,
  ToolCallRequest,
  ToolCallResponse,
  ResourceReadRequest,
  ResourceReadResponse,
} from '../types/index.js';

export interface IMCPRegistry {
  /**
   * Register a new MCP server
   */
  register(server: MCPServer): Promise<void>;

  /**
   * Unregister an MCP server
   */
  unregister(serverId: string): Promise<void>;

  /**
   * Get an MCP server by ID
   */
  get(serverId: string): Promise<MCPServer | undefined>;

  /**
   * Get all registered MCP servers
   */
  getAll(): Promise<MCPServer[]>;

  /**
   * Call a tool on an MCP server
   */
  callTool(request: ToolCallRequest): Promise<ToolCallResponse>;

  /**
   * Read a resource from an MCP server
   */
  readResource(request: ResourceReadRequest): Promise<ResourceReadResponse>;

  /**
   * Health check an MCP server
   */
  healthCheck(serverId: string): Promise<boolean>;
}

/**
 * In-memory MCP Registry implementation
 * In production, this would be backed by the database
 */
export class MCPRegistry implements IMCPRegistry {
  private servers: Map<string, MCPServer> = new Map();

  async register(server: MCPServer): Promise<void> {
    this.servers.set(server.id, server);
  }

  async unregister(serverId: string): Promise<void> {
    this.servers.delete(serverId);
  }

  async get(serverId: string): Promise<MCPServer | undefined> {
    return this.servers.get(serverId);
  }

  async getAll(): Promise<MCPServer[]> {
    return Array.from(this.servers.values());
  }

  async callTool(request: ToolCallRequest): Promise<ToolCallResponse> {
    const server = await this.get(request.serverId);

    if (!server) {
      return {
        success: false,
        error: `Server not found: ${request.serverId}`,
      };
    }

    if (server.status !== 'active') {
      return {
        success: false,
        error: `Server is not active: ${server.status}`,
      };
    }

    // Route based on hosting type
    if (server.hostingType === 'platform_hosted') {
      return this.callPlatformHostedTool(server, request);
    } else {
      return this.callDeveloperHostedTool(server, request);
    }
  }

  async readResource(
    request: ResourceReadRequest
  ): Promise<ResourceReadResponse> {
    const server = await this.get(request.serverId);

    if (!server) {
      return {
        success: false,
        error: `Server not found: ${request.serverId}`,
      };
    }

    if (server.status !== 'active') {
      return {
        success: false,
        error: `Server is not active: ${server.status}`,
      };
    }

    // Route based on hosting type
    if (server.hostingType === 'platform_hosted') {
      return this.readPlatformHostedResource(server, request);
    } else {
      return this.readDeveloperHostedResource(server, request);
    }
  }

  async healthCheck(serverId: string): Promise<boolean> {
    const server = await this.get(serverId);

    if (!server) {
      return false;
    }

    try {
      if (server.hostingType === 'developer_hosted' && server.callbackUrl) {
        // Ping the developer's callback URL
        const response = await axios.get(`${server.callbackUrl}/health`, {
          timeout: 5000,
        });
        return response.status === 200;
      } else {
        // Platform-hosted servers are assumed healthy if registered
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Call a tool on a platform-hosted MCP
   */
  private async callPlatformHostedTool(
    server: MCPServer,
    request: ToolCallRequest
  ): Promise<ToolCallResponse> {
    try {
      // Import process manager dynamically to avoid circular dependency
      const { mcpProcessManager } = await import('../services/mcp-process-manager.js');

      // Check if MCP process is running, spawn if needed
      if (!mcpProcessManager.isRunning(server.id)) {
        // Get config from server metadata (stored during registration)
        const config = (server as any).config;
        if (!config) {
          return {
            success: false,
            error: `No process config found for MCP: ${server.id}`,
          };
        }

        await mcpProcessManager.spawn({
          id: server.id,
          command: config.command,
          args: config.args,
          cwd: config.cwd,
          env: config.env,
        });
      }

      // Call the tool via process manager
      const result = await mcpProcessManager.callTool(
        server.id,
        request.toolName,
        request.arguments
      );

      return {
        success: true,
        result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Call a tool on a developer-hosted MCP via callback
   */
  private async callDeveloperHostedTool(
    server: MCPServer,
    request: ToolCallRequest
  ): Promise<ToolCallResponse> {
    if (!server.callbackUrl) {
      return {
        success: false,
        error: 'No callback URL configured for developer-hosted MCP',
      };
    }

    try {
      const response = await axios.post<ToolCallResponse>(
        `${server.callbackUrl}/tools/${request.toolName}`,
        {
          arguments: request.arguments,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Secret': server.webhookSecret,
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Read a resource from a platform-hosted MCP
   */
  private async readPlatformHostedResource(
    server: MCPServer,
    request: ResourceReadRequest
  ): Promise<ResourceReadResponse> {
    try {
      // In production, this would read from the actual MCP server
      return {
        success: true,
        content: `Resource content for ${request.uri}`,
        mimeType: 'text/plain',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Read a resource from a developer-hosted MCP via callback
   */
  private async readDeveloperHostedResource(
    server: MCPServer,
    request: ResourceReadRequest
  ): Promise<ResourceReadResponse> {
    if (!server.callbackUrl) {
      return {
        success: false,
        error: 'No callback URL configured for developer-hosted MCP',
      };
    }

    try {
      const response = await axios.get<ResourceReadResponse>(
        `${server.callbackUrl}/resources`,
        {
          params: { uri: request.uri },
          headers: {
            'X-Webhook-Secret': server.webhookSecret,
          },
          timeout: 30000,
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}
