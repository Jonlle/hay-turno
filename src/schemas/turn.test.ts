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
    expect(result.error?.issues[0]?.message).toBe('El nombre debe tener al menos 2 caracteres.');
  });

  it('rejects unsupported client name characters', () => {
    const result = remoteTurnSchema.safeParse({
      clientName: 'Juan@Pérez',
      source: 'remote',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Solo se permiten letras, números, espacios, apóstrofes, puntos y guiones.',
    );
  });

  it('normalizes surrounding whitespace in client names', () => {
    expect(normalizeTurnClientName('  Ana María  ')).toBe('Ana María');
  });
});
