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
});
