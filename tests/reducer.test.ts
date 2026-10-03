import { describe, expect, it } from 'vitest';
import { SOBRES } from '../src/core/content';
import { finalNum, reduce, type Action } from '../src/core/reducer';
import { fase, puntosHonor, tieneAyudas } from '../src/core/selectors';
import { initialState, type GameState } from '../src/core/state';

const run = (s: GameState, ...as: Action[]) => as.reduce((acc, a) => reduce(acc, a, SOBRES), s);
const t = 1000;
const FIN = finalNum(SOBRES);

/** Resuelve un sobre rellenando todos sus campos obligatorios (valores ficticios salvo cifras). */
function resolver(s: GameState, num: number, cifra = 'X'): GameState {
  s = run(s, { type: 'OPEN', num, now: t });
  const def = SOBRES[num];
  if (def.accion === 'aceptar') return run(s, { type: 'ACCEPT', num, now: t });
  for (const c of def.campos.filter((c) => c.tipo === 'obligatorio')) {
    s = run(s, { type: 'FIELD_OK', num, campo: c.id, valor: c.cifra ? cifra : 'ok', now: t });
  }
  return s;
}

function resolverHasta(n: number): GameState {
  let s = initialState(SOBRES);
  for (let i = 0; i <= n; i++) s = resolver(s, i, { 3: '8', 10: '3', 13: '4', 22: '4' }[i] ?? 'X');
  return s;
}

describe('máquina de estados', () => {
  it('empieza todo LOCKED y en juego el sobre 00', () => {
    const s = initialState(SOBRES);
    expect(s.sobres.every((x) => x.st === 'LOCKED')).toBe(true);
    expect(fase(s, SOBRES)).toEqual({ tipo: 'sobre', num: 0 });
  });

  it('LOCKED → OPEN solo si el anterior está SOLVED', () => {
    const s0 = initialState(SOBRES);
    expect(run(s0, { type: 'OPEN', num: 1, now: t })).toBe(s0);
    const s1 = run(s0, { type: 'OPEN', num: 0, now: t });
    expect(s1.sobres[0].st).toBe('OPEN');
    expect(s1.startedAt).toBe(t);
    expect(run(s1, { type: 'OPEN', num: 1, now: t })).toBe(s1);
  });

  it('el sobre 00 se resuelve con «Aceptar la misión»', () => {
    const s = run(initialState(SOBRES), { type: 'OPEN', num: 0, now: t }, { type: 'ACCEPT', num: 0, now: 2 * t });
    expect(s.sobres[0]).toMatchObject({ st: 'SOLVED', solvedAt: 2 * t });
    expect(fase(s, SOBRES)).toEqual({ tipo: 'sobre', num: 1 });
  });

  it('ACCEPT no vale en sobres con enigma', () => {
    const s = run(resolverHasta(0), { type: 'OPEN', num: 1, now: t });
    expect(run(s, { type: 'ACCEPT', num: 1, now: t })).toBe(s);
  });

  it('con varios obligatorios, OPEN → SOLVED solo cuando están todos', () => {
    let s = run(resolverHasta(12), { type: 'OPEN', num: 13, now: t });
    s = run(s, { type: 'FIELD_OK', num: 13, campo: 'a', valor: 'patata', now: t });
    s = run(s, { type: 'FIELD_OK', num: 13, campo: 'b', valor: 'jueces', now: t });
    expect(s.sobres[13].st).toBe('OPEN');
    s = run(s, { type: 'FIELD_OK', num: 13, campo: 'c', valor: '4', now: t });
    expect(s.sobres[13].st).toBe('SOLVED');
  });

  it('honor y tesoros no bloquean y suman puntos (también tras resolver)', () => {
    let s = run(resolverHasta(2), { type: 'OPEN', num: 3, now: t });
    s = run(s, { type: 'FIELD_OK', num: 3, campo: 'a', valor: '8', now: t });
    expect(s.sobres[3].st).toBe('SOLVED');
    expect(puntosHonor(s, SOBRES)).toBe(0);
    s = run(s, { type: 'FIELD_OK', num: 3, campo: 'h', valor: 'libros', now: t });
    expect(puntosHonor(s, SOBRES)).toBe(1);
  });

  it('un campo ya aceptado no se sobrescribe', () => {
    let s = run(resolverHasta(2), { type: 'OPEN', num: 3, now: t }, { type: 'FIELD_OK', num: 3, campo: 'h', valor: 'libros', now: t });
    expect(run(s, { type: 'FIELD_OK', num: 3, campo: 'h', valor: 'otro', now: t })).toBe(s);
  });

  it('el sobre final no se abre con OPEN', () => {
    const s = resolverHasta(FIN - 1);
    expect(run(s, { type: 'OPEN', num: FIN, now: t })).toBe(s);
    expect(fase(s, SOBRES)).toEqual({ tipo: 'cofre' });
  });
});

