# OmniMCP Platform

**Chat with any LLM, supercharged with MCPs - The Cursor for AI Chat**

## The Vision

LLMs are becoming the new "phones" - ubiquitous interfaces for interacting with software. OmniMCP is building the **chat interface + app store** that lets you use any LLM with any MCP tool.

### The Problem

Today, using LLMs with tools is fragmented:
- **Users**: Can't easily connect tools to ChatGPT, Claude, or other LLMs
- **Developers**: Build MCP servers but have no distribution channel
- **Power Users**: Need to configure complex MCP setups per LLM

### The Solution

**OmniMCP Platform** provides:

1. **Web Chat Interface**: Chat with ChatGPT, Claude, Gemini, or any LLM - all in one place
2. **MCP Marketplace**: Browse and enable tools like apps - GitHub, Slack, Weather, and more
3. **Developer SDK**: Build MCPs once, reach thousands of users
4. **No Configuration**: Works out of the box - no LLM setup required

Think: **"Cursor, but for chat with any LLM + MCP marketplace"**

## How It Works

```
┌──────────────────────────────────────────────┐
│     User visits omnimcp.io                   │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Chat Interface                    │     │
│  │  ┌──────────────────────────────┐  │     │
│  │  │ Model: [ChatGPT-4 ▼]         │  │     │
│  │  │                              │  │     │
│  │  │ Your Apps:                   │  │     │
│  │  │ ✓ GitHub                     │  │     │
│  │  │ ✓ Weather                    │  │     │
│  │  │ ✗ Slack                      │  │     │
│  │  └──────────────────────────────┘  │     │
│  │                                    │     │
│  │  User: "Create a GitHub issue"     │     │
│  │  AI:   "Issue created! #123"       │     │
│  └────────────────────────────────────┘     │
└──────────────────┬───────────────────────────┘
                   │
                   │ Chat API
                   │
┌──────────────────▼───────────────────────────┐
│        OmniMCP Platform (Your Server)        │
│                                              │
│  1. Calls selected LLM (OpenAI/Anthropic)   │
│  2. Passes enabled MCPs as function calls   │
│  3. LLM calls GitHub MCP                    │
│  4. Executes MCP tool                       │
│  5. Returns result to LLM                   │
│  6. LLM generates response                  │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  MCP Marketplace                   │     │
│  │  - SDK for developers              │     │
│  │  - Browse/install MCPs             │     │
│  └────────────────────────────────────┘     │
└──────────────────────────────────────────────┘
```

## Core Features

### 1. SDK for Developers
```typescript
import { OmniMCP, z } from '@omnimcp/sdk';

const mcp = new OmniMCP({
  apiKey: process.env.OMNIMCP_API_KEY!,
  name: 'my-tool',
});

mcp.tool({
  name: 'action',
  description: 'Do something',
  parameters: z.object({ input: z.string() }),
  handler: async ({ input }) => {
    // Your logic
    return result;
  },
});

await mcp.deploy(); // One command to deploy
```

### 2. No-Code Dashboard
- Browse marketplace of available MCPs
- One-click installation
- Visual configuration (no coding required)
- Usage analytics and monitoring
- Credential management

### 3. MCP Marketplace (Free)
- **All MCPs are free to install** - No per-MCP pricing
- Discover community-built tools
- Official integrations (GitHub, Notion, Slack, etc.)
- Private/enterprise tools
- Developers get **distribution**, not direct monetization

## Product Strategy

### Hosting Model: **Hybrid**
- **Platform-Hosted MCPs**: Official MCPs run on our infrastructure
- **Developer-Hosted MCPs**: Developers run their own servers, register callback URLs with us
- Best of both worlds: scalability + flexibility

### Dashboard Features
- **MVP (Phase 1)**: Configuration UI
  - Browse and install MCPs from marketplace
  - Configure settings and credentials via forms
  - View usage analytics
  - Manage subscription

