# OmniMCP Platform - Project Summary

## Overview

**OmniMCP** is a platform-as-a-service that acts as an "App Store" for AI, connecting MCP servers to LLMs through a unified gateway. Users connect once and get access to all their tools; developers build once and reach all users.

## Current Status: Foundation Complete ✅

We've built the complete architectural foundation for the platform:

### ✅ Completed Components

1. **SDK Package** (`@omnimcp/sdk`)
   - Developer-friendly API for building MCPs
   - Type-safe with Zod validation
   - Support for tools, resources, and prompts
   - One-command deployment
   - Ready for npm publishing (MIT license)

2. **Server Package** (`packages/server`)
   - Express.js API server
   - MCP Registry with hybrid hosting support
   - Authentication routes (stub)
   - MCP management routes (stub)
   - Marketplace routes (stub)
   - Request routing architecture

3. **Database Schema**
   - Complete PostgreSQL schema
   - Users and subscriptions
   - MCP servers (both hosted & registered)
   - Tools, resources, prompts
   - User installations
   - Request logs for analytics
   - Visual MCP builder support (V2)

4. **Dashboard Structure** (`packages/dashboard`)
   - Next.js 15 setup
   - TypeScript configuration
   - API client library
   - Ready for UI development

5. **Documentation**
   - README with product strategy
   - Architecture deep-dive
   - Quick start guide
   - SDK documentation

## Product Strategy (Finalized)

### Hosting: **Hybrid Model**
- **Platform-Hosted**: Official MCPs run on our infrastructure
- **Developer-Hosted**: Developers run their own, register callback URLs

### Dashboard: **Phased Approach**
- **Phase 1 (MVP)**: Configuration UI - browse, install, configure MCPs
- **Phase 2 (V2)**: Visual Builder - drag-and-drop MCP creation (killer feature)

### Monetization: **Free Marketplace**
- All MCPs are free to install
- Revenue from subscription tiers:
  - **Free**: 5 MCPs, 1K requests/month
  - **Pro ($29/mo)**: 50 MCPs, 100K requests/month, can create MCPs
  - **Enterprise**: Unlimited, SLA, SSO, audit logs

### Competitive Advantages
1. Network effects (more MCPs → more users → more developers)
2. Single integration point for LLMs
3. Hybrid hosting flexibility
4. Best-in-class developer experience (SDK)
5. Visual builder (V2) - unique differentiator
6. Free marketplace - zero friction
7. First real distribution platform for MCP developers

## Project Structure

```
OmniMCP/
├── packages/
│   ├── sdk/                    # Open source SDK (MIT)
│   │   ├── src/
│   │   │   ├── client.ts       # Main SDK class
│   │   │   ├── types.ts        # Type definitions
│   │   │   └── index.ts        # Public API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   ├── server/                 # Platform backend (Proprietary)
│   │   ├── src/
│   │   │   ├── index.ts        # Express server
│   │   │   ├── db/
│   │   │   │   └── schema.sql  # PostgreSQL schema
│   │   │   ├── registry/
│   │   │   │   └── mcp-registry.ts  # MCP routing
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts     # Auth endpoints
│   │   │   │   ├── mcp.ts      # MCP management
│   │   │   │   └── marketplace.ts
│   │   │   ├── middleware/
│   │   │   │   └── error-handler.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   ├── dashboard/              # Web UI (Proprietary)
│   │   ├── src/
│   │   │   ├── app/            # Next.js pages
│   │   │   ├── components/     # React components
│   │   │   ├── lib/
│   │   │   │   └── api.ts      # API client
│   │   │   └── types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── cli/                    # CLI tool (Future)
│
├── examples/                   # Example MCPs
├── docs/                       # Additional documentation
├── infrastructure/             # Deployment configs
│
├── package.json               # Monorepo root
├── README.md                  # Main documentation
├── ARCHITECTURE.md            # Technical deep-dive
├── QUICKSTART.md              # Getting started guide
├── LICENSE                    # MIT for SDK, Proprietary for platform
└── .gitignore
```

## Technology Stack

### SDK
- TypeScript
- Zod (validation)
- MCP SDK (@modelcontextprotocol/sdk)
- Axios (HTTP client)

