/**
 * Marketplace routes
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { mcpRegistry } from '../index.js';

export const marketplaceRouter = Router();

/**
 * GET /api/marketplace
 * List all available MCPs in the marketplace
 */
marketplaceRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, tags, category, sort } = req.query;

    // TODO: Implement marketplace listing
    // - Query mcp_servers table
    // - Filter by search query
    // - Filter by tags
    // - Sort by popularity, recent, etc.
    // - Include tools/resources/prompts count

    const servers = await mcpRegistry.getAll();

    res.json({
      success: true,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        isOfficial: s.isOfficial,
        installCount: s.installCount,
        tags: s.tags,
        logoUrl: s.logoUrl,
      })),
      total: servers.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/marketplace/:serverId
 * Get detailed information about an MCP
 */
marketplaceRouter.get('/:serverId', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;

    const server = await mcpRegistry.get(serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found',
      });
    }

    // TODO: Get tools, resources, prompts from database

    res.json({
      success: true,
      server: {
        ...server,
        tools: [],
        resources: [],
        prompts: [],
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
 * GET /api/marketplace/featured
 * Get featured MCPs (official + popular)
 */
marketplaceRouter.get('/featured', async (req: Request, res: Response) => {
  try {
    // TODO: Query featured MCPs
    // - Official MCPs
    // - High install count
    // - High quality

    res.json({
      success: true,
      featured: [],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
