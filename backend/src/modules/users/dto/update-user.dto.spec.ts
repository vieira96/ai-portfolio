import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateUserDto } from './update-user.dto.js';

describe('UpdateUserDto phone validation', () => {
  async function validatePhone(phone?: unknown) {
    const payload = phone === undefined ? {} : { phone };
    const dto = plainToInstance(UpdateUserDto, payload);
    return { dto, errors: await validate(dto) };
  }

  it('allows the field to be omitted', async () => {
    const { errors } = await validatePhone();

    expect(errors).toHaveLength(0);
  });

  it('trims a valid phone and accepts up to 30 characters', async () => {
    const phone = ` ${'1'.repeat(30)} `;
    const { dto, errors } = await validatePhone(phone);

    expect(dto.phone).toBe('1'.repeat(30));
    expect(errors).toHaveLength(0);
  });

  it('normalizes empty and whitespace-only strings to null', async () => {
    for (const phone of ['', '   ']) {
      const { dto, errors } = await validatePhone(phone);

      expect(dto.phone).toBeNull();
      expect(errors).toHaveLength(0);
    }
  });

  it('accepts explicit null and rejects values longer than 30 characters', async () => {
    const nullable = await validatePhone(null);
    const tooLong = await validatePhone('1'.repeat(31));

    expect(nullable.errors).toHaveLength(0);
    expect(nullable.dto.phone).toBeNull();
    expect(tooLong.errors.some((error) => error.property === 'phone')).toBe(true);
  });
});
