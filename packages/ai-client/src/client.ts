import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export type AIProvider = 'anthropic' | 'openai' | 'ollama';

export interface AIClientConfig {
  provider?: AIProvider;
  apiKey?: string;
  baseUrl?: string; // For Ollama: http://localhost:11434/v1
  model?: string;
  maxTokens?: number;
}

export class AIClient {
  private provider: AIProvider;
  private anthropicClient?: Anthropic;
  private openaiClient?: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(config: AIClientConfig) {
    this.provider = config.provider || 'anthropic';
    this.maxTokens = config.maxTokens || 1024;

    if (this.provider === 'anthropic') {
      if (!config.apiKey) {
        throw new Error('API key required for Anthropic provider');
      }
      this.anthropicClient = new Anthropic({
        apiKey: config.apiKey,
      });
      this.model = config.model || 'claude-3-5-sonnet-20241022';
    } else {
      // OpenAI-compatible provider (OpenAI, Ollama, LM Studio, etc.)
      const baseUrl = config.baseUrl ||
        (this.provider === 'ollama' ? 'http://localhost:11434/v1' : undefined);

      this.openaiClient = new OpenAI({
        apiKey: config.apiKey || 'ollama', // Ollama doesn't need a real key
        baseURL: baseUrl,
      });
      this.model = config.model || 'gpt-oss:latest';
    }
  }

  async complete(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    if (this.provider === 'anthropic' && this.anthropicClient) {
      const response = await this.anthropicClient.messages.create({
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        temperature: options?.temperature ?? 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      return textContent?.type === 'text' ? textContent.text : '';
    } else if (this.openaiClient) {
      const response = await this.openaiClient.chat.completions.create({
        model: this.model,
        max_tokens: options?.maxTokens || this.maxTokens,
        temperature: options?.temperature ?? 0.3,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
      });

      return response.choices[0]?.message?.content || '';
    }

    throw new Error('No AI client configured');
  }

  async completeJSON<T>(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number },
  ): Promise<T | null> {
    const response = await this.complete(
      systemPrompt +
        '\n\nRespond ONLY with valid JSON. Do not include any other text or markdown formatting.',
      userMessage,
      options,
    );

    try {
      // Clean up potential markdown code blocks
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleaned) as T;
    } catch {
      console.error('Failed to parse AI response as JSON:', response);
      return null;
    }
  }

  getModel(): string {
    return this.model;
  }

  getProvider(): AIProvider {
    return this.provider;
  }
}
