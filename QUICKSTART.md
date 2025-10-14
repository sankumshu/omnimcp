# Quick Start Guide

Get your OmniMCP platform up and running in minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/omnimcp.git
cd omnimcp
npm install
```

### 2. Set Up Database

```bash
# Create database
createdb omnimcp

# Run migrations
cd packages/server
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run db:migrate
```

### 3. Start Development Servers

```bash
# Terminal 1: Start API server
cd packages/server
npm run dev

# Terminal 2: Start dashboard
cd packages/dashboard
npm run dev
```

Your platform is now running:
- API: http://localhost:3000
- Dashboard: http://localhost:3001

## Building Your First MCP

### 1. Install SDK

```bash
npm install @omnimcp/sdk
```

### 2. Create Your MCP

```typescript
// my-weather-mcp.ts
import { OmniMCP, z } from '@omnimcp/sdk';

const mcp = new OmniMCP({
  apiKey: process.env.OMNIMCP_API_KEY!,
  name: 'weather-tool',
  description: 'Get weather information for any location',
});

mcp.tool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: z.object({
    city: z.string().describe('City name (e.g., "San Francisco")'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  handler: async ({ city, units }) => {
    // Your implementation here
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${units}`
    );
    const data = await response.json();

    return {
      temperature: data.main.temp,
      condition: data.weather[0].main,
      humidity: data.main.humidity,
    };
  },
});

// Deploy to platform
await mcp.deploy();
```

### 3. Run Your MCP

**Option A: Platform-Hosted** (SDK handles everything)
```bash
npx tsx my-weather-mcp.ts
# MCP is deployed and hosted on platform
```

**Option B: Developer-Hosted** (You run the server)
```typescript
// Add hosting type
const mcp = new OmniMCP({
  apiKey: process.env.OMNIMCP_API_KEY!,
  name: 'weather-tool',
  hostingType: 'developer_hosted',
  callbackUrl: 'https://my-server.com',
});

// ... define tools ...

// Start local server
await mcp.startLocal();
// Your server is now running and registered with platform
```

## Testing Your MCP

### Via Dashboard
1. Go to http://localhost:3001
2. Sign up / Log in
3. Go to Marketplace
4. Find your MCP
5. Click "Install"
6. Configure settings
7. Test it!

### Via API
```bash
curl -X POST http://localhost:3000/mcp/call \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "weather-tool",
    "toolName": "get_weather",
    "arguments": {
      "city": "San Francisco"
    }
  }'
```

### Via Claude/ChatGPT
1. Configure LLM to connect to OmniMCP platform
2. Use your JWT token
3. LLM can now call your weather tool!

## Example: Building a GitHub MCP

```typescript
import { OmniMCP, z } from '@omnimcp/sdk';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const mcp = new OmniMCP({
  apiKey: process.env.OMNIMCP_API_KEY!,
  name: 'github-integration',
  description: 'Interact with GitHub repositories',
});

// List repositories
mcp.tool({
  name: 'list_repos',
  description: 'List repositories for a user',
  parameters: z.object({
    username: z.string(),
  }),
  handler: async ({ username }) => {
    const { data } = await octokit.repos.listForUser({ username });
    return data.map(repo => ({
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      url: repo.html_url,
    }));
  },
});

// Create issue
mcp.tool({
  name: 'create_issue',
  description: 'Create a new issue in a repository',
  parameters: z.object({
    owner: z.string(),
    repo: z.string(),
    title: z.string(),
    body: z.string().optional(),
  }),
  handler: async ({ owner, repo, title, body }) => {
    const { data } = await octokit.issues.create({
      owner,
      repo,
      title,
      body,
    });
    return {
      number: data.number,
      url: data.html_url,
    };
  },
});

// Add a resource (README)
mcp.resource({
  uri: 'github://readme',
  name: 'Repository README',
  description: 'Get README content for a repository',
  mimeType: 'text/markdown',
  handler: async () => {
    // Implementation
    return readmeContent;
  },
});

await mcp.deploy();
```

## Environment Variables

### Platform Server
```bash
# .env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/omnimcp
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

### Dashboard
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Your MCP
```bash
# .env
OMNIMCP_API_KEY=omni_xxxxxxxxxxxxx
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx  # If using GitHub API
```

## Common Tasks

### Get Your API Key
```bash
# Via dashboard
1. Sign up at http://localhost:3001
2. Go to Settings
3. Copy your API key

# Via API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpass"}'
```

### List Available MCPs
```bash
curl http://localhost:3000/api/marketplace
```

### Install an MCP
```bash
curl -X POST http://localhost:3000/api/mcp/install \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serverId": "github-integration",
    "config": {
      "github_token": "ghp_xxxxx"
    }
  }'
```

### Check MCP Status
```bash
curl http://localhost:3000/api/mcp/github-integration/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### "Server not found"
- Make sure your MCP is deployed: check marketplace
- Verify the serverId matches your MCP name

### "Unauthorized"
- Check your JWT token is valid
- Make sure API key is set correctly

### "Callback URL unreachable" (developer-hosted)
- Ensure your server is running and publicly accessible
- Use ngrok for local development: `ngrok http 3000`
- Verify webhook secret is correct

### Database connection errors
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Run migrations: `npm run db:migrate`

## Next Steps

- Read the [Architecture Guide](./ARCHITECTURE.md)
- Explore [SDK Documentation](./packages/sdk/README.md)
- Check out [Example MCPs](./examples/)
- Join our [Discord community](https://discord.gg/omnimcp)

## Getting Help

- Documentation: [docs.omnimcp.io](https://docs.omnimcp.io)
- Issues: [GitHub Issues](https://github.com/yourusername/omnimcp/issues)
- Email: hello@omnimcp.io
