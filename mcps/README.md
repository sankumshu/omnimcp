# OmniMCP - Model Context Protocol Servers

This directory contains MCP servers that integrate with the OmniMCP platform.

## Installed MCPs

### 1. Uber Eats MCP 🍕
**Location**: `mcps/ubereats/`
**Status**: ✅ Configured
**Tech Stack**: Python 3.12+ | Playwright | Browser Automation
**Repository**: https://github.com/ericzakariasson/uber-eats-mcp-server

**Description**: Search restaurants, browse menus, and order food from Uber Eats using AI-powered browser automation.

**Tools Available:**
- `find_menu_options(search_term)` - Search for restaurants or food items
- `get_search_results(request_id)` - Retrieve search results
- `order_food(item_url, item_name)` - Place a food order

**How It Works:**
- Uses Playwright to automate Uber Eats website
- Runs headless browser in background
- Can search ANY restaurant (not limited to owned stores)
- Actually places real orders

**Performance:**
- Search: ~15-20 seconds
- Order: ~20-30 seconds
- Memory: ~200-500MB per browser instance

**Setup:**
```bash
cd mcps/ubereats
python3 -m venv venv
source venv/bin/activate
pip install uv
uv pip install -r requirements.txt
playwright install chromium

# Create .env file
cat > .env << 'EOF'
ANTHROPIC_API_KEY=your_api_key_here
EOF

# Test it
uv run mcp dev server.py
```

**Required Environment Variables:**
- `ANTHROPIC_API_KEY` - Your Anthropic API key (set in `ubereats/.env`)

---

### 2. Uber Rideshare MCP 🚗
**Location**: `mcps/uber/`
**Status**: ✅ Configured
**Tech Stack**: TypeScript | Uber API | OAuth 2.0
**Repository**: https://github.com/199-mcp/mcp-uber

**Description**: Book Uber rides, get price estimates, track ride status using official Uber API with OAuth authentication.

**Tools Available:**
- `get_auth_url()` - Get OAuth authorization URL
- `set_token(access_token)` - Set access token after OAuth
- `get_price_estimates(start_lat, start_lng, end_lat, end_lng)` - Get ride price estimates
- `request_ride(product_id, start_lat, start_lng, end_lat, end_lng)` - Request an Uber ride
- `get_ride_status(ride_id)` - Check ride status
- `cancel_ride(ride_id)` - Cancel a ride

**How It Works:**
- Uses official Uber API (not browser automation)
- OAuth 2.0 for authentication
- Sandbox mode for testing (no real charges)
- Production mode requires Uber approval

**Performance:**
- API calls: ~100-500ms
- Very fast and reliable
- Minimal resource usage

**Setup:**
```bash
cd mcps/uber
npm install
npm run build

# Test it
npm start
```

**Required Environment Variables:**
(Set in root `.env` file)
```bash
UBER_CLIENT_ID=L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v
UBER_CLIENT_SECRET=your_secret_here
UBER_REDIRECT_URI=http://localhost:3001/uber-redirect
UBER_ENVIRONMENT=sandbox
UBER_SERVER_TOKEN=your_server_token_here
```

**OAuth Setup:**
1. Created Uber Developer account
2. Created app with Client ID: `L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v`
3. Secret UUID: `c88d5bff-ffbc-4a0f-a63a-7f950ddebb97`
4. Redirect URI configured: `http://localhost:3001/uber-redirect`

**Getting Credentials:**
1. Go to https://developer.uber.com/
2. Create or select your app
3. Get Client ID and Client Secret
4. Generate Server Token for backend calls
5. Add redirect URI: `http://localhost:3001/uber-redirect`

---

## Quick Setup (Both MCPs)

Run the automated setup script:

```bash
cd /Users/ajvercueil/Documents/omnimcp/mcps
chmod +x setup-mcps.sh
./setup-mcps.sh
```

Then add your API keys:
1. **Uber Eats**: Add `ANTHROPIC_API_KEY` to `mcps/ubereats/.env`
2. **Uber Rideshare**: Add credentials to root `/Users/ajvercueil/Documents/omnimcp/.env`

---

## Integration with OmniMCP Platform

### Python MCP (Uber Eats)
The platform can call Python MCPs via stdio transport:

```json
{
  "id": "ubereats",
  "name": "Uber Eats",
  "command": "/Users/ajvercueil/Documents/omnimcp/mcps/ubereats/venv/bin/python",
  "args": ["-m", "server"],
  "cwd": "/Users/ajvercueil/Documents/omnimcp/mcps/ubereats",
  "env": {
    "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
  }
}
```

### TypeScript MCP (Uber)
Can be integrated directly or via our OmniMCP SDK:

```json
{
  "id": "uber",
  "name": "Uber Rideshare",
  "command": "node",
  "args": ["/Users/ajvercueil/Documents/omnimcp/mcps/uber/dist/index.js"],
  "env": {
    "UBER_CLIENT_ID": "${UBER_CLIENT_ID}",
    "UBER_CLIENT_SECRET": "${UBER_CLIENT_SECRET}",
    "UBER_REDIRECT_URI": "${UBER_REDIRECT_URI}",
    "UBER_ENVIRONMENT": "${UBER_ENVIRONMENT}"
  }
}
```

---

## Testing MCPs

### Test Uber Eats:
```bash
cd mcps/ubereats
source venv/bin/activate
uv run mcp dev server.py
```

In another terminal, test with:
```bash
# Search for pizza
echo '{"method": "tools/call", "params": {"name": "find_menu_options", "arguments": {"search_term": "pizza"}}}' | uv run mcp dev server.py
```

### Test Uber:
```bash
cd mcps/uber
npm start
```

Test the tools via MCP inspector or integrate with Claude Desktop.

---

## Troubleshooting

### Uber Eats Issues:
- **Browser fails to launch**: Run `playwright install chromium`
- **Slow searches**: Normal - browser automation takes 15-30 seconds
- **Orders fail**: Check if logged into Uber Eats (may need manual login first time)

### Uber Issues:
- **OAuth fails**: Verify redirect URI matches exactly in Uber dashboard
- **API errors**: Check if using sandbox mode and credentials are correct
- **Token expired**: Re-authenticate via `get_auth_url` tool

---

## Architecture Notes

**Why Two Different Tech Stacks?**
- **Uber Eats**: No public API → Browser automation required → Python/Playwright
- **Uber Rideshare**: Official API available → Direct API calls → TypeScript/OAuth

**Performance Trade-offs:**
- Uber Eats: Slower but functional (only option available)
- Uber: Fast, reliable, official API

Both integrate with OmniMCP platform via MCP protocol (stdio transport).

---

## Next Steps

1. ✅ Run setup script: `./setup-mcps.sh`
2. ✅ Add API keys to `.env` files
3. ⏳ Create OAuth redirect handler in OmniMCP platform
4. ⏳ Register MCPs in platform database
5. ⏳ Test integration via chat interface
6. ⏳ Deploy to production

---

## Resources

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Uber Developer Portal](https://developer.uber.com/)
- [Uber Eats (no official API - browser automation)](https://www.ubereats.com/)
- [Playwright Documentation](https://playwright.dev/)
- [OmniMCP Platform Docs](../README.md)
