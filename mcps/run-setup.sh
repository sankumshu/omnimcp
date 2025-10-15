#!/bin/bash
# Complete MCP Setup with All Credentials
# Run this to set up both Uber Eats and Uber Rideshare MCPs

set -e

echo "🚀 OmniMCP - Full MCP Setup Starting..."
echo ""

# Navigate to mcps directory
cd "$(dirname "$0")"
MCPS_DIR="$(pwd)"

echo "📁 Working directory: $MCPS_DIR"
echo ""

# ========================================
# 1. UBER EATS MCP (Python)
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🍕 Setting up Uber Eats MCP..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d "ubereats" ]; then
  echo "📥 Cloning Uber Eats MCP..."
  git clone https://github.com/ericzakariasson/uber-eats-mcp-server.git ubereats
  echo "✅ Cloned successfully"
else
  echo "✅ Uber Eats MCP already cloned"
fi

cd ubereats

echo ""
echo "🐍 Setting up Python virtual environment..."

# Create virtual environment
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo "✅ Virtual environment created"
else
  echo "✅ Virtual environment exists"
fi

# Activate and install
source venv/bin/activate

echo ""
echo "📦 Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install uv --quiet
uv pip install -r requirements.txt

echo ""
echo "🌐 Installing Playwright browser..."
playwright install chromium

# Create .env with Anthropic key
echo ""
echo "⚙️  Creating Uber Eats .env file..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "⚠️  Warning: ANTHROPIC_API_KEY not set in environment"
  echo "   Please set it before running the Uber Eats MCP"
else
  cat > .env << EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
EOF
  echo "✅ Created .env with ANTHROPIC_API_KEY"
fi

echo "✅ Uber Eats MCP setup complete!"
echo ""

cd "$MCPS_DIR"

# ========================================
# 2. UBER RIDESHARE MCP (TypeScript)
# ========================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚗 Setting up Uber Rideshare MCP..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d "uber" ]; then
  echo "📥 Cloning Uber Rideshare MCP..."
  git clone https://github.com/199-mcp/mcp-uber.git uber
  echo "✅ Cloned successfully"
else
  echo "✅ Uber Rideshare MCP already cloned"
fi

cd uber

echo ""
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "✅ Uber Rideshare MCP setup complete!"
echo ""

cd "$MCPS_DIR"

# ========================================
# 3. SUMMARY
# ========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MCP SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Installed MCPs:"
echo ""
echo "  🍕 Uber Eats"
echo "     Location: $MCPS_DIR/ubereats"
echo "     Tools: find_menu_options, get_search_results, order_food"
echo "     Status: ✅ Ready"
echo ""
echo "  🚗 Uber Rideshare"
echo "     Location: $MCPS_DIR/uber"
echo "     Tools: get_auth_url, set_token, get_estimates, request_ride, etc."
echo "     Status: ✅ Ready (needs Uber Client Secret)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Quick Tests:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test Uber Eats:"
echo "  cd $MCPS_DIR/ubereats"
echo "  source venv/bin/activate"
echo "  uv run mcp dev server.py"
echo ""
echo "Test Uber Rideshare:"
echo "  cd $MCPS_DIR/uber"
echo "  UBER_CLIENT_ID=L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v \\"
echo "  UBER_CLIENT_SECRET=your_secret \\"
echo "  UBER_REDIRECT_URI=http://localhost:3001/uber-redirect \\"
echo "  UBER_ENVIRONMENT=sandbox \\"
echo "  npm start"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT: Get Uber Client Secret"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://developer.uber.com/dashboard"
echo "2. Sign in with: ajvercueil7@gmail.com"
echo "3. Find your app (Client ID: L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v)"
echo "4. Reveal Secret UUID: c88d5bff-ffbc-4a0f-a63a-7f950ddebb97"
echo "5. Add to /Users/ajvercueil/Documents/omnimcp/.env:"
echo "   UBER_CLIENT_SECRET=your_secret_here"
echo ""
echo "🎉 Setup complete! Both MCPs are ready to use."
echo ""
