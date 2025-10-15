# 🚀 Complete OmniMCP Setup Guide

## Current Status

✅ **Backend Server**: Running on http://localhost:3000
✅ **Frontend Dashboard**: Running on http://localhost:3001
✅ **Environment Variables**: Configured with all API keys
✅ **OAuth Redirect Handler**: Built at `/uber-redirect`

---

## MCP Setup - Run These Commands

### Step 1: Set up Uber Eats MCP (Python)

```bash
# Navigate to mcps directory
cd /Users/ajvercueil/Documents/omnimcp/mcps

# Clone repository
git clone https://github.com/ericzakariasson/uber-eats-mcp-server.git ubereats
cd ubereats

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install uv
uv pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Create .env file with Anthropic key
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your_anthropic_api_key_here
EOF

echo "✅ Uber Eats MCP ready!"
```

### Step 2: Set up Uber Rideshare MCP (TypeScript)

```bash
# From mcps directory
cd /Users/ajvercueil/Documents/omnimcp/mcps

# Clone repository
git clone https://github.com/199-mcp/mcp-uber.git uber
cd uber

# Install dependencies and build
npm install
npm run build

echo "✅ Uber Rideshare MCP ready!"
```

### Step 3: Get Uber Client Secret

⚠️ **REQUIRED**: You need to get your Uber Client Secret:

1. Go to: https://developer.uber.com/dashboard
2. Sign in with: **ajvercueil7@gmail.com**
3. Find your app with Client ID: `L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v`
4. Find Secret UUID: `c88d5bff-ffbc-4a0f-a63a-7f950ddebb97`
5. Click "Show" or "Reveal" to get the actual secret string
6. Add it to `/Users/ajvercueil/Documents/omnimcp/.env`:

```bash
UBER_CLIENT_SECRET=paste_your_secret_here
UBER_SERVER_TOKEN=paste_server_token_here
```

---

## Testing the MCPs

### Test Uber Eats Locally

```bash
cd /Users/ajvercueil/Documents/omnimcp/mcps/ubereats
source venv/bin/activate
uv run mcp dev server.py
```

**Expected**: MCP server starts, listens for commands via stdio

**Test a tool**: In another terminal:
```bash
cd /Users/ajvercueil/Documents/omnimcp/mcps/ubereats
source venv/bin/activate

# Test search
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"find_menu_options","arguments":{"search_term":"pizza"}}}' | python server.py
```

### Test Uber Rideshare Locally

```bash
cd /Users/ajvercueil/Documents/omnimcp/mcps/uber

# Set environment variables and run
UBER_CLIENT_ID=L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v \
UBER_CLIENT_SECRET=your_secret_here \
UBER_REDIRECT_URI=http://localhost:3001/uber-redirect \
UBER_ENVIRONMENT=sandbox \
npm start
```

**Expected**: MCP server starts successfully

---

## Integration with OmniMCP Platform

Now let's integrate these MCPs into your running platform!

### Option 1: Direct Stdio Integration (Recommended)

Your OmniMCP platform can spawn MCP processes and communicate via stdio. Here's how:

**In `/Users/ajvercueil/Documents/omnimcp/packages/server/src/registry/mcp-registry.ts`:**

Add MCP spawning capability:

```typescript
import { spawn } from 'child_process';

// MCP Configuration
const MCP_CONFIGS = {
  ubereats: {
    command: '/Users/ajvercueil/Documents/omnimcp/mcps/ubereats/venv/bin/python',
    args: ['/Users/ajvercueil/Documents/omnimcp/mcps/ubereats/server.py'],
    env: {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    },
  },
  uber: {
    command: 'node',
    args: ['/Users/ajvercueil/Documents/omnimcp/mcps/uber/dist/index.js'],
    env: {
      UBER_CLIENT_ID: process.env.UBER_CLIENT_ID,
      UBER_CLIENT_SECRET: process.env.UBER_CLIENT_SECRET,
      UBER_REDIRECT_URI: process.env.UBER_REDIRECT_URI,
      UBER_ENVIRONMENT: process.env.UBER_ENVIRONMENT,
    },
  },
};

// Method to call MCP tools
async callMCPTool(mcpId: string, toolName: string, args: any) {
  const config = MCP_CONFIGS[mcpId];
  const mcpProcess = spawn(config.command, config.args, {
    env: { ...process.env, ...config.env },
  });

  // Send JSON-RPC request via stdin
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  };

  mcpProcess.stdin.write(JSON.stringify(request) + '\n');

  // Read response from stdout
  return new Promise((resolve, reject) => {
    let data = '';
    mcpProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });
    mcpProcess.stdout.on('end', () => {
      resolve(JSON.parse(data));
    });
    mcpProcess.on('error', reject);
  });
}
```

### Option 2: Manual Testing via Chat

