# Supabase Setup Guide

Complete guide to set up Supabase for the OmniMCP platform.

## Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - **Name**: omnimcp (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
6. Click "Create new project"
7. Wait ~2 minutes for project to be ready

## Step 2: Get API Credentials (1 minute)

1. Once project is ready, go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (long string, keep secret!)

3. Update your `.env` file:
   ```bash
   cd packages/server
   cp .env.example .env
   ```

4. Paste your credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGc... (your anon key)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)
   ```

## Step 3: Run Database Schema (5 minutes)

1. In Supabase dashboard, go to **SQL Editor** (database icon)
2. Click "New Query"
3. Copy your entire schema from `packages/server/src/db/schema.sql`
4. Paste into the query editor
5. Click "Run" or press Cmd/Ctrl + Enter
6. You should see "Success. No rows returned"

### Verify Tables Created

1. Go to **Table Editor** (spreadsheet icon)
2. You should see these tables:
   - users
   - mcp_servers
   - mcp_tools
   - mcp_resources
   - mcp_prompts
   - user_mcp_installations
   - request_logs
   - subscription_limits
   - visual_mcps

## Step 4: Set Up Auth (2 minutes)

1. Go to **Authentication** (person icon) → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Optional: Configure email templates
   - Go to **Email Templates**
   - Customize confirmation/reset emails

### Configure Auth Settings

1. Go to **Authentication** → **Settings**
2. Set **Site URL**: `http://localhost:3001` (for development)
3. Add to **Redirect URLs**:
   - `http://localhost:3001`
   - `http://localhost:3001/auth/callback`
4. Later, add your production URLs

## Step 5: Add Helper Functions (Optional but Recommended)

Run this SQL to add useful functions:

```sql
-- Function to increment install count
CREATE OR REPLACE FUNCTION increment_install_count(server_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE mcp_servers
  SET install_count = install_count + 1
  WHERE id = server_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment request count
CREATE OR REPLACE FUNCTION increment_request_count(server_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE mcp_servers
  SET request_count = request_count + 1
  WHERE id = server_id;
END;
$$ LANGUAGE plpgsql;
```

## Step 6: Add Row Level Security (RLS) Policies

For production, add these RLS policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mcp_installations ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can read active MCP servers
CREATE POLICY "Anyone can read active MCPs"
  ON mcp_servers FOR SELECT
  USING (status = 'active');

-- Users can create MCPs if they have pro/enterprise tier
CREATE POLICY "Pro users can create MCPs"
  ON mcp_servers FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users
      WHERE subscription_tier IN ('pro', 'enterprise')
    )
  );

-- Users can read their own installations
CREATE POLICY "Users can read own installations"
  ON user_mcp_installations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own installations
CREATE POLICY "Users can manage own installations"
  ON user_mcp_installations FOR ALL
  USING (auth.uid() = user_id);
```

## Step 7: Seed Initial Data (Optional)

Add some test MCPs:

```sql
-- Insert official MCPs
INSERT INTO mcp_servers (name, description, version, is_official, hosting_type, status) VALUES
('github', 'GitHub integration - create issues, read repos, manage PRs', '1.0.0', true, 'platform_hosted', 'active'),
('weather', 'Get weather information for any location', '1.0.0', true, 'platform_hosted', 'active'),
('slack', 'Send messages, read channels, manage workspace', '1.0.0', true, 'platform_hosted', 'active');

-- Get server IDs
SELECT id, name FROM mcp_servers;

-- Add tools (replace server_id with actual IDs from above)
INSERT INTO mcp_tools (server_id, name, description, parameters) VALUES
('github-server-id', 'create_issue', 'Create a new GitHub issue', '{"type": "object", "properties": {"repo": {"type": "string"}, "title": {"type": "string"}, "body": {"type": "string"}}}'),
('weather-server-id', 'get_weather', 'Get current weather', '{"type": "object", "properties": {"city": {"type": "string"}}}'),
('slack-server-id', 'send_message', 'Send a Slack message', '{"type": "object", "properties": {"channel": {"type": "string"}, "message": {"type": "string"}}}');
```

## Step 8: Test Your Setup

### Test 1: Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": { ... },
  "token": "eyJhbGc..."
}
```

### Test 2: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test 3: Check User Info

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 9: Check Data in Supabase

1. Go to **Table Editor**
2. Click on **users** table
3. You should see your test user!
4. Check the **api_key** column - that's the key for SDK deployment

## Troubleshooting

### "Invalid API key"
- Check your `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Make sure you copied the entire key (they're very long)
- Restart your server after changing `.env`

### "relation does not exist"
- Go to SQL Editor and re-run your schema
- Check for any errors in the schema execution
- Verify tables were created in Table Editor

### "JWT expired" or "Invalid token"
- Tokens expire after a period (default: 1 hour)
- Call `/api/auth/refresh` with the refresh token
- Or login again

### Can't register users
- Check Supabase Auth is enabled: Authentication → Providers → Email
- Check Site URL is configured: Authentication → Settings
- Look at Supabase logs: Logs & Reports → Auth Logs

### RLS Policy errors
- For development, you can temporarily disable RLS:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ```
- For production, properly configure RLS policies

## Production Checklist

Before deploying to production:

- [ ] Change Supabase password
- [ ] Set up proper RLS policies
- [ ] Add production URLs to Auth settings
- [ ] Configure email templates
- [ ] Set up database backups (automatic in Supabase)
- [ ] Enable MFA for Supabase account
- [ ] Set up monitoring/alerts
- [ ] Review and limit API key permissions

## Supabase Dashboard Features

### Useful Features:
- **SQL Editor**: Run queries, test data
- **Table Editor**: View/edit data visually
- **Auth**: Manage users, see login attempts
- **Database**: Check connections, performance
- **Logs**: View real-time logs
- **API Docs**: Auto-generated API documentation

### Performance Tips:
- Add indexes on frequently queried columns
- Use Supabase's built-in caching
- Monitor query performance in Dashboard
- Use connection pooling for high traffic

## Next Steps

1. ✅ Supabase is set up!
2. Start your servers:
   ```bash
   # Terminal 1: Backend
   cd packages/server
   npm run dev

   # Terminal 2: Frontend
   cd packages/dashboard
   npm run dev
   ```
3. Test registration at: http://localhost:3001
4. Build your first MCP
5. Deploy to production!

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

**Questions?** Check the main README or CHAT_IMPLEMENTATION.md
