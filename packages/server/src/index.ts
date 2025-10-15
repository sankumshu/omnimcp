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
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from project root
const projectRoot = path.resolve(__dirname, '../../..');
config({ path: path.join(projectRoot, '.env') });

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize MCP Registry (singleton)
export const mcpRegistry = new MCPRegistry();

// Initialize MCPs on startup
async function initializeMCPs() {
  try {
    logger.info('Initializing MCPs...');

    // Get the project root (3 levels up from server/src/index.ts)
    const projectRoot = path.resolve(__dirname, '../../..');

    // Register Uber Eats MCP
    await mcpRegistry.register({
      id: 'ubereats',
      name: 'Uber Eats',
      description: 'Search restaurants, browse menus, and order food from Uber Eats',
      version: '1.0.0',
      hostingType: 'platform_hosted',
      status: 'active',
      tools: [
        {
          name: 'find_menu_options',
          description: 'Search for restaurants or food items on Uber Eats',
          parameters: {
            type: 'object',
            properties: {
              search_term: { type: 'string', description: 'What to search for (e.g., "pizza", "sushi near me")' },
            },
            required: ['search_term'],
          },
        },
        {
          name: 'order_food',
          description: 'Place a food order on Uber Eats',
          parameters: {
            type: 'object',
            properties: {
              item_url: { type: 'string', description: 'URL of the item to order' },
              item_name: { type: 'string', description: 'Name of the item' },
            },
            required: ['item_url', 'item_name'],
          },
        },
      ],
      config: {
        command: path.join(projectRoot, 'mcps/ubereats/venv/bin/python'),
        args: [path.join(projectRoot, 'mcps/ubereats/server.py')],
        cwd: path.join(projectRoot, 'mcps/ubereats'),
        env: {
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        },
      },
    });

    // Register Uber Rideshare MCP
    await mcpRegistry.register({
      id: 'uber',
      name: 'Uber',
      description: 'Book rides, get price estimates, and track Uber rides',
      version: '1.0.0',
      hostingType: 'platform_hosted',
      status: 'active',
      tools: [
        {
          name: 'uber_get_auth_url',
          description: 'Get OAuth authorization URL to connect Uber account',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Unique identifier for the user' },
            },
            required: ['userId'],
          },
        },
        {
          name: 'uber_get_price_estimates',
          description: 'Get price estimates for an Uber ride',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Unique identifier for the user' },
              startLatitude: { type: 'number', description: 'Starting latitude' },
              startLongitude: { type: 'number', description: 'Starting longitude' },
              endLatitude: { type: 'number', description: 'Destination latitude' },
              endLongitude: { type: 'number', description: 'Destination longitude' },
            },
            required: ['userId', 'startLatitude', 'startLongitude', 'endLatitude', 'endLongitude'],
          },
        },
        {
          name: 'uber_set_access_token',
          description: 'Set the access token for a user after OAuth callback',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Unique identifier for the user' },
              accessToken: { type: 'string', description: 'Uber access token for the user' },
            },
            required: ['userId', 'accessToken'],
          },
        },
        {
          name: 'uber_request_ride',
          description: 'Request an Uber ride',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Unique identifier for the user' },
              productId: { type: 'string', description: 'Uber product ID (from price estimates)' },
              startLatitude: { type: 'number', description: 'Pickup latitude' },
              startLongitude: { type: 'number', description: 'Pickup longitude' },
              endLatitude: { type: 'number', description: 'Destination latitude' },
              endLongitude: { type: 'number', description: 'Destination longitude' },
              fareId: { type: 'string', description: 'Fare ID from price estimate (optional)' },
            },
            required: ['userId', 'productId', 'startLatitude', 'startLongitude', 'endLatitude', 'endLongitude'],
          },
        },
        {
          name: 'uber_get_ride_status',
          description: 'Get the current status of a ride request',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Unique identifier for the user' },
              requestId: { type: 'string', description: 'Ride request ID' },
            },
            required: ['userId', 'requestId'],
          },
        },
        {
          name: 'uber_cancel_ride',
          description: 'Cancel an ongoing ride request',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Unique identifier for the user' },
              requestId: { type: 'string', description: 'Ride request ID to cancel' },
            },
            required: ['userId', 'requestId'],
          },
        },
      ],
      config: {
        command: 'node',
        args: [path.join(projectRoot, 'mcps/uber/dist/index.js')],
        env: {
          UBER_CLIENT_ID: process.env.UBER_CLIENT_ID || '',
          UBER_KEY_ID: process.env.UBER_KEY_ID || '',
          UBER_CREDENTIALS_PATH: process.env.UBER_CREDENTIALS_PATH || '',
          UBER_REDIRECT_URI: process.env.UBER_REDIRECT_URI || '',
          UBER_ENVIRONMENT: process.env.UBER_ENVIRONMENT || 'sandbox',
        },
      },
    });

    logger.info('✅ MCPs registered successfully');
  } catch (error) {
    logger.error('Failed to initialize MCPs:', error);
  }
}

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
app.listen(port, async () => {
  logger.info(`OmniMCP Platform server listening on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Initialize MCPs after server starts
  await initializeMCPs();
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
