/**
 * MCP Process Manager
 * Manages spawning and communicating with MCP processes via stdio
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPProcessConfig {
  id: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface MCPToolCallRequest {
  jsonrpc: '2.0';
  id: number;
  method: 'tools/call';
  params: {
    name: string;
    arguments: any;
  };
}

export interface MCPToolCallResponse {
  jsonrpc: '2.0';
  id: number;
  result: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
}

export class MCPProcessManager extends EventEmitter {
  private processes: Map<string, ChildProcess> = new Map();
  private messageBuffers: Map<string, string> = new Map();
  private initialized: Map<string, boolean> = new Map();
  private requestId = 0;

  /**
   * Spawn an MCP process and initialize it
   */
  async spawn(config: MCPProcessConfig): Promise<void> {
    if (this.processes.has(config.id)) {
      throw new Error(`MCP process already running: ${config.id}`);
    }

    console.log(`[MCP ${config.id}] Spawning process...`);

    const mcpProcess = spawn(config.command, config.args, {
      cwd: config.cwd || process.cwd(),
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.processes.set(config.id, mcpProcess);
    this.messageBuffers.set(config.id, '');
    this.initialized.set(config.id, false);

    // Handle stdout - buffer messages
    mcpProcess.stdout?.on('data', (data) => {
      const text = data.toString();
      const buffer = this.messageBuffers.get(config.id) || '';
      this.messageBuffers.set(config.id, buffer + text);
    });

    // Handle stderr
    mcpProcess.stderr?.on('data', (data) => {
      const text = data.toString();
      console.error(`[MCP ${config.id}] stderr:`, text);
    });

    // Handle process exit
    mcpProcess.on('exit', (code) => {
      console.log(`[MCP ${config.id}] exited with code ${code}`);
      this.processes.delete(config.id);
      this.messageBuffers.delete(config.id);
      this.initialized.delete(config.id);
    });

    // Wait for process to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Initialize the MCP connection
    await this.initialize(config.id);
  }

  /**
   * Initialize MCP connection with handshake
   */
  private async initialize(mcpId: string): Promise<void> {
    console.log(`[MCP ${mcpId}] Sending initialize request...`);

    const initRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: 'omnimcp-platform',
          version: '0.1.0'
        }
      }
    };

    const mcpProcess = this.processes.get(mcpId);
    if (!mcpProcess) {
      throw new Error(`MCP process not found: ${mcpId}`);
    }

    // Send initialize request
    mcpProcess.stdin?.write(JSON.stringify(initRequest) + '\n');

    // Wait for initialize response
    await this.waitForResponse(mcpId, initRequest.id, 10000);

    // Send initialized notification
    const initNotification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };

    mcpProcess.stdin?.write(JSON.stringify(initNotification) + '\n');

    this.initialized.set(mcpId, true);
    console.log(`[MCP ${mcpId}] ✅ Initialized successfully`);
  }

  /**
   * Wait for a JSON-RPC response with specific ID
   */
  private async waitForResponse(mcpId: string, requestId: number, timeout: number): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const buffer = this.messageBuffers.get(mcpId) || '';
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
          const response = JSON.parse(line);
          if (response.id === requestId) {
            // Remove this line from buffer
            this.messageBuffers.set(mcpId, lines.slice(i + 1).join('\n'));
            return response;
          }
        } catch (e) {
          // Not valid JSON, keep buffering
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Timeout waiting for response to request ${requestId}`);
  }

  /**
   * Call a tool on an MCP process
   */
  async callTool(
    mcpId: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const mcpProcess = this.processes.get(mcpId);

    if (!mcpProcess) {
      throw new Error(`MCP process not running: ${mcpId}`);
    }

    if (!this.initialized.get(mcpId)) {
      throw new Error(`MCP not initialized: ${mcpId}`);
    }

    // Create JSON-RPC request
    const requestId = ++this.requestId;
    const request: MCPToolCallRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    console.log(`[MCP ${mcpId}] Calling tool ${toolName} (request ${requestId})`, JSON.stringify(args));

    // Send request to MCP via stdin
    mcpProcess.stdin?.write(JSON.stringify(request) + '\n');

    // Wait for response
    const response = await this.waitForResponse(mcpId, requestId, 120000); // 2 minute timeout for long-running tools like browser automation

    console.log(`[MCP ${mcpId}] Tool ${toolName} result:`, JSON.stringify(response.result));

    // Return the result
    return response.result;
  }

  /**
   * Stop an MCP process
   */
  async stop(mcpId: string): Promise<void> {
    const mcpProcess = this.processes.get(mcpId);

    if (!mcpProcess) {
      return;
    }

    mcpProcess.kill();
    this.processes.delete(mcpId);
    this.messageBuffers.delete(mcpId);
  }

  /**
   * Stop all MCP processes
   */
  async stopAll(): Promise<void> {
    for (const [mcpId] of this.processes) {
      await this.stop(mcpId);
    }
  }

  /**
   * Check if an MCP process is running
   */
  isRunning(mcpId: string): boolean {
    return this.processes.has(mcpId);
  }

  /**
   * Get all running MCP IDs
   */
  getRunningMCPs(): string[] {
    return Array.from(this.processes.keys());
  }
}

// Singleton instance
export const mcpProcessManager = new MCPProcessManager();