### Server
- Node.js + TypeScript
- Express.js (API framework)
- PostgreSQL (database)
- JWT (authentication)
- Pino (logging)
- Bcrypt (password hashing)

### Dashboard
- Next.js 15 (React framework)
- TypeScript
- Tailwind CSS (styling)
- Zustand (state management)
- React Query (data fetching)
- Lucide (icons)

## Key Files to Review

### Core Logic
- `packages/sdk/src/client.ts` - SDK implementation
- `packages/server/src/registry/mcp-registry.ts` - Request routing
- `packages/server/src/db/schema.sql` - Database design
- `packages/server/src/types/index.ts` - Type system

### Documentation
- `README.md` - Product overview
- `ARCHITECTURE.md` - System design
- `QUICKSTART.md` - Developer onboarding

## Next Steps (Priority Order)

### Phase 1: Core Platform (2-3 weeks)
1. **Implement Database Layer**
   - Add PostgreSQL connection (pg or Prisma)
   - Implement user CRUD operations
   - Implement MCP CRUD operations

2. **Complete Authentication**
   - User registration with bcrypt
   - Login with JWT tokens
   - API key generation
   - Auth middleware

3. **Build MCP Installation Flow**
   - User installs MCP from marketplace
   - Configure credentials/settings
   - Enable/disable MCPs
   - Subscription limit enforcement

4. **Test End-to-End**
   - Deploy SDK MCP
   - Install via API
   - Call tool via `/mcp/call`

### Phase 2: Dashboard UI (2 weeks)
5. **Build Marketplace UI**
   - Browse MCPs grid
   - Search and filter
   - MCP detail pages
   - Install button

6. **Build User Dashboard**
   - Installed MCPs list
   - Configuration forms
   - Usage statistics
   - Subscription management

### Phase 3: Official MCPs (1 week)
7. **Create 5-7 Official MCPs**
   - GitHub integration
   - Slack integration
   - Weather API
   - Calculator
   - Web search
   - File system (read-only)

### Phase 4: Polish & Launch (1 week)
8. **Add Billing**
   - Stripe integration
   - Subscription upgrade flow
   - Usage tracking

9. **Testing & Documentation**
   - Unit tests for critical paths
   - Integration tests
   - API documentation
   - Video demos

### Phase 5: V2 Features (Future)
10. **Visual MCP Builder**
    - Drag-and-drop UI
    - HTTP request builder
    - JSON transformation
    - Save as visual_mcps table

11. **Enterprise Features**
    - SSO/SAML
    - Audit logs
    - Team management
    - Custom deployments

## Development Commands

```bash
# Install all dependencies
npm install

# Start API server (development)
cd packages/server && npm run dev

# Start dashboard (development)
cd packages/dashboard && npm run dev

# Build SDK for publishing
cd packages/sdk && npm run build

# Run tests
npm test

# Database migrations
cd packages/server && npm run db:migrate

# Lint all packages
npm run lint

# Format all code
npm run format
```

## Environment Setup

### Required Environment Variables

**Server** (`.env`):
```bash
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/omnimcp
JWT_SECRET=your-secret-key
NODE_ENV=development
```

**Dashboard** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Success Metrics

### Technical Metrics
- [ ] SDK published to npm
- [ ] Platform deployed to production
- [ ] Database migrations automated
- [ ] API documentation complete
- [ ] Test coverage >70%

### Product Metrics
- [ ] 10 official MCPs available
- [ ] 100 developer signups
- [ ] 1,000 MCP installations
- [ ] 50 community-built MCPs
- [ ] 10 paying Pro customers

## Questions to Answer

1. **Database**: PostgreSQL with raw SQL or add Prisma ORM?
2. **Deployment**: AWS, GCP, or other cloud provider?
3. **SDK Publishing**: Publish to npm immediately or wait for platform?
4. **Visual Builder**: Phase 2 or Phase 3?
5. **Billing**: Stripe immediately or manual invoicing for early customers?

## Resources

- MCP Protocol Spec: https://modelcontextprotocol.io
- Next.js Docs: https://nextjs.org/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/

## Team & Contacts

- **Product & GTM**: Santhosh Shunmugaraja
- **Technical Architecture**: Complete foundation in place
- **Open Questions**: See above

---

**Status**: Ready for Phase 1 implementation ✅

Built with Claude Code on 2025-10-13
