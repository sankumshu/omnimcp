/**
 * LLM Provider Service
 * Handles calls to different LLM APIs (OpenAI, Anthropic, Google)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Tool } from '../types/index.js';

export type LLMModel =
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229'
  | 'gemini-pro'
  | 'gemini-pro-vision';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  content?: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'tool_calls' | 'length';
}

export interface StreamChunk {
  type: 'text' | 'tool_call';
  content?: string;
  toolCall?: ToolCall;
}

/**
 * Main LLM Provider class
 */
export class LLMProvider {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private google: GoogleGenerativeAI | null = null;

  constructor() {
    // Lazy initialization - clients created on first use
  }

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropic;
  }

  private getGoogle(): GoogleGenerativeAI {
    if (!this.google) {
      this.google = new GoogleGenerativeAI(
        process.env.GOOGLE_API_KEY || ''
      );
    }
    return this.google;
  }

  /**
   * Call an LLM with messages and available tools
   */
  async chat(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): Promise<LLMResponse> {
    if (this.isOpenAIModel(model)) {
      return this.chatOpenAI(model, messages, tools);
    } else if (this.isAnthropicModel(model)) {
      return this.chatAnthropic(model, messages, tools);
    } else if (this.isGoogleModel(model)) {
      return this.chatGoogle(model, messages, tools);
    }

    throw new Error(`Unsupported model: ${model}`);
  }

  /**
   * Stream chat responses
   */
  async *chatStream(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): AsyncGenerator<StreamChunk> {
    if (this.isOpenAIModel(model)) {
      yield* this.chatStreamOpenAI(model, messages, tools);
    } else if (this.isAnthropicModel(model)) {
      yield* this.chatStreamAnthropic(model, messages, tools);
    } else {
      throw new Error(`Streaming not supported for model: ${model}`);
    }
  }

  /**
   * OpenAI Chat
   */
  private async chatOpenAI(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): Promise<LLMResponse> {
    const response = await this.getOpenAI().chat.completions.create({
      model,
      messages,
      tools: this.convertToolsToOpenAI(tools),
      tool_choice: 'auto',
    });

    const message = response.choices[0]?.message;

    if (message?.tool_calls) {
      return {
        toolCalls: message.tool_calls.map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
        finishReason: 'tool_calls',
      };
    }

    return {
      content: message?.content || '',
      finishReason: response.choices[0]?.finish_reason as any,
    };
  }

  /**
   * OpenAI Streaming
   */
  private async *chatStreamOpenAI(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): AsyncGenerator<StreamChunk> {
    const stream = await this.getOpenAI().chat.completions.create({
      model,
      messages,
      tools: this.convertToolsToOpenAI(tools),
      tool_choice: 'auto',
      stream: true,
    });

    let currentToolCall: Partial<ToolCall> | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      // Handle text content
      if (delta?.content) {
        yield {
          type: 'text',
          content: delta.content,
        };
      }

      // Handle tool calls
      if (delta?.tool_calls) {
        const toolCall = delta.tool_calls[0];

        if (!currentToolCall) {
          currentToolCall = {
            id: toolCall.id,
            name: toolCall.function?.name,
            arguments: {},
          };
        }

        if (toolCall.function?.arguments) {
          // Accumulate arguments
          const args = toolCall.function.arguments;
          currentToolCall.arguments = {
            ...currentToolCall.arguments,
            ...JSON.parse(args),
          };
        }
      }

      // Finish tool call
      if (chunk.choices[0]?.finish_reason === 'tool_calls' && currentToolCall) {
        yield {
          type: 'tool_call',
          toolCall: currentToolCall as ToolCall,
        };
        currentToolCall = null;
      }
    }
  }

  /**
   * Anthropic Chat
   */
  private async chatAnthropic(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): Promise<LLMResponse> {
    const response = await this.getAnthropic().messages.create({
      model,
      max_tokens: 4096,
      messages: messages.map((m) => ({
        role: m.role === 'system' ? 'user' : m.role,
        content: m.content,
      })),
      tools: this.convertToolsToAnthropic(tools),
    });

    const content = response.content[0];

    if (content.type === 'tool_use') {
      return {
        toolCalls: [
          {
            id: content.id,
            name: content.name,
            arguments: content.input as Record<string, any>,
          },
        ],
        finishReason: 'tool_calls',
      };
    }

    return {
      content: content.type === 'text' ? content.text : '',
      finishReason: response.stop_reason as any,
    };
  }

  /**
   * Anthropic Streaming
   */
  private async *chatStreamAnthropic(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): AsyncGenerator<StreamChunk> {
    const stream = this.getAnthropic().messages.stream({
      model,
      max_tokens: 4096,
      messages: messages.map((m) => ({
        role: m.role === 'system' ? 'user' : m.role,
        content: m.content,
      })),
      tools: this.convertToolsToAnthropic(tools),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        if (chunk.delta.type === 'text_delta') {
          yield {
            type: 'text',
            content: chunk.delta.text,
          };
        }
      }

      if (chunk.type === 'content_block_stop') {
        const content = (chunk as any).content_block;
        if (content?.type === 'tool_use') {
          yield {
            type: 'tool_call',
            toolCall: {
              id: content.id,
              name: content.name,
              arguments: content.input,
            },
          };
        }
      }
    }
  }

  /**
   * Google Chat (non-streaming)
   */
  private async chatGoogle(
    model: LLMModel,
    messages: Message[],
    tools: Tool[]
  ): Promise<LLMResponse> {
    const genModel = this.getGoogle().getGenerativeModel({ model });

    const prompt = messages.map((m) => m.content).join('\n');
    const result = await genModel.generateContent(prompt);
    const response = result.response;

    return {
      content: response.text(),
      finishReason: 'stop',
    };
  }

  /**
   * Convert MCP tools to OpenAI function format
   */
  private convertToolsToOpenAI(tools: Tool[]): any[] {
    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Convert MCP tools to Anthropic format
   */
  private convertToolsToAnthropic(tools: Tool[]): any[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  /**
   * Model type checks
   */
  private isOpenAIModel(model: string): boolean {
    return model.startsWith('gpt');
  }

  private isAnthropicModel(model: string): boolean {
    return model.startsWith('claude');
  }

  private isGoogleModel(model: string): boolean {
    return model.startsWith('gemini');
  }
}

// Export singleton instance
export const llmProvider = new LLMProvider();
