/**
 * OmniMCP Platform Server
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { MCPRegistry } from './registry/mcp-registry.js';
import { authRouter } from './routes/auth.js';
import { mcpRouter } from './routes/mcp.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler } from './middleware/error-handler.js';

// Load environment variables
config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize MCP Registry (singleton)
export const mcpRegistry = new MCPRegistry();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

// Root endpoint - API information
app.get('/', (req, res) => {
  res.json({
    name: 'OmniMCP Platform API',
    version: '0.1.0',
    description: 'Connect any MCP server to any LLM with a single integration',
    endpoints: {
      health: 'GET /health',
      chat: {
        models: 'GET /api/chat/models',
        chat: 'POST /api/chat',
        simpleChat: 'POST /api/chat/simple',
      },
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
      },
      mcp: {
        list: 'GET /api/mcp',
        register: 'POST /api/mcp/register',
        call: 'POST /mcp/call',
      },
      marketplace: {
        browse: 'GET /api/marketplace',
        featured: 'GET /api/marketplace/featured',
        search: 'GET /api/marketplace/search',
      },
    },
    documentation: 'https://github.com/yourusername/omnimcp',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/chat', chatRouter);

// MCP Protocol endpoint (for LLMs to connect)
app.post('/mcp/call', async (req, res) => {
  try {
    const { serverId, toolName, arguments: args } = req.body;

    const result = await mcpRegistry.callTool({
      serverId,
      toolName,
      arguments: args,
    });

    res.json(result);
  } catch (error: any) {
    logger.error({ error }, 'MCP call failed');
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`OmniMCP Platform server listening on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
