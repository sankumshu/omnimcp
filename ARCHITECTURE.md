# OmniMCP Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       LLM Clients                           │
│         (ChatGPT, Claude, Custom AI Applications)           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ MCP Protocol (stdio/http)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  OmniMCP Platform Gateway                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            API Gateway (Express)                    │   │
│  │  - Authentication (JWT)                             │   │
│  │  - Rate limiting by tier                            │   │
│  │  - Request logging                                  │   │
│  └────────────┬────────────────────────────────────────┘   │
│               │                                             │
│  ┌────────────▼────────────────────────────────────────┐   │
│  │         MCP Registry & Router                       │   │
│  │  - Server discovery                                 │   │
│  │  - Request routing (namespace-aware)                │   │
│  │  - Health checking                                  │   │
│  │  - Response aggregation                             │   │
│  └────────────┬────────────────────────────────────────┘   │
│               │                                             │
└───────────────┼─────────────────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌───────────────┐   ┌──────────────────┐
│ Platform      │   │ Developer        │
│ Hosted MCPs   │   │ Hosted MCPs      │
│               │   │                  │
│ - GitHub      │   │ Callback URLs    │
│ - Slack       │   │ (Webhooks)       │
│ - Notion      │   │                  │
│ - Weather     │   │ - Custom tools   │
│ - Calculator  │   │ - Private APIs   │
└───────────────┘   └──────────────────┘
```

## Component Architecture

### 1. SDK Layer (`@omnimcp/sdk`)

**Purpose**: Developer-facing SDK for building MCPs

**Key Classes**:
- `OmniMCP`: Main SDK class
  - `tool()`: Register tools
  - `resource()`: Register resources
  - `prompt()`: Register prompts
  - `deploy()`: Deploy to platform
  - `startLocal()`: Local development

**Flow**:
```typescript
Developer Code → SDK Client → Platform API → Registry → Deployment
```

### 2. Platform Server (`packages/server`)

**Tech Stack**:
- Express.js (API server)
- PostgreSQL (data persistence)
- Pino (structured logging)
- JWT (authentication)

**Modules**:

#### Auth Service
- User registration/login
- API key generation
- JWT token management
- Subscription tier enforcement

#### MCP Registry
- In-memory registry (production: Redis)
- Server metadata caching
- Health check scheduler
- Connection pooling

#### Request Router
- Parse incoming MCP requests
- Validate user permissions
- Route to appropriate server (hosted vs callback)
- Aggregate responses
- Log for analytics

### 3. Database Schema

```sql
users
├── id (PK)
├── email
├── password_hash
├── subscription_tier
└── api_key

mcp_servers
├── id (PK)
├── name
├── owner_id (FK → users)
├── hosting_type (platform_hosted | developer_hosted)
├── callback_url (for developer_hosted)
├── webhook_secret
├── status
└── health_status

mcp_tools
├── id (PK)
├── server_id (FK → mcp_servers)
├── name
├── description
└── parameters (JSONB)

user_mcp_installations
├── id (PK)
├── user_id (FK → users)
├── server_id (FK → mcp_servers)
├── config (JSONB - user credentials, settings)
└── enabled

request_logs
├── id (PK)
├── user_id (FK)
├── server_id (FK)
├── request_type
├── status
└── response_time_ms
```

### 4. Dashboard (`packages/dashboard`)

**Tech Stack**:
- Next.js 15 (React framework)
- TypeScript
- Tailwind CSS
- Zustand (state)
- React Query (data fetching)

**Pages**:
- `/login`, `/register` - Authentication
- `/dashboard` - Overview, usage stats
- `/marketplace` - Browse MCPs
- `/marketplace/[id]` - MCP details
- `/installed` - Installed MCPs
- `/settings` - User settings, subscription
- `/builder` (V2) - Visual MCP builder

## Request Flow

### User Tool Call Flow

```
1. LLM → OmniMCP Platform
   POST /mcp/call
   {
     "serverId": "github",
     "toolName": "list_repos",
     "arguments": { "user": "anthropics" }
   }

2. Platform validates:
   - JWT token (user auth)
   - Subscription limits (request quota)
   - MCP installation (user has "github" installed)
   - Tool exists on server

3. Registry routes request:

   If platform_hosted:
     → Local MCP server process
     → Execute tool handler
     → Return result

   If developer_hosted:
     → HTTP POST to callback_url/tools/list_repos
     → Include webhook_secret header
     → Return result

4. Platform logs:
   - Request to request_logs table
   - Update server.request_count
   - Check against user quota

