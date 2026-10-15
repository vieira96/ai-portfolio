import { InternalServerErrorException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { visitorIdFactory } from './visitor-id.decorator.js';

describe('visitorIdFactory', () => {
  const validVisitorId = '123e4567-e89b-42d3-a456-426614174000';

  function contextWithvisitorId(visitorId: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ visitorId }) as unknown as Request,
      }),
    } as unknown as ExecutionContext;
  }

  it('returns the visitor id fixed by the middleware', () => {
    expect(visitorIdFactory(undefined, contextWithvisitorId(validVisitorId))).toBe(
      validVisitorId,
    );
  });

  it('fails 500 when the middleware did not identify the visitor', () => {
    expect(() => visitorIdFactory(undefined, contextWithvisitorId(undefined))).toThrow(
      InternalServerErrorException,
    );
    expect(() =>
      visitorIdFactory(undefined, contextWithvisitorId('not-a-uuid')),
    ).toThrow(InternalServerErrorException);
  });
});
