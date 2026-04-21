import ollama from 'ollama';
import type { ModelConfig } from '../types.js';

export class OllamaClient {
  private modelName: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: ModelConfig) {
    this.modelName = config.name;
    this.temperature = config.temperature;
    this.maxTokens = config.maxTokens;
  }

  async checkModelExists(): Promise<boolean> {
    try {
      const models = await ollama.list();
      return models.models.some(m => m.name.includes(this.modelName));
    } catch (error) {
      console.error('❌ Error checking Ollama models:', error);
      return false;
    }
  }

  async review(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await ollama.chat({
        model: this.modelName,
        messages,
        options: {
          temperature: this.temperature,
          num_ctx: this.maxTokens,
        },
      });

      return response.message.content;
    } catch (error: any) {
      throw new Error(`Ollama review failed: ${error.message}`);
    }
  }

  async reviewWithStreaming(
    prompt: string,
    systemPrompt: string | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const messages: any[] = [];

      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      messages.push({ role: 'user', content: prompt });

      const response = await ollama.chat({
        model: this.modelName,
        messages,
        options: {
          temperature: this.temperature,
          num_ctx: this.maxTokens,
        },
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of response) {
        const content = chunk.message.content;
        fullResponse += content;
        onChunk(content);
      }

      return fullResponse;
    } catch (error: any) {
      throw new Error(`Ollama streaming review failed: ${error.message}`);
    }
  }

  getModelName(): string {
    return this.modelName;
  }
}
