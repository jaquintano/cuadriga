import { describe, expect, it } from 'vitest';
import { formatoDuracion, probarCodigo } from '../src/core/cofre';
import type { Secrets } from '../src/core/types';
import fx from './crypto.fixture.json';

const S = {
  salt: fx.salt,
  kdf: { alg: 'PBKDF2-SHA256', iter: fx.iter },
  cofre: { hash: fx.cofreHash, carta: fx.carta },
} as unknown as Secrets;

describe('apertura del cofre', () => {
  it('con el código correcto devuelve la carta descifrada', async () => {
    expect(await probarCodigo(fx.codigo, S)).toEqual(['Párrafo uno.', 'Párrafo dos.']);
  });

  it('con un código incorrecto o mal formado devuelve null', async () => {
    for (const c of ['0000', '4321', '123', '12345', 'abcd', '']) {
      expect(await probarCodigo(c, S), c).toBeNull();
    }
  });
});

describe('formatoDuracion', () => {
  it('formatea minutos, horas y días', () => {
    expect(formatoDuracion(5 * 60000)).toBe('05 min');
    expect(formatoDuracion((2 * 60 + 7) * 60000)).toBe('2 h 07 min');
    expect(formatoDuracion((2 * 1440 + 11 * 60 + 5) * 60000)).toBe('2 d 11 h 05 min');
    expect(formatoDuracion(1440 * 60000)).toBe('1 d 0 h 00 min');
  });
});
