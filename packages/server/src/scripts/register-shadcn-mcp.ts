/**
 * Script to register the shadcn MCP server
 * Run with: npx tsx src/scripts/register-shadcn-mcp.ts
 */

import { mcpRegistry } from '../index.js';
import type { MCPServer } from '../types/index.js';

async function registerShadcnMCP() {
  const shadcnServer: MCPServer = {
    id: 'shadcn-mcp',
    name: 'shadcn/ui MCP',
    description: 'Add and configure shadcn/ui components to your project',
    version: '1.0.0',
    ownerId: 'system',
    isOfficial: true,
    hostingType: 'platform_hosted',
    status: 'active',
    healthStatus: 'healthy',
    tags: ['ui', 'components', 'shadcn', 'react'],
    installCount: 0,
    requestCount: 0,
    tools: [
      {
        name: 'add-component',
        description: 'Add a shadcn/ui component to your project',
        parameters: {
          component: {
            type: 'string',
            description: 'Component name (e.g., button, card, dialog)',
            required: true,
          },
          overwrite: {
            type: 'boolean',
            description: 'Overwrite existing component',
            required: false,
          },
        },
      },
      {
        name: 'list-components',
        description: 'List all available shadcn/ui components',
        parameters: {},
      },
    ],
  };

  await mcpRegistry.register(shadcnServer);
  console.log('✅ shadcn MCP server registered successfully!');
  console.log('Server ID:', shadcnServer.id);
  console.log('Tools:', shadcnServer.tools?.map(t => t.name).join(', '));
}

registerShadcnMCP().catch(console.error);