- **V2 (Phase 2)**: Visual MCP Builder
  - Drag-and-drop MCP creation
  - No-code API connectors (like Zapier)
  - Build custom MCPs without coding
  - **Killer differentiator** that locks in users

### Monetization: **Free Marketplace**
- All MCPs in marketplace are free
- Revenue from **platform subscription tiers only**
- Simpler model, faster user adoption
- Developer incentive = distribution to thousands of users

## Business Model

### Subscription Tiers

1. **Free**
   - 5 MCPs installed
   - 1,000 requests/month
   - Access to all free marketplace MCPs
   - Community support

2. **Pro** ($29/mo)
   - 50 MCPs installed
   - 100,000 requests/month
   - Can create custom MCPs (via SDK)
   - Priority support

3. **Enterprise** (Custom pricing)
   - Unlimited MCPs
   - Unlimited requests
   - SSO/SAML integration
   - Audit logs
   - Custom deployments
   - Dedicated support
   - SLA guarantees

### Target Markets

1. **Individual Users**: Personal AI workflows (Free tier)
2. **Power Users & Indie Hackers**: Building AI products (Pro tier)
3. **Enterprises**: Centralized AI tool governance (Enterprise tier)
4. **MCP Developers**: Get distribution to thousands of users

## Packages

This is a monorepo containing:

- **`@omnimcp/sdk`**: SDK for building MCP servers (Open Source - MIT)
- **`packages/server`**: Platform backend (Proprietary)
- **`packages/dashboard`**: Web UI for no-code management (Proprietary)
- **`packages/cli`**: Command-line interface (Proprietary)

## Getting Started

### As a Developer (Building MCPs)

```bash
npm install @omnimcp/sdk
```

See [`packages/sdk/README.md`](packages/sdk/README.md) for full documentation.

### As a Platform User

1. Sign up at [omnimcp.io](https://omnimcp.io)
2. Connect your LLM client
3. Browse and install MCPs from the dashboard
4. Start using tools immediately

## Competitive Advantages

1. **Network Effects**: More MCPs → More users → More developers → More MCPs
2. **Single Integration**: LLMs only need to connect once
3. **Hybrid Hosting**: Support both platform-hosted and developer-hosted MCPs
4. **Developer Experience**: SDK makes building MCPs trivial
5. **No-Code Builder (V2)**: Create custom MCPs visually without coding
6. **Free Marketplace**: Zero friction for users to try new tools
7. **Distribution Platform**: First real distribution channel for MCP developers

## Technical Architecture

### Database Schema
- Users, subscriptions, API keys
- MCP servers (both hosted and registered)
- Tools, resources, prompts
- User installations and configurations
- Request logs for analytics
- Visual MCP configs (for V2 builder)

### API Endpoints
- `/api/auth` - Authentication (register, login)
- `/api/mcp` - MCP management (deploy, status, install)
- `/api/marketplace` - Browse and discover MCPs
- `/mcp/call` - MCP protocol endpoint (for LLMs)

### MCP Registry
- Manages both platform-hosted and developer-hosted MCPs
- Routes tool calls to appropriate servers
- Health checking and monitoring
- Automatic failover and retry logic

## Development Roadmap

- [x] Phase 1: Project structure and SDK foundation
- [x] Phase 2: Server architecture (auth, registry, API routes)
- [x] Phase 3: Database schema design
- [x] Phase 4: Dashboard structure (Next.js)
- [ ] Phase 5: Implement auth and user management
- [ ] Phase 6: Build marketplace browsing
- [ ] Phase 7: Implement MCP installation flow
- [ ] Phase 8: Add usage analytics and billing
- [ ] Phase 9: Build visual MCP builder (V2)
- [ ] Phase 10: Enterprise features (SSO, audit logs)

## License

- **SDK**: MIT (Open Source)
- **Platform**: Proprietary

## Contact

- Website: [omnimcp.io](https://omnimcp.io)
- Email: hello@omnimcp.io
