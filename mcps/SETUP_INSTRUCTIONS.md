# MCP Setup Instructions

## ⚠️ Important: Uber Eats Limitation

The Uber Eats MCP **requires an Anthropic (Claude) API key** because it uses Claude to intelligently control the browser automation.

**Your options:**
1. **Get an Anthropic API key** from https://console.anthropic.com/
2. **Modify the code** to use OpenAI instead (requires Python coding)
3. **Skip Uber Eats** and just use Uber Rideshare (recommended for now)

---

## ✅ Uber Rideshare Setup (Ready to Use!)

You have all the credentials needed for Uber Rideshare. However, you're **missing the Client Secret**.

### Getting Your Uber Client Secret:

1. Go to https://developer.uber.com/dashboard
2. Sign in with: ajvercueil7@gmail.com
3. Find your app (Client ID: L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v)
4. Look for **Secret UUID**: c88d5bff-ffbc-4a0f-a63a-7f950ddebb97
5. Click "Show" or "Reveal" to get the actual secret string
6. Copy the secret value

### Quick Setup:

```bash
# 1. Clone the Uber MCP
cd /Users/ajvercueil/Documents/omnimcp/mcps
git clone https://github.com/199-mcp/mcp-uber.git uber
cd uber

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Test it
UBER_CLIENT_ID=L9zv3hYznThLMrNYkO0aPIOs7Ev08B5v \
UBER_CLIENT_SECRET=your_secret_here \
UBER_REDIRECT_URI=http://localhost:3001/uber-redirect \
UBER_ENVIRONMENT=sandbox \
npm start
```

---

## Alternative: Use Uber Eats with OpenAI

If you want to modify Uber Eats to use OpenAI instead of Claude:

1. Clone the repo
2. Edit `browser.py`
3. Replace `ChatAnthropic` with `ChatOpenAI`
4. Use your OpenAI key instead

This requires Python knowledge but is totally doable!

---

## Recommendation

**For now, focus on Uber Rideshare:**
- ✅ You have Client ID
- ✅ You have Secret UUID (just need to reveal the actual secret)
- ✅ Redirect URI configured
- ✅ OAuth handler built

Once that's working, we can tackle Uber Eats with either:
- An Anthropic API key, OR
- Modified code to use OpenAI
