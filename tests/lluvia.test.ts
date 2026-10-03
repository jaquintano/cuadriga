import { describe, expect, it } from 'vitest';
import { SOBRES } from '../src/core/content';
import { aplicarLluvia, textoLluvia } from '../src/core/lluvia';

const todo = (num: number, lluvia: boolean) => {
  const s = aplicarLluvia(SOBRES[num], lluvia);
  return [...s.historia, s.enigma ?? '', ...s.extras.map((e) => e.texto), s.rumbo ?? ''].join(' ');
};

describe('variante de lluvia', () => {
  it('sustituye respetando la mayúscula inicial', () => {
    expect(textoLluvia('Recuperad los corceles y seguid')).toBe('Volved a la parada y seguid');
    expect(textoLluvia('después, recuperad los corceles')).toBe('después, volved a la parada');
    expect(textoLluvia('dos corceles de acero con ruedas')).toBe('dos carruajes públicos con ruedas');
  });

  it('cambia los sobres 09-14 y no deja corceles', () => {
    for (let n = 9; n <= 14; n++) {
      expect(todo(n, true), `sobre ${n}`).not.toMatch(/corceles/i);
    }
    expect(todo(9, true)).toMatch(/carruajes públicos/);
    expect(todo(11, true)).toMatch(/volved a la parada/);
    expect(todo(13, true)).toMatch(/Volved a la parada/);
  });

  it('sin lluvia, o fuera de 09-14, no toca nada', () => {
    expect(aplicarLluvia(SOBRES[9], false)).toBe(SOBRES[9]);
    expect(aplicarLluvia(SOBRES[3], true)).toBe(SOBRES[3]);
  });
});
