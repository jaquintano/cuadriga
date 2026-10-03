import { describe, expect, it } from 'vitest';
import { SOBRES } from '../src/core/content';
import { reduce } from '../src/core/reducer';
import { initialState } from '../src/core/state';
import { crearBackup, leerBackup, nombreBackup } from '../src/storage/backup';

describe('copia de seguridad', () => {
  it('exportar → importar devuelve el mismo estado', () => {
    let s = initialState(SOBRES);
    s = reduce(s, { type: 'OPEN', num: 0, now: 1 }, SOBRES);
    s = reduce(s, { type: 'SET_LLUVIA', on: true }, SOBRES);
    const texto = JSON.stringify(crearBackup(s));
    const importado = reduce(initialState(SOBRES), { type: 'IMPORT', state: leerBackup(texto) }, SOBRES);
    expect(importado).toEqual(s);
  });

  it('rechaza JSON roto o de otra app con un mensaje claro', () => {
    expect(() => leerBackup('{no')).toThrow(/JSON válido/);
    expect(() => leerBackup('{"app":"otra","state":{"v":1}}')).toThrow(/Cuádriga/);
    expect(() => leerBackup('{"app":"cuadriga","state":{"v":2}}')).toThrow(/Cuádriga/);
  });

  it('nombre de fichero con fecha', () => {
    expect(nombreBackup(new Date(2026, 9, 9, 8, 5))).toBe('cuadriga-estado-20261009-0805.json');
  });
});
