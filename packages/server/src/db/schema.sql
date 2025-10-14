-- OmniMCP Platform Database Schema

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  api_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_api_key ON users(api_key);

-- MCP Servers table (supports both hosted and registered)
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  version VARCHAR(50) DEFAULT '1.0.0',

  -- Ownership
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_official BOOLEAN DEFAULT false,

  -- Hosting type
  hosting_type VARCHAR(50) NOT NULL CHECK (hosting_type IN ('platform_hosted', 'developer_hosted')),

  -- For developer-hosted MCPs
  callback_url VARCHAR(500),
  webhook_secret VARCHAR(255),

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  health_status VARCHAR(50) DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown')),
  last_health_check TIMESTAMP,

  -- Metadata
  tags TEXT[], -- Array of tags for categorization
  logo_url VARCHAR(500),
  documentation_url VARCHAR(500),

  -- Stats
  install_count INTEGER DEFAULT 0,
  request_count BIGINT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX idx_mcp_servers_owner ON mcp_servers(owner_id);
CREATE INDEX idx_mcp_servers_hosting_type ON mcp_servers(hosting_type);
CREATE INDEX idx_mcp_servers_status ON mcp_servers(status);

-- MCP Tools table (capabilities of each MCP)
CREATE TABLE mcp_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL, -- JSON Schema for parameters

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(server_id, name)
);

CREATE INDEX idx_mcp_tools_server ON mcp_tools(server_id);

-- MCP Resources table
CREATE TABLE mcp_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  uri VARCHAR(500) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  mime_type VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(server_id, uri)
);

CREATE INDEX idx_mcp_resources_server ON mcp_resources(server_id);

-- MCP Prompts table
CREATE TABLE mcp_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  arguments JSONB, -- JSON Schema for arguments

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(server_id, name)
);

CREATE INDEX idx_mcp_prompts_server ON mcp_prompts(server_id);

-- User MCP Installations (which MCPs each user has enabled)
CREATE TABLE user_mcp_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,

  -- Configuration (credentials, settings, etc.)
  config JSONB DEFAULT '{}',

  -- Status
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, server_id)
);

CREATE INDEX idx_user_mcp_installations_user ON user_mcp_installations(user_id);
CREATE INDEX idx_user_mcp_installations_server ON user_mcp_installations(server_id);

-- Request logs (for analytics and billing)
CREATE TABLE request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE SET NULL,

  -- Request details
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('tool_call', 'resource_read', 'prompt_get')),
  tool_name VARCHAR(255),

  -- Response
  status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  response_time_ms INTEGER,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_request_logs_user ON request_logs(user_id);
CREATE INDEX idx_request_logs_server ON request_logs(server_id);
CREATE INDEX idx_request_logs_created_at ON request_logs(created_at);

-- Subscription limits by tier
CREATE TABLE subscription_limits (
  tier VARCHAR(50) PRIMARY KEY CHECK (tier IN ('free', 'pro', 'enterprise')),
  max_mcps INTEGER NOT NULL,
  max_requests_per_month INTEGER NOT NULL,
  can_create_mcps BOOLEAN DEFAULT false
);

INSERT INTO subscription_limits (tier, max_mcps, max_requests_per_month, can_create_mcps) VALUES
  ('free', 5, 1000, false),
  ('pro', 50, 100000, true),
  ('enterprise', -1, -1, true); -- -1 means unlimited

-- Visual MCP Builder (for V2 - no-code MCP creation)
CREATE TABLE visual_mcps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,

  -- Visual configuration (stored as JSON)
  config JSONB NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_visual_mcps_user ON visual_mcps(user_id);
CREATE INDEX idx_visual_mcps_server ON visual_mcps(server_id);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER mcp_servers_updated_at BEFORE UPDATE ON mcp_servers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_mcp_installations_updated_at BEFORE UPDATE ON user_mcp_installations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER visual_mcps_updated_at BEFORE UPDATE ON visual_mcps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
