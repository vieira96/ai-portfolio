import { describe, expect, it } from 'vitest';
import { formatResumeDate, formatResumePeriod } from './resume-date';

describe('resume date formatting', () => {
  it('formats valid dates in Portuguese', () => {
    expect(formatResumeDate('2024-01-15')).toBe('jan de 2024');
  });

  it('returns a safe placeholder for empty or invalid dates', () => {
    expect(formatResumeDate('')).toBe('—');
    expect(formatResumeDate('invalid-date')).toBe('—');
    expect(formatResumeDate('2024-02-31')).toBe('—');
  });

  it('formats current and ended periods without throwing', () => {
    expect(formatResumePeriod('2024-01-01', null)).toBe('jan de 2024 — Atual');
    expect(formatResumePeriod('invalid-date', '2025-03-01')).toBe(
      '— — mar de 2025',
    );
  });
});
