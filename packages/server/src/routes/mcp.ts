/**
 * MCP management routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { mcpRegistry } from '../index.js';
import type { DeployMCPRequest, InstallMCPRequest } from '../types/index.js';

export const mcpRouter = Router();

/**
 * POST /api/mcp/deploy
 * Deploy a new MCP server
 */
mcpRouter.post('/deploy', async (req: Request, res: Response) => {
  try {
    const deployRequest = req.body as DeployMCPRequest;

    // TODO: Implement MCP deployment
    // - Validate user has permission (subscription tier)
    // - Create MCP server record
    // - Register with MCP registry
    // - If platform_hosted: spin up server
    // - If developer_hosted: validate callback URL
    // - Create tools/resources/prompts records

    const serverId = 'generated_server_id';

    res.status(201).json({
      success: true,
      serverId,
      serverUrl: `https://api.omnimcp.io/mcp/${serverId}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/mcp/:serverId/status
 * Get MCP server status
 */
mcpRouter.get('/:serverId/status', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    const server = await mcpRegistry.get(serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }

    // Perform health check
    const isHealthy = await mcpRegistry.healthCheck(serverId);

    res.json({
      success: true,
      status: {
        active: server.status === 'active',
        health: isHealthy ? 'healthy' : 'unhealthy',
        requestCount: server.requestCount,
        installCount: server.installCount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/mcp/install
 * Install an MCP for the current user
 */
mcpRouter.post('/install', async (req: Request, res: Response) => {
  try {
    const { serverId, config } = req.body as InstallMCPRequest;

    // TODO: Implement MCP installation
    // - Get current user from JWT
    // - Check subscription limits
    // - Check if server exists
    // - Create user_mcp_installation record
    // - Increment install count

    res.json({
      success: true,
      installationId: 'generated_installation_id',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/mcp/installed
 * Get all MCPs installed by the current user
 */
mcpRouter.get('/installed', async (req: Request, res: Response) => {
  try {
    // TODO: Get current user from JWT
    // TODO: Query user_mcp_installations

    res.json({
      success: true,
      installations: [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/mcp/:serverId
 * Delete/unpublish an MCP server (owner only)
 */
mcpRouter.delete('/:serverId', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    // TODO: Implement MCP deletion
    // - Verify user is owner
    // - Remove from registry
    // - Delete from database
    // - Clean up installations

    res.json({
      success: true,
      message: 'MCP server deleted',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