describe('cifras', () => {
  it('se rellenan al resolver los sobres 03, 10, 13 y 22', () => {
    expect(resolverHasta(2).cifras).toEqual([null, null, null, null]);
    expect(resolverHasta(3).cifras).toEqual(['8', null, null, null]);
    expect(resolverHasta(10).cifras).toEqual(['8', '3', null, null]);
    expect(resolverHasta(22).cifras).toEqual(['8', '3', '4', '4']);
  });

  it('el Host salta un sobre con cifra y la cifra se rellena igual', () => {
    const s = run(resolverHasta(2), { type: 'HOST_SOLVE', num: 3, skip: true, cifra: '8', now: t });
    expect(s.sobres[3]).toMatchObject({ st: 'SOLVED', host: 'saltado' });
    expect(s.cifras[0]).toBe('8');
  });

  it('el Host no puede saltar un sobre que no está en juego', () => {
    const s = resolverHasta(2);
    expect(run(s, { type: 'HOST_SOLVE', num: 5, skip: true, now: t })).toBe(s);
  });
});

describe('comodines', () => {
  it('hay 3 en total y uno por sobre como máximo', () => {
    let s = run(initialState(SOBRES), { type: 'OPEN', num: 0, now: t });
    expect(s.comodinesLeft).toBe(3);
    s = run(s, { type: 'USE_COMODIN', num: 0 });
    expect(s.comodinesLeft).toBe(2);
    expect(run(s, { type: 'USE_COMODIN', num: 0 })).toBe(s);
  });

  it('no se gastan en sobres cerrados ni resueltos, ni por debajo de 0', () => {
    let s = initialState(SOBRES);
    expect(run(s, { type: 'USE_COMODIN', num: 0 })).toBe(s);
    s = resolverHasta(5);
    expect(run(s, { type: 'USE_COMODIN', num: 5 })).toBe(s);
    s = { ...run(s, { type: 'OPEN', num: 6, now: t }), comodinesLeft: 0 };
    expect(run(s, { type: 'USE_COMODIN', num: 6 })).toBe(s);
  });
});

describe('ayudas de comodín', () => {
  it('se ofrece comodín solo en sobres con ayudas útiles', () => {
    expect(tieneAyudas(SOBRES[1])).toBe(true);
    expect(tieneAyudas(SOBRES[14])).toBe(false); // «(No hace falta.)»
    expect(tieneAyudas(SOBRES[FIN])).toBe(false); // «—»
  });
});

describe('cofre', () => {
  it('no se abre antes de resolver el 22', () => {
    const s = resolverHasta(21);
    expect(run(s, { type: 'OPEN_COFRE', carta: ['x'], now: t })).toBe(s);
  });

  it('se abre tras el 22 y cierra la partida', () => {
    const s = run(resolverHasta(22), { type: 'OPEN_COFRE', carta: ['Querida Guardiana'], now: 5 * t });
    expect(s.cofreAbierto).toBe(true);
    expect(s.finishedAt).toBe(5 * t);
    expect(s.carta).toEqual(['Querida Guardiana']);
    expect(s.sobres[FIN].st).toBe('SOLVED');
    expect(fase(s, SOBRES)).toEqual({ tipo: 'fin' });
  });
});

describe('host y persistencia', () => {
  it('RESET conserva el mensaje personal y el PIN configurado', () => {
    let s = run(resolverHasta(4), { type: 'SET_MSG', text: 'Te quiero' }, { type: 'SET_HOST_PIN' });
    s = run(s, { type: 'RESET' });
    expect(s.sobres[0].st).toBe('LOCKED');
    expect(s.hostMessage).toBe('Te quiero');
    expect(s.hostPinSet).toBe(true);
  });

  it('IMPORT rellena campos ausentes y rechaza basura', () => {
    const exportado = JSON.parse(JSON.stringify(resolverHasta(3)));
    delete exportado.lluvia;
    const s = run(initialState(SOBRES), { type: 'IMPORT', state: exportado });
    expect(s.cifras[0]).toBe('8');
    expect(s.lluvia).toBe(false);
    expect(run(s, { type: 'IMPORT', state: { v: 99 } })).toEqual(initialState(SOBRES));
  });
});
