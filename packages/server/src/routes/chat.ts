/**
 * Chat API routes
 * Handles real-time chat with LLMs and MCP tool calling
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { llmProvider, type LLMModel, type Message } from '../services/llm-providers.js';
import { buildToolsFromMCPs, parseToolCall, formatToolResult } from '../services/mcp-to-functions.js';
import { mcpRegistry } from '../index.js';
import { requireAuth } from '../middleware/auth-middleware.js';
import { getUserEnabledMCPs, getMCPTools } from '../services/mcp-database.js';

export const chatRouter = Router();

/**
 * POST /api/chat
 * Send a message and get a response from the LLM
 * Supports streaming responses
 */
chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { model, messages } = req.body as {
      model: LLMModel;
      messages: Message[];
    };

    // TODO: Get user from JWT token
    const userId = 'user_id_placeholder';

    // Get user's enabled MCPs
    const enabledMCPs = await getUserEnabledMCPs(userId);

    // Convert MCPs to function calling format
    const tools = await buildToolsFromMCPs(enabledMCPs);

    // Set up SSE (Server-Sent Events) for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Conversation loop - handle tool calls
    const conversationMessages = [...messages];
    let loopCount = 0;
    const maxLoops = 10; // Prevent infinite loops

    while (loopCount < maxLoops) {
      loopCount++;

      // Stream response from LLM
      let hasToolCalls = false;
      const toolCallsToExecute: any[] = [];

      for await (const chunk of llmProvider.chatStream(
        model,
        conversationMessages,
        tools
      )) {
        if (chunk.type === 'text' && chunk.content) {
          // Send text chunk to client
          res.write(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`);
        }

        if (chunk.type === 'tool_call' && chunk.toolCall) {
          hasToolCalls = true;
          toolCallsToExecute.push(chunk.toolCall);

          // Notify client that tool is being called
          res.write(
            `data: ${JSON.stringify({
              type: 'tool_call_start',
              toolName: chunk.toolCall.name,
            })}\n\n`
          );
        }
      }

      // If no tool calls, we're done
      if (!hasToolCalls) {
        break;
      }

      // Execute tool calls
      for (const toolCall of toolCallsToExecute) {
        try {
          // Parse namespaced tool name
          const { serverId, toolName } = parseToolCall(toolCall.name);

          // Call the MCP tool
          const result = await mcpRegistry.callTool({
            serverId,
            toolName,
            arguments: toolCall.arguments,
          });

          // Send tool result to client
          res.write(
            `data: ${JSON.stringify({
              type: 'tool_call_result',
              toolName: toolCall.name,
              result,
            })}\n\n`
          );

          // Add tool result to conversation
          conversationMessages.push({
            role: 'assistant',
            content: `Tool ${toolCall.name} called with result: ${formatToolResult(result)}`,
          });
        } catch (error: any) {
          // Send error to client
          res.write(
            `data: ${JSON.stringify({
              type: 'tool_call_error',
              toolName: toolCall.name,
              error: error.message,
            })}\n\n`
          );

          // Add error to conversation
          conversationMessages.push({
            role: 'assistant',
            content: `Tool ${toolCall.name} failed: ${error.message}`,
          });
        }
      }
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: error.message,
      })}\n\n`
    );
    res.end();
  }
});

/**
 * POST /api/chat/simple
 * Non-streaming version for simpler clients
 */
chatRouter.post('/simple', async (req: Request, res: Response) => {
  try {
    const { model, messages } = req.body as {
      model: LLMModel;
      messages: Message[];
    };

    // TODO: Get user from JWT token
    const userId = 'user_id_placeholder';

    // Get user's enabled MCPs
    const enabledMCPs = await getUserEnabledMCPs(userId);

    // Convert MCPs to function calling format
    const tools = await buildToolsFromMCPs(enabledMCPs);

    // Call LLM
    const response = await llmProvider.chat(model, messages, tools);

    // If tool calls, execute them
    if (response.toolCalls) {
      const toolResults = [];

      for (const toolCall of response.toolCalls) {
        const { serverId, toolName } = parseToolCall(toolCall.name);

        const result = await mcpRegistry.callTool({
          serverId,
          toolName,
          arguments: toolCall.arguments,
        });

        toolResults.push({
          toolCall: toolCall.name,
          result,
        });
      }

      res.json({
        success: true,
        response,
        toolResults,
      });
    } else {
      res.json({
        success: true,
        response,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/chat/models
 * List available models
 */
chatRouter.get('/models', async (req: Request, res: Response) => {
  const models = [
    {
      id: 'gpt-4' as LLMModel,
      name: 'GPT-4',
      provider: 'OpenAI',
      description: 'Most capable GPT-4 model',
    },
    {
      id: 'gpt-4-turbo' as LLMModel,
      name: 'GPT-4 Turbo',
      provider: 'OpenAI',
      description: 'Faster and cheaper GPT-4',
    },
    {
      id: 'gpt-3.5-turbo' as LLMModel,
      name: 'GPT-3.5 Turbo',
      provider: 'OpenAI',
      description: 'Fast and affordable',
    },
    {
      id: 'claude-3-5-sonnet-20241022' as LLMModel,
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      description: 'Most intelligent Claude model',
    },
    {
      id: 'claude-3-opus-20240229' as LLMModel,
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: 'Powerful reasoning',
    },
    {
      id: 'gemini-pro' as LLMModel,
      name: 'Gemini Pro',
      provider: 'Google',
      description: 'Google\'s capable model',
    },
  ];

  res.json({
    success: true,
    models,
  });
});

/**
 * Helper: Get user's enabled MCPs
 * TODO: Replace with actual database query
 */
async function getUserEnabledMCPs(userId: string) {
  // Placeholder - query user_mcp_installations + mcp_servers
  // SELECT ms.* FROM mcp_servers ms
  // JOIN user_mcp_installations umi ON ms.id = umi.server_id
  // WHERE umi.user_id = userId AND umi.enabled = true

  return [];
}
