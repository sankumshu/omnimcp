/**
 * Core types for the OmniMCP platform server
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type HostingType = 'platform_hosted' | 'developer_hosted';
export type ServerStatus = 'active' | 'inactive' | 'pending';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type RequestType = 'tool_call' | 'resource_read' | 'prompt_get';
export type RequestStatus = 'success' | 'error';

/**
 * User model
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  subscriptionTier: SubscriptionTier;
  apiKey: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCP Server model (supports both hosted and registered)
 */
export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  version: string;

  // Ownership
  ownerId?: string;
  isOfficial: boolean;

  // Hosting
  hostingType: HostingType;
  callbackUrl?: string; // For developer-hosted MCPs
  webhookSecret?: string;

  // Status
  status: ServerStatus;
  healthStatus: HealthStatus;
  lastHealthCheck?: Date;

  // Metadata
  tags?: string[];
  logoUrl?: string;
  documentationUrl?: string;

  // Stats
  installCount: number;
  requestCount: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tool definition
 */
export interface Tool {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  parameters: Record<string, any>; // JSON Schema
  createdAt: Date;
}

/**
 * Resource definition
 */
export interface Resource {
  id: string;
  serverId: string;
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  createdAt: Date;
}

/**
 * Prompt definition
 */
export interface Prompt {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  arguments?: Record<string, any>; // JSON Schema
  createdAt: Date;
}

/**
 * User MCP Installation
 */
export interface UserMCPInstallation {
  id: string;
  userId: string;
  serverId: string;
  config: Record<string, any>; // User-specific configuration
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request log
 */
export interface RequestLog {
  id: string;
  userId?: string;
  serverId?: string;
  requestType: RequestType;
  toolName?: string;
  status: RequestStatus;
  errorMessage?: string;
  responseTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Subscription limits
 */
export interface SubscriptionLimits {
  tier: SubscriptionTier;
  maxMcps: number; // -1 for unlimited
  maxRequestsPerMonth: number; // -1 for unlimited
  canCreateMcps: boolean;
}

/**
 * API Request/Response types
 */

// Auth
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'passwordHash'>;
}

// MCP Deployment
export interface DeployMCPRequest {
  name: string;
  description?: string;
  version?: string;
  hostingType: HostingType;
  callbackUrl?: string; // Required for developer-hosted
  tools: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>;
  resources?: Array<{
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
  }>;
  prompts?: Array<{
    name: string;
    description?: string;
    arguments?: Record<string, any>;
  }>;
  tags?: string[];
  logoUrl?: string;
  documentationUrl?: string;
}

export interface DeployMCPResponse {
  success: boolean;
  serverId?: string;
  serverUrl?: string;
  error?: string;
}

// MCP Installation
export interface InstallMCPRequest {
  serverId: string;
  config?: Record<string, any>;
}

export interface InstallMCPResponse {
  success: boolean;
  installationId?: string;
  error?: string;
}

// Tool Call (MCP Protocol)
export interface ToolCallRequest {
  serverId: string;
  toolName: string;
  arguments: Record<string, any>;
}

export interface ToolCallResponse {
  success: boolean;
  result?: any;
  error?: string;
}

// Resource Read
export interface ResourceReadRequest {
  serverId: string;
  uri: string;
}

export interface ResourceReadResponse {
  success: boolean;
  content?: string;
  mimeType?: string;
  error?: string;
}

// Marketplace
export interface MarketplaceListResponse {
  servers: Array<
    MCPServer & {
      tools: Tool[];
      resources: Resource[];
      prompts: Prompt[];
    }
  >;
  total: number;
}

/**
 * Visual Builder types (for V2)
 */
export interface VisualMCPConfig {
  tools: Array<{
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean' | 'array' | 'object';
      description?: string;
      required?: boolean;
    }>;
    action: {
      type: 'http_request' | 'database_query' | 'script';
      config: Record<string, any>;
    };
    responseMapping?: Record<string, string>;
  }>;
}

export interface VisualMCP {
  id: string;
  userId: string;
  serverId: string;
  config: VisualMCPConfig;
  createdAt: Date;
  updatedAt: Date;
}
