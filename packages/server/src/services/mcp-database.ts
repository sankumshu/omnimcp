/**
 * MCP Database Service
 * Handles all database operations for MCPs
 */

import { supabase } from '../db/supabase.js';
import type { MCPServer, Tool } from '../types/index.js';

/**
 * Get user's enabled MCPs with their tools
 */
export async function getUserEnabledMCPs(userId: string): Promise<MCPServer[]> {
  const { data, error } = await supabase
    .from('user_mcp_installations')
    .select(
      `
      *,
      mcp_servers (
        id,
        name,
        description,
        version,
        owner_id,
        is_official,
        hosting_type,
        callback_url,
        webhook_secret,
        status,
        health_status,
        tags,
        logo_url,
        documentation_url,
        install_count,
        request_count,
        created_at,
        updated_at
      )
    `
    )
    .eq('user_id', userId)
    .eq('enabled', true)
    .eq('mcp_servers.status', 'active');

  if (error) {
    throw new Error(`Failed to fetch enabled MCPs: ${error.message}`);
  }

  return (data || [])
    .filter((install) => install.mcp_servers)
    .map((install) => {
      const server = install.mcp_servers as any;
      return {
        id: server.id,
        name: server.name,
        description: server.description,
        version: server.version || '1.0.0',
        ownerId: server.owner_id,
        isOfficial: server.is_official,
        hostingType: server.hosting_type,
        callbackUrl: server.callback_url,
        webhookSecret: server.webhook_secret,
        status: server.status,
        healthStatus: server.health_status,
        lastHealthCheck: server.last_health_check
          ? new Date(server.last_health_check)
          : undefined,
        tags: server.tags,
        logoUrl: server.logo_url,
        documentationUrl: server.documentation_url,
        installCount: server.install_count,
        requestCount: server.request_count,
        createdAt: new Date(server.created_at),
        updatedAt: new Date(server.updated_at),
      } as MCPServer;
    });
}

/**
 * Get tools for an MCP server
 */
export async function getMCPTools(serverId: string): Promise<Tool[]> {
  const { data, error} = await supabase
    .from('mcp_tools')
    .select('*')
    .eq('server_id', serverId);

  if (error) {
    throw new Error(`Failed to fetch MCP tools: ${error.message}`);
  }

  return (data || []).map((tool) => ({
    id: tool.id,
    serverId: tool.server_id,
    name: tool.name,
    description: tool.description || '',
    parameters: tool.parameters as Record<string, any>,
    createdAt: new Date(tool.created_at),
  }));
}

/**
 * Get MCP server by ID
 */
export async function getMCPServer(serverId: string): Promise<MCPServer | null> {
  const { data, error } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('id', serverId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    version: data.version,
    ownerId: data.owner_id,
    isOfficial: data.is_official,
    hostingType: data.hosting_type,
    callbackUrl: data.callback_url,
    webhookSecret: data.webhook_secret,
    status: data.status,
    healthStatus: data.health_status,
    lastHealthCheck: data.last_health_check
      ? new Date(data.last_health_check)
      : undefined,
    tags: data.tags,
    logoUrl: data.logo_url,
    documentationUrl: data.documentation_url,
    installCount: data.install_count,
    requestCount: data.request_count,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } as MCPServer;
}

/**
 * Install MCP for user
 */
export async function installMCPForUser(
  userId: string,
  serverId: string,
  config: Record<string, any> = {}
): Promise<void> {
  const { error } = await supabase.from('user_mcp_installations').insert({
    user_id: userId,
    server_id: serverId,
    config,
    enabled: true,
  });

  if (error) {
    throw new Error(`Failed to install MCP: ${error.message}`);
  }

  // Increment install count
  const { error: updateError } = await supabase.rpc('increment_install_count', {
    server_id: serverId,
  });

  if (updateError) {
    console.error('Failed to increment install count:', updateError);
  }
}

/**
 * Uninstall MCP for user
 */
export async function uninstallMCPForUser(
  userId: string,
  serverId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_mcp_installations')
    .delete()
    .eq('user_id', userId)
    .eq('server_id', serverId);

  if (error) {
    throw new Error(`Failed to uninstall MCP: ${error.message}`);
  }
}

/**
 * Toggle MCP enabled state
 */
export async function toggleMCPEnabled(
  userId: string,
  serverId: string,
  enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from('user_mcp_installations')
    .update({ enabled })
    .eq('user_id', userId)
    .eq('server_id', serverId);

  if (error) {
    throw new Error(`Failed to toggle MCP: ${error.message}`);
  }
}

/**
 * Get all MCPs in marketplace
 */
export async function getAllMCPs(): Promise<MCPServer[]> {
  const { data, error } = await supabase
    .from('mcp_servers')
    .select('*')
    .eq('status', 'active')
    .order('install_count', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch MCPs: ${error.message}`);
  }

  return (data || []).map((server) => ({
    id: server.id,
    name: server.name,
    description: server.description,
    version: server.version,
    ownerId: server.owner_id,
    isOfficial: server.is_official,
    hostingType: server.hosting_type,
    callbackUrl: server.callback_url,
    webhookSecret: server.webhook_secret,
    status: server.status,
    healthStatus: server.health_status,
    lastHealthCheck: server.last_health_check
      ? new Date(server.last_health_check)
      : undefined,
    tags: server.tags,
    logoUrl: server.logo_url,
    documentationUrl: server.documentation_url,
    installCount: server.install_count,
    requestCount: server.request_count,
    createdAt: new Date(server.created_at),
    updatedAt: new Date(server.updated_at),
  })) as MCPServer[];
}

/**
 * Create new MCP server
 */
export async function createMCPServer(
  ownerId: string,
  serverData: {
    name: string;
    description?: string;
    version?: string;
    hostingType: 'platform_hosted' | 'developer_hosted';
    callbackUrl?: string;
    webhookSecret?: string;
    tags?: string[];
  }
): Promise<MCPServer> {
  const { data, error } = await supabase
    .from('mcp_servers')
    .insert({
      owner_id: ownerId,
      name: serverData.name,
      description: serverData.description,
      version: serverData.version || '1.0.0',
      hosting_type: serverData.hostingType,
      callback_url: serverData.callbackUrl,
      webhook_secret: serverData.webhookSecret,
      tags: serverData.tags,
      status: 'active',
      health_status: 'unknown',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create MCP server: ${error.message}`);
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    version: data.version,
    ownerId: data.owner_id,
    isOfficial: data.is_official,
    hostingType: data.hosting_type,
    callbackUrl: data.callback_url,
    webhookSecret: data.webhook_secret,
    status: data.status,
    healthStatus: data.health_status,
    tags: data.tags,
    logoUrl: data.logo_url,
    documentationUrl: data.documentation_url,
    installCount: data.install_count,
    requestCount: data.request_count,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  } as MCPServer;
}

/**
 * Add tools to MCP server
 */
export async function addToolsToMCP(
  serverId: string,
  tools: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>
): Promise<void> {
  const { error } = await supabase.from('mcp_tools').insert(
    tools.map((tool) => ({
      server_id: serverId,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }))
  );

  if (error) {
    throw new Error(`Failed to add tools: ${error.message}`);
  }
}
