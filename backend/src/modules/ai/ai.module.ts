import { Module } from '@nestjs/common';
import { AiController } from './controllers/ai.controller.js';
import { LlmProvider } from './providers/llm.provider.js';
import { ChainedLlmProvider } from './providers/chained-llm.provider.js';
import { OllamaLlmProvider } from './providers/ollama/ollama.provider.js';
import { GroqLlmProvider } from './providers/groq/groq.provider.js';
import { GeminiLlmProvider } from './providers/gemini/gemini.provider.js';
import { AiService } from './services/ai.service.js';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    OllamaLlmProvider,
    GroqLlmProvider,
    GeminiLlmProvider,
    { provide: LlmProvider, useClass: ChainedLlmProvider },
  ],
  exports: [LlmProvider],
})
export class AiModule {}
