# OmniMCP Platform - Developer Setup Guide

This guide will help you set up the OmniMCP platform on your local machine.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Supabase account (for database)
- API keys for LLM providers (OpenAI, Anthropic, Google)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd OmniMCP
```

### 2. Install Dependencies

Install dependencies for the entire monorepo:

```bash
npm install
```

### 3. Set Up Environment Variables

You'll need to create environment files for both the server and dashboard packages.

#### Server Environment (`.env`)

Create `/packages/server/.env` with the following variables:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key

# JWT Secret (for authentication)
JWT_SECRET=your_random_secret_key_here
```

#### Dashboard Environment (`.env.local`)

Create `/packages/dashboard/.env.local` with:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase Configuration (for client-side auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase Setup

The platform uses Supabase for authentication and database. The database schema will be set up in a future step. For now, you just need:

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Project Settings > API
3. Add them to your environment files

> **Note:** The database tables (`mcp_servers`, `user_mcp_installations`, etc.) are not required for basic chat functionality. The app will work without them but won't persist MCP installations.

### 5. Running the Application

You need to run **two separate commands** in **two different terminal windows**:

#### Terminal 1 - Backend Server

```bash
cd packages/server
npm run dev
```

This starts the backend API server on **http://localhost:3000**

You should see:
```
✓ OmniMCP Platform server listening on port 3000
✓ Environment: development
```

#### Terminal 2 - Frontend Dashboard

```bash
cd packages/dashboard
npm run dev
```

This starts the Next.js dashboard on **http://localhost:3002** (or the next available port)

You should see:
```
✓ Ready in 1363ms
- Local:        http://localhost:3002
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3002/chat
```

You should see:
- A sidebar with "Your Apps" showing GitHub, Weather, and Slack MCPs
- A model selector dropdown (ChatGPT-4, Claude, etc.)
- A chat interface with a modern, clean design using shadcn/ui components

## Features

### Chat Interface
- Select from multiple LLM providers (OpenAI, Anthropic, Google)
- Real-time streaming responses
- Beautiful UI with shadcn/ui components
- Message history

### MCP Sidebar
- View installed MCP apps
- Enable/disable MCPs (UI only - database integration coming soon)
- Browse marketplace button

## Architecture

```
OmniMCP/
├── packages/
│   ├── server/          # Express backend API
│   │   ├── src/
│   │   │   ├── routes/  # API routes (chat, auth, mcp, marketplace)
│   │   │   ├── services/# Business logic (LLM providers, MCP registry)
│   │   │   └── db/      # Supabase client
│   │   └── .env         # Server environment variables
│   │
│   └── dashboard/       # Next.js frontend
│       ├── src/
│       │   ├── app/     # Next.js app router pages
│       │   └── components/ # React components (Chat, MCP sidebar)
│       └── .env.local   # Dashboard environment variables
│
└── package.json         # Root package.json for monorepo
```

## Tech Stack

### Backend
- **Express.js** - REST API server
- **TypeScript** - Type safety
- **Supabase** - Database and authentication
- **Pino** - Logging
- **LLM Providers** - OpenAI, Anthropic, Google AI

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, the dashboard will automatically use the next available port (3001, 3002, etc.). Check the terminal output to see which port it's using.

### API Connection Errors

If you see "Error: Failed to get response" in the chat:
1. Make sure the backend server is running on port 3000
2. Check that your LLM provider API keys are valid in `/packages/server/.env`
3. Check the server terminal for error logs

### Database Table Not Found

You may see warnings like "Could not find the table 'public.user_mcp_installations'". This is expected and won't affect basic chat functionality. The app will work without these tables.

### Environment Variables Not Loading

- For server: Make sure `.env` is in `/packages/server/`
- For dashboard: Make sure `.env.local` is in `/packages/dashboard/`
- Restart both servers after adding environment variables

## Development Workflow

1. **Make changes** to the code
2. **Both servers auto-reload** - tsx watch (server) and Next.js Fast Refresh (dashboard)
3. **Test in browser** at http://localhost:3002/chat

## Available Scripts

### Root Level
```bash
npm install          # Install all dependencies
```

### Server Package
```bash
npm run dev          # Start development server with auto-reload
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript type checking
```

### Dashboard Package
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Next Steps

- Set up Supabase database schema for MCP persistence
- Implement authentication flow
- Add MCP marketplace functionality
- Connect real MCPs (GitHub, Slack, Weather, etc.)
- Add more LLM providers

## Getting Help

If you run into issues:
1. Check the terminal output for error messages
2. Verify all environment variables are set correctly
3. Make sure both servers are running
4. Check that your API keys are valid

## License

[Your License Here]
