#!/bin/bash
# Setup script for OmniMCP - Uber Eats and Uber Rideshare MCPs

set -e

echo "🚀 Setting up MCPs for OmniMCP Platform..."

# Navigate to omnimcp directory
cd /Users/ajvercueil/Documents/omnimcp/mcps

# ========================================
# 1. UBER EATS MCP (Python)
# ========================================
echo ""
echo "📦 Setting up Uber Eats MCP (Python)..."

if [ ! -d "ubereats" ]; then
  git clone https://github.com/ericzakariasson/uber-eats-mcp-server.git ubereats
fi

cd ubereats

# Create Python virtual environment
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install uv
uv pip install -r requirements.txt
playwright install chromium

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  cat > .env << 'EOF'
# Anthropic API key for Claude (used by the MCP for AI interactions)
ANTHROPIC_API_KEY=
EOF
  echo "⚠️  Please add your ANTHROPIC_API_KEY to ubereats/.env"
fi

echo "✅ Uber Eats MCP setup complete!"

cd ..

# ========================================
# 2. UBER RIDESHARE MCP (TypeScript)
# ========================================
echo ""
echo "🚗 Setting up Uber Rideshare MCP (TypeScript)..."

if [ ! -d "uber" ]; then
  git clone https://github.com/199-mcp/mcp-uber.git uber
fi

cd uber

# Install dependencies
npm install

# Build the TypeScript code
npm run build

echo "✅ Uber Rideshare MCP setup complete!"

cd ..

# ========================================
# 3. Summary
# ========================================
echo ""
echo "========================================="
echo "✅ MCP Setup Complete!"
echo "========================================="
echo ""
echo "📁 Uber Eats MCP: mcps/ubereats/"
echo "   - Tools: find_menu_options, get_search_results, order_food"
echo "   - Tech: Python + Playwright (browser automation)"
echo "   - Config: ubereats/.env (add ANTHROPIC_API_KEY)"
echo ""
echo "📁 Uber Rideshare MCP: mcps/uber/"
echo "   - Tools: get_auth_url, set_token, get_estimates, request_ride, get_status, cancel_ride"
echo "   - Tech: TypeScript + Uber API"
echo "   - Config: See root .env (UBER_* variables)"
echo ""
echo "Next steps:"
echo "1. Add API keys to .env files"
echo "2. Test Uber Eats: cd ubereats && source venv/bin/activate && uv run mcp dev server.py"
echo "3. Test Uber: cd uber && npm start"
echo ""