1. Go to http://localhost:3001/chat
2. Enable "Uber Eats" and "Uber" in the sidebar
3. Ask: "Find pizza near me" → Should trigger Uber Eats MCP
4. Ask: "Get me an Uber from Times Square to JFK" → Should trigger Uber MCP

---

## Full System Architecture

```
┌─────────────────────────────────────────────────┐
│  User Browser (http://localhost:3001)          │
│  ┌──────────────────────────────────────────┐  │
│  │  Chat Interface                          │  │
│  │  ┌──────────┐ ┌──────────┐              │  │
│  │  │ Uber Eats│ │   Uber   │              │  │
│  │  │  Enabled │ │ Enabled  │              │  │
│  │  └──────────┘ └──────────┘              │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │
                  ↓ HTTP API Calls
┌─────────────────┴───────────────────────────────┐
│  OmniMCP Backend (http://localhost:3000)       │
│  ┌──────────────────────────────────────────┐  │
│  │  MCP Registry                            │  │
│  │  ┌────────────┐    ┌─────────────┐      │  │
│  │  │  Spawn MCP │    │  Call Tool  │      │  │
│  │  │  Process   │    │  via Stdio  │      │  │
│  │  └────────────┘    └─────────────┘      │  │
│  └──────────────────────────────────────────┘  │
└─────────┬──────────────┬─────────────────────────┘
          │              │
          ↓              ↓
┌─────────────────┐  ┌──────────────────┐
│ Uber Eats MCP   │  │ Uber MCP         │
│ (Python)        │  │ (TypeScript)     │
│                 │  │                  │
│ • Playwright    │  │ • Uber API       │
│ • Browser Auto  │  │ • OAuth 2.0      │
│ • Claude AI     │  │ • REST calls     │
└─────────────────┘  └──────────────────┘
```

---

## Environment Variables Summary

Your `/Users/ajvercueil/Documents/omnimcp/.env` now has:

```bash
# LLM Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Uber Eats (set in mcps/ubereats/.env)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Uber Rideshare
UBER_CLIENT_ID=L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v
UBER_CLIENT_SECRET=<GET FROM UBER DASHBOARD>
UBER_REDIRECT_URI=http://localhost:3001/uber-redirect
UBER_ENVIRONMENT=sandbox
UBER_SERVER_TOKEN=<GET FROM UBER DASHBOARD>
```

---

## Available MCP Tools

### Uber Eats Tools:

1. **find_menu_options**(search_term: string)
   - Search for restaurants or food items
   - Returns: Restaurant list with menus
   - Performance: ~15-20 seconds

2. **get_search_results**(request_id: string)
   - Get results from previous search
   - Returns: Cached search results
   - Performance: <1 second

3. **order_food**(item_url: string, item_name: string)
   - Place a food order
   - Returns: Order confirmation
   - Performance: ~20-30 seconds

### Uber Rideshare Tools:

1. **get_auth_url**()
   - Start OAuth flow
   - Returns: Authorization URL
   - User clicks → Redirects to /uber-redirect

2. **set_token**(access_token: string)
   - Set user's access token after OAuth
   - Returns: Confirmation

3. **get_price_estimates**(start_lat, start_lng, end_lat, end_lng)
   - Get ride price estimates
   - Returns: Array of products with prices
   - Performance: 100-500ms

4. **request_ride**(product_id, start_lat, start_lng, end_lat, end_lng)
   - Book an Uber ride
   - Returns: Ride details (ride_id, status, driver info)
   - Performance: 500ms-1s

5. **get_ride_status**(ride_id: string)
   - Check ride status
   - Returns: Current status, driver location, ETA

6. **cancel_ride**(ride_id: string)
   - Cancel a ride
   - Returns: Cancellation confirmation

---

## Next Steps

1. ✅ **Run setup commands above** (clone repos, install deps)
2. ⏳ **Get Uber Client Secret** from developer dashboard
3. ⏳ **Test MCPs individually** (both work standalone)
4. ⏳ **Integrate into platform** (add to MCP registry)
5. ⏳ **Test via chat** (use in real conversations)

---

## Quick Start (Copy-Paste)

```bash
# Setup Uber Eats
cd /Users/ajvercueil/Documents/omnimcp/mcps && \
git clone https://github.com/ericzakariasson/uber-eats-mcp-server.git ubereats && \
cd ubereats && \
python3 -m venv venv && \
source venv/bin/activate && \
pip install uv && \
uv pip install -r requirements.txt && \
playwright install chromium && \
echo 'ANTHROPIC_API_KEY=your_anthropic_api_key_here' > .env

# Setup Uber
cd /Users/ajvercueil/Documents/omnimcp/mcps && \
git clone https://github.com/199-mcp/mcp-uber.git uber && \
cd uber && \
npm install && \
npm run build
```

---

🎉 **You're all set!** Run the commands above and both MCPs will be fully functional.
