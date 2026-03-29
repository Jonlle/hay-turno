import {
  normalizeTurnClientName,
  remoteTurnSchema,
  walkInTurnSchema,
} from './turn';

describe('turn schema validation', () => {
  it('accepts a valid Remote Turn input', () => {
    const result = remoteTurnSchema.parse({
      clientName: '  Juan Pérez  ',
      source: 'remote',
    });

    expect(result).toEqual({
      clientName: 'Juan Pérez',
      source: 'remote',
    });
  });

  it('accepts a valid Walk-in Turn input', () => {
    const result = walkInTurnSchema.parse({
      clientName: 'Luis-2',
      source: 'walk-in',
    });

    expect(result).toEqual({
      clientName: 'Luis-2',
      source: 'walk-in',
    });
  });

  it('rejects a blank client name', () => {
    const result = remoteTurnSchema.safeParse({
      clientName: '   ',
      source: 'remote',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Client name must contain at least 2 characters.');
  });

  it('rejects unsupported client name characters', () => {
    const result = remoteTurnSchema.safeParse({
      clientName: 'Juan@Pérez',
      source: 'remote',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Client name can only contain letters, numbers, spaces, apostrophes, dots, and hyphens.',
    );
  });

  it('normalizes surrounding whitespace in client names', () => {
    expect(normalizeTurnClientName('  Ana María  ')).toBe('Ana María');
  });
});
