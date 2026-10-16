import { describe, expect, it, vi } from 'vitest';
import { AiService } from './ai.service.js';

describe('AiService', () => {
  it('reports the availability and configured model from the provider', async () => {
    const provider = {
      chat: vi.fn(),
      isAvailable: vi.fn().mockResolvedValue(true),
      modelName: 'test-model',
    };
    const service = new AiService(provider as never);

    await expect(service.checkHealth()).resolves.toEqual({
      status: 'ok',
      model: 'test-model',
    });
    expect(provider.isAvailable).toHaveBeenCalledOnce();
  });

  it('returns a writing suggestion from the provider', async () => {
    const provider = {
      chat: vi.fn().mockResolvedValue('  Bio revisada.  '),
      isAvailable: vi.fn(),
      modelName: 'test-model',
    };
    const service = new AiService(provider as never);

    await expect(
      service.suggestWriting({ fieldType: 'bio', text: 'Bio original.' }),
    ).resolves.toEqual({ suggestion: 'Bio revisada.' });
    expect(provider.chat).toHaveBeenCalledWith(
      expect.stringContaining('Bio original.'),
    );
  });

  it('rejects an empty provider response', async () => {
    const provider = {
      chat: vi.fn().mockResolvedValue('  '),
      isAvailable: vi.fn(),
      modelName: 'test-model',
    };
    const service = new AiService(provider as never);

    await expect(
      service.suggestWriting({ fieldType: 'headline', text: 'Dev' }),
    ).rejects.toThrow('The AI provider returned an empty suggestion');
  });

  it('propagates provider failures to the existing HTTP error handling', async () => {
    const provider = {
      chat: vi.fn().mockRejectedValue(new Error('provider unavailable')),
      isAvailable: vi.fn(),
      modelName: 'test-model',
    };
    const service = new AiService(provider as never);

    await expect(
      service.suggestWriting({ fieldType: 'bio', text: 'Bio original.' }),
    ).rejects.toThrow('provider unavailable');
  });
});
