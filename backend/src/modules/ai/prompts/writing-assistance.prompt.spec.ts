import { describe, expect, it } from 'vitest';
import { buildWritingAssistancePrompt } from './writing-assistance.prompt.js';

describe('buildWritingAssistancePrompt', () => {
  it('includes the supplied content and field-specific professional guidance', () => {
    const prompt = buildWritingAssistancePrompt(
      'experienceDescription',
      'Desenvolvimento de APIs com NestJS.',
    );

    expect(prompt).toContain('Desenvolvimento de APIs com NestJS.');
    expect(prompt).toContain('descrição da experiência profissional');
    expect(prompt).toContain('Não invente nem exagere tecnologias');
    expect(prompt).toContain('Retorne somente o texto revisado');
    expect(prompt).toContain('string JSON');
  });

  it('uses a concise instruction for headlines', () => {
    expect(
      buildWritingAssistancePrompt('headline', 'Dev full stack'),
    ).toContain('headline profissional breve e direta');
  });
});
