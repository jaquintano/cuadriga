import { describe, expect, it } from 'vitest';
import type { Campo, Secrets } from '../src/core/types';
import { candidatosExact, candidatosKeywords, validarCon } from '../src/core/validate';
import fx from './crypto.fixture.json';

// Secretos sintéticos generados por scripts/make-test-fixture.py (mismo esquema que el build real).
const S = { salt: fx.salt, hashes: fx.hashes } as unknown as Secrets;
const exact: Campo = { id: 'a', tipo: 'obligatorio', modo: 'exact', etiqueta: '' };
const kw: Campo = { id: 'a', tipo: 'obligatorio', modo: 'keywords', etiqueta: '' };
const libre: Campo = { id: 'a', tipo: 'obligatorio', modo: 'libre', etiqueta: '' };
const cifra: Campo = { id: 'c', tipo: 'obligatorio', modo: 'exact', etiqueta: '', cifra: 1 };

describe('candidatos', () => {
  it('exact extrae el número solo si hay uno', () => {
    expect(candidatosExact('42')).toEqual(['42']);
    expect(candidatosExact('42 idiomas')).toEqual(['42 idiomas', '42']);
    expect(candidatosExact('2 por 21')).toEqual(['2 por 21']);
  });

  it('keywords genera prefijos de palabras y bigramas', () => {
    const c = candidatosKeywords('sans soucis');
    expect(c).toContain('san');
    expect(c).toContain('sans souci');
    expect(c).toContain('soucis');
    expect(c).not.toContain('sa');
    expect(c).not.toContain('sans ');
  });
});

describe('validación (hash compatible con Python)', () => {
  it('exact: valor, número en letra y número dentro de una frase', async () => {
    for (const t of ['42', 'cuarenta y dos', 'Son 42 cosas', '¡CUARENTA Y DOS!']) {
      expect((await validarCon(S, 1, exact, t)).ok, t).toBe(true);
    }
  });

  it('exact: rechaza otros valores y frases con varios números', async () => {
    for (const t of ['43', '4', '420', '42 o 43', 'cuarenta', '']) {
      expect((await validarCon(S, 1, exact, t)).ok, t).toBe(false);
    }
  });

  it('keywords: palabra, prefijo, bigrama y tildes', async () => {
    for (const t of ['Georg', 'Georgbräu', 'la casa georgiana', 'Sans Souci', 'SANS, SOUCI.', 'sans soucis']) {
      expect((await validarCon(S, 2, kw, t)).ok, t).toBe(true);
    }
  });

  it('keywords: no casa subcadenas que no son prefijo ni palabras sueltas del bigrama', async () => {
    for (const t of ['jorge', 'san jorge', 'sans', 'souci', 'geo', 'xgeorg']) {
      expect((await validarCon(S, 2, kw, t)).ok, t).toBe(false);
    }
  });

  it('libre: cualquier texto no vacío', async () => {
    expect((await validarCon(S, 9, libre, 'Un músico con laúd')).ok).toBe(true);
    expect((await validarCon(S, 9, libre, '  ¿?  ')).ok).toBe(false);
  });

  it('un campo de cifra devuelve la cifra, no la frase', async () => {
    expect(await validarCon(S, 3, cifra, 'siete aspas')).toEqual({ ok: true, valor: '7' });
  });

  it('un campo sin hashes nunca valida', async () => {
    expect((await validarCon(S, 5, exact, '42')).ok).toBe(false);
  });

  it('el hash depende del campo: el mismo valor no vale en otro sobre', async () => {
    expect((await validarCon(S, 3, { ...exact, id: 'c' }, '42')).ok).toBe(false);
  });
});
