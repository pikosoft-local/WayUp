import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  reasoningEffort?: 'low' | 'medium' | 'high';
}

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new Groq({ apiKey: config.getOrThrow<string>('GROQ_API_KEY') });
    this.model = config.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-20b';
  }

  async complete(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
    const params = {
      model: this.model,
      temperature: options.temperature ?? 0.85,
      max_completion_tokens: options.maxTokens ?? 2000,
      reasoning_effort: options.reasoningEffort ?? 'low',
      messages,
    } as const;

    let completion;
    try {
      completion = await this.client.chat.completions.create(
        options.json ? { ...params, response_format: { type: 'json_object' } } : params,
      );
    } catch (err) {
      if (options.json && err instanceof Groq.APIError && err.status === 400) {
        this.logger.warn(`Tryb JSON odrzucony (${err.message}), ponawiam bez niego`);
        completion = await this.client.chat.completions.create(params);
      } else {
        throw err;
      }
    }

    const choice = completion.choices[0];
    const content = choice?.message?.content?.trim();
    if (!content) {
      throw new Error(
        `Groq zwrócił pustą odpowiedź (finish_reason: ${choice?.finish_reason ?? 'brak'}).`,
      );
    }
    return content;
  }
}
