/**
 * OmniMCP SDK Client
 * Main entry point for developers to build and deploy MCP servers
 */

import axios, { AxiosInstance } from 'axios';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  OmniMCPConfig,
  ToolDefinition,
  ResourceDefinition,
  PromptDefinition,
  DeploymentResult,
  ServerStatus,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api.omnimcp.io';

/**
 * OmniMCP SDK Client
 *
 * @example
 * ```typescript
 * import { OmniMCP } from '@omnimcp/sdk';
 * import { z } from 'zod';
 *
 * const mcp = new OmniMCP({
 *   apiKey: process.env.OMNIMCP_API_KEY!,
 *   name: 'my-weather-tool',
 *   description: 'Get weather information',
 * });
 *
 * mcp.tool({
 *   name: 'get_weather',
 *   description: 'Get current weather for a location',
 *   parameters: z.object({
 *     location: z.string(),
 *   }),
 *   handler: async ({ location }) => {
 *     // Your implementation
 *     return { temperature: 72, condition: 'sunny' };
 *   },
 * });
 *
 * await mcp.deploy();
 * ```
 */
export class OmniMCP {
  private config: Required<OmniMCPConfig>;
  private tools: Map<string, ToolDefinition> = new Map();
  private resources: Map<string, ResourceDefinition> = new Map();
  private prompts: Map<string, PromptDefinition> = new Map();
  private server: Server;
  private apiClient: AxiosInstance;

  constructor(config: OmniMCPConfig) {
    this.config = {
      ...config,
      description: config.description || '',
      version: config.version || '1.0.0',
      baseUrl: config.baseUrl || DEFAULT_BASE_URL,
    };

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.config.name,
        version: this.config.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize API client
    this.apiClient = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    this.setupHandlers();
  }

  /**
   * Register a tool
   */
  public tool<TParams = any, TResult = any>(
    definition: ToolDefinition<TParams, TResult>
  ): this {
    this.tools.set(definition.name, definition);
    return this;
  }

  /**
   * Register a resource
   */
  public resource<TContent = any>(
    definition: ResourceDefinition<TContent>
  ): this {
    this.resources.set(definition.uri, definition);
    return this;
  }

  /**
   * Register a prompt
   */
  public prompt<TArgs = any>(definition: PromptDefinition<TArgs>): this {
    this.prompts.set(definition.name, definition);
    return this;
  }

  /**
   * Deploy the MCP server to the OmniMCP platform
   */
  public async deploy(): Promise<DeploymentResult> {
    try {
      const response = await this.apiClient.post<DeploymentResult>(
        '/v1/servers/deploy',
        {
          name: this.config.name,
          description: this.config.description,
          version: this.config.version,
          tools: Array.from(this.tools.values()).map((t) => ({
            name: t.name,
            description: t.description,
            parameters: this.zodToJsonSchema(t.parameters),
          })),
          resources: Array.from(this.resources.values()).map((r) => ({
            uri: r.uri,
            name: r.name,
            description: r.description,
            mimeType: r.mimeType,
          })),
          prompts: Array.from(this.prompts.values()).map((p) => ({
            name: p.name,
            description: p.description,
            arguments: p.arguments
              ? this.zodToJsonSchema(p.arguments)
              : undefined,
          })),
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Get server status from the platform
   */
  public async status(): Promise<ServerStatus> {
    const response = await this.apiClient.get<ServerStatus>(
      `/v1/servers/${this.config.name}/status`
    );
    return response.data;
  }

  /**
   * Start the MCP server locally (for development)
   */
  public async startLocal(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  /**
   * Setup MCP protocol handlers
   */
  private setupHandlers(): void {
    // List tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()).map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: this.zodToJsonSchema(t.parameters),
      })),
    }));

    // Call tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      // Validate parameters
      const validatedParams = tool.parameters.parse(request.params.arguments);

      // Execute handler
      const result = await tool.handler(validatedParams);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: Array.from(this.resources.values()).map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = this.resources.get(request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }

      const content = await resource.handler();

      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || 'text/plain',
            text: typeof content === 'string' ? content : JSON.stringify(content),
          },
        ],
      };
    });

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => ({
      prompts: Array.from(this.prompts.values()).map((p) => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments
          ? this.zodToJsonSchema(p.arguments)
          : undefined,
      })),
    }));

    // Get prompt
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = this.prompts.get(request.params.name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }

      const args = prompt.arguments
        ? prompt.arguments.parse(request.params.arguments)
        : {};

      const text = await prompt.handler(args);

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text,
            },
          },
        ],
      };
    });
  }

  /**
   * Convert Zod schema to JSON Schema
   */
  private zodToJsonSchema(schema: any): any {
    // Simplified conversion - in production, use a library like zod-to-json-schema
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
