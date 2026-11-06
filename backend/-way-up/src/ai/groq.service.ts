import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
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

export class AiOverloadedException extends ServiceUnavailableException {
  constructor() {
    super({ ok: false, error: 'Serwer AI jest chwilowo przeciążony. Spróbuj ponownie za chwilę.' });
  }
}

const SDK_MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30_000;

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.client = new Groq({
      apiKey: config.getOrThrow<string>('GROQ_API_KEY'),
      maxRetries: SDK_MAX_RETRIES,
      timeout: REQUEST_TIMEOUT_MS,
    });
    this.model = config.get<string>('GROQ_MODEL') ?? 'openai/gpt-oss-20b';
  }

  private buildParams(messages: ChatMessage[], options: CompletionOptions) {
    return {
      model: this.model,
      temperature: options.temperature ?? 0.85,
      max_completion_tokens: options.maxTokens ?? 2000,
      reasoning_effort: options.reasoningEffort ?? 'low',
      messages,
    } as const;
  }

  private mapError(err: unknown): unknown {
    if (err instanceof Groq.APIError && (err.status === 429 || err.status === 503)) {
      this.logger.warn(`Groq przeciążony (${err.status}) po ponowieniach SDK`);
      return new AiOverloadedException();
    }
    return err;
  }

  async complete(messages: ChatMessage[], options: CompletionOptions = {}): Promise<string> {
    const params = this.buildParams(messages, options);

    let completion;
    try {
      completion = await this.client.chat.completions.create(
        options.json ? { ...params, response_format: { type: 'json_object' } } : params,
      );
    } catch (err) {
      if (options.json && err instanceof Groq.APIError && err.status === 400) {
        this.logger.warn(`Tryb JSON odrzucony (${err.message}), ponawiam bez niego`);
        try {
          completion = await this.client.chat.completions.create(params);
        } catch (retryErr) {
          throw this.mapError(retryErr);
        }
      } else {
        throw this.mapError(err);
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

  async *stream(
    messages: ChatMessage[],
    options: CompletionOptions = {},
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    let stream;
    try {
      stream = await this.client.chat.completions.create(
        { ...this.buildParams(messages, options), stream: true as const },
        { signal },
      );
    } catch (err) {
      if (signal?.aborted) return;
      throw this.mapError(err);
    }

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    } catch (err) {
      if (signal?.aborted) return;
      throw this.mapError(err);
    }
  }
}