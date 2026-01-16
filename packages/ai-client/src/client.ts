import Anthropic from '@anthropic-ai/sdk';

export interface AIClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export class AIClient {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(config: AIClientConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 1024;
  }

  async complete(
    systemPrompt: string,
    userMessage: string,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const response = await this.client.messages.create({
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
}
