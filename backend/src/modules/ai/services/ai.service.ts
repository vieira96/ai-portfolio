import { Injectable } from '@nestjs/common';
import { AiHealthResponseDto } from '../dto/ai-health-response.dto.js';
import { LlmProvider } from '../providers/llm.provider.js';

@Injectable()
export class AiService {
  constructor(private readonly llmProvider: LlmProvider) {}

  async checkHealth(): Promise<AiHealthResponseDto> {
    const available = await this.llmProvider.isAvailable();
    return {
      status: available ? 'ok' : 'unavailable',
      model: this.llmProvider.modelName,
    };
  }
}
