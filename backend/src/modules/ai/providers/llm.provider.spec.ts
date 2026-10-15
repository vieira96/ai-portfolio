import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import {
  isGeminiConfigured,
  isGroqConfigured,
} from './llm.provider.js';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string) => values[key],
  } as unknown as ConfigService;
}

describe('provider configuration', () => {
  it('detects configured Groq and Gemini keys', () => {
    const config = configWith({
      GROQ_API_KEY: 'groq-key',
      GEMINI_API_KEY: 'gemini-key',
    });

    expect(isGroqConfigured(config)).toBe(true);
    expect(isGeminiConfigured(config)).toBe(true);
  });

  it('skips empty Groq and Gemini keys', () => {
    const config = configWith({ GROQ_API_KEY: '', GEMINI_API_KEY: '' });

    expect(isGroqConfigured(config)).toBe(false);
    expect(isGeminiConfigured(config)).toBe(false);
  });

  it('returns false when keys are absent', () => {
    const config = configWith({});

    expect(isGroqConfigured(config)).toBe(false);
    expect(isGeminiConfigured(config)).toBe(false);
  });
});