5. Return to LLM:
   {
     "success": true,
     "result": [...]
   }
```

### Developer Deploy Flow

```
1. Developer code:
   const mcp = new OmniMCP({ apiKey: '...' });
   mcp.tool({ name: 'my_tool', ... });
   await mcp.deploy();

2. SDK POSTs to platform:
   POST /api/mcp/deploy
   {
     "name": "my-mcp",
     "hostingType": "developer_hosted",
     "callbackUrl": "https://my-server.com",
     "tools": [...]
   }

3. Platform:
   - Validates API key
   - Checks subscription (can_create_mcps)
   - Creates mcp_servers record
   - Creates mcp_tools records
   - Registers in MCP Registry
   - Returns serverId

4. Developer's server:
   - Must implement callback endpoints:
     POST /tools/{toolName}
     GET /resources?uri=...
     GET /health
   - Must validate webhook_secret header
```

## Hybrid Hosting Model

### Platform-Hosted MCPs

**Advantages**:
- Zero setup for developers
- Managed infrastructure
- Automatic scaling
- Built-in monitoring

**Use Cases**:
- Official MCPs (GitHub, Slack, etc.)
- Popular community MCPs
- Simple tools without external dependencies

**Implementation**:
```typescript
// Platform spawns MCP server as child process
const server = spawn('node', ['dist/mcp-server.js'], {
  env: { ...process.env, ...userConfig }
});

// Communicate via stdio or local HTTP
```

### Developer-Hosted MCPs

**Advantages**:
- Keep sensitive logic private
- Use existing infrastructure
- Access internal systems
- Full control

**Use Cases**:
- Enterprise integrations
- Private data sources
- Custom business logic
- High-security requirements

**Implementation**:
```typescript
// Developer's server (Express example)
app.post('/tools/:toolName', async (req, res) => {
  // Verify webhook secret
  if (req.headers['x-webhook-secret'] !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Execute tool
  const result = await executeMyTool(req.params.toolName, req.body.arguments);
  res.json({ success: true, result });
});
```

## Security

### Authentication
- JWT tokens for API access
- API keys for SDK deployment
- Webhook secrets for callback verification

### Authorization
- Subscription tier enforcement
- Rate limiting per tier
- User-specific MCP configurations

### Data Privacy
- User credentials encrypted at rest
- Webhook secrets hashed
- Request logs anonymized (optional)

## Scalability

### Horizontal Scaling
- Stateless API servers (multiple instances)
- Load balancer (nginx/AWS ALB)
- Shared session store (Redis)
- Database connection pooling

### Performance Optimization
- MCP registry caching (Redis)
- CDN for dashboard assets
- Database indexes on hot paths
- Request batching for analytics

### Monitoring
- Request latency tracking
- Error rate monitoring
- Server health checks (5min intervals)
- Usage alerts for quota limits

## Visual Builder Architecture (V2)

### Workflow Editor
```
User Interface (React Flow):
┌─────────────────────────────────────┐
│  [Start] → [HTTP Request]          │
│              ↓                      │
│           [Transform JSON]          │
│              ↓                      │
│           [Return]                  │
└─────────────────────────────────────┘

Saved as JSON:
{
  "tools": [{
    "name": "get_weather",
    "action": {
      "type": "http_request",
      "config": {
        "method": "GET",
        "url": "https://api.weather.com/v1/current",
        "params": { "location": "{{location}}" }
      }
    },
    "responseMapping": {
      "temperature": "{{data.main.temp}}",
      "condition": "{{data.weather[0].main}}"
    }
  }]
}
```

### Execution
```typescript
// Platform interprets visual config at runtime
async function executeVisualTool(config, args) {
  if (config.action.type === 'http_request') {
    const response = await axios({
      method: config.action.config.method,
      url: replaceTokens(config.action.config.url, args),
      params: replaceTokens(config.action.config.params, args)
    });

    return applyMapping(response.data, config.responseMapping);
  }
}
```

## Next Steps

1. **Implement Database Layer**: Add PostgreSQL connection and ORM
2. **Complete Auth System**: Full JWT + bcrypt implementation
3. **Build MCP Installation Flow**: User → Install → Configure → Use
4. **Add Billing Integration**: Stripe for subscription management
5. **Create Official MCPs**: GitHub, Slack, Notion, Weather
6. **Build Dashboard UI**: React components for marketplace browsing
7. **Add Analytics**: Usage tracking and visualization
8. **Implement Visual Builder**: Drag-and-drop MCP creation
