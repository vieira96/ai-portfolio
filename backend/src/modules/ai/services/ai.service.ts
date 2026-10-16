import { BadGatewayException, Injectable } from '@nestjs/common';
import { AiHealthResponseDto } from '../dto/ai-health-response.dto.js';
import type { AiWritingAssistanceRequestDto } from '../dto/ai-writing-assistance-request.dto.js';
import { AiWritingAssistanceResponseDto } from '../dto/ai-writing-assistance-response.dto.js';
import { LlmProvider } from '../providers/llm.provider.js';
import { buildWritingAssistancePrompt } from '../prompts/writing-assistance.prompt.js';

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

  async suggestWriting(
    request: AiWritingAssistanceRequestDto,
  ): Promise<AiWritingAssistanceResponseDto> {
    const suggestion = (
      await this.llmProvider.chat(
        buildWritingAssistancePrompt(request.fieldType, request.text),
      )
    ).trim();

    if (!suggestion) {
      throw new BadGatewayException(
        'The AI provider returned an empty suggestion',
      );
    }

    return { suggestion };
  }
}
