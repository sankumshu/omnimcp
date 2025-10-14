# @omnimcp/dashboard

Web dashboard for managing MCPs on the OmniMCP platform.

## Features

### MVP (Config UI)
- Browse marketplace
- Install/uninstall MCPs
- Configure MCP settings (credentials, etc.)
- View usage analytics
- Manage subscription

### V2 (Visual Builder)
- Drag-and-drop MCP builder
- Visual workflow editor
- No-code API connectors
- Test and deploy custom MCPs

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **React Query**: Data fetching
- **Lucide**: Icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Auth pages (login, register)
│   ├── dashboard/    # Main dashboard
│   ├── marketplace/  # Browse MCPs
│   └── builder/      # Visual builder (V2)
├── components/       # React components
│   ├── ui/           # Base UI components
│   ├── mcp/          # MCP-specific components
│   └── builder/      # Visual builder components (V2)
├── lib/              # Utilities
│   ├── api.ts        # API client
│   └── store.ts      # State management
└── types/            # TypeScript types
```
