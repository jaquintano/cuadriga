import { describe, expect, it } from 'vitest';
import { agendaDelDia, diaPorDefecto, hoyISO, indiceSiguiente } from '../src/core/agenda';
import { CONTENIDO, HITOS, SOBRES } from '../src/core/content';
import { initialState } from '../src/core/state';

const DIAS = CONTENIDO.dias;

describe('agenda', () => {
  it('mezcla sobres e hitos del día ordenados por hora', () => {
    const items = agendaDelDia(DIAS[0].id, SOBRES, HITOS, initialState(SOBRES));
    const horas = items.map((i) => i.hora);
    expect(horas).toEqual([...horas].sort());
    expect(items.some((i) => i.tipo === 'hito')).toBe(true);
    expect(items.some((i) => i.tipo === 'sobre')).toBe(true);
  });

  it('cada día tiene sus hitos y todos los hitos aparecen en algún día', () => {
    const total = DIAS.reduce(
      (n, d) => n + agendaDelDia(d.id, SOBRES, HITOS, initialState(SOBRES)).filter((i) => i.tipo === 'hito').length,
      0,
    );
    expect(total).toBe(HITOS.length);
    for (const d of DIAS) {
      expect(agendaDelDia(d.id, SOBRES, HITOS, initialState(SOBRES)).some((i) => i.tipo === 'hito'), d.id).toBe(true);
    }
  });

  it('oculta el lugar de los sobres cerrados y lo muestra al abrirlos', () => {
    const s0 = initialState(SOBRES);
    const cerrado = agendaDelDia(DIAS[0].id, SOBRES, HITOS, s0).find((i) => i.tipo === 'sobre' && i.num === 1);
    expect(cerrado).toMatchObject({ lugar: null, estado: 'cerrado' });
    const s1 = { ...s0, sobres: s0.sobres.map((x, i) => (i === 1 ? { ...x, st: 'OPEN' as const } : x)) };
    const abierto = agendaDelDia(DIAS[0].id, SOBRES, HITOS, s1).find((i) => i.tipo === 'sobre' && i.num === 1);
    expect(abierto).toMatchObject({ lugar: SOBRES[1].lugar, estado: 'abierto' });
  });

  it('el sobre final no está en la agenda', () => {
    const ultimo = DIAS[DIAS.length - 1].id;
    expect(agendaDelDia(ultimo, SOBRES, HITOS, initialState(SOBRES)).some((i) => i.tipo === 'sobre' && SOBRES[i.num].final)).toBe(false);
  });

  it('día por defecto: hoy en el viaje; antes, el primero; después, el último', () => {
    expect(diaPorDefecto(DIAS, DIAS[1].fecha)).toBe(DIAS[1].id);
    expect(diaPorDefecto(DIAS, '2026-10-03')).toBe(DIAS[0].id);
    expect(diaPorDefecto(DIAS, '2026-12-01')).toBe(DIAS[DIAS.length - 1].id);
    expect(hoyISO(new Date(2026, 9, 8, 23, 59))).toBe('2026-10-08');
  });

  it('el siguiente es el primero con hora ≥ ahora', () => {
    const items = agendaDelDia(DIAS[0].id, SOBRES, HITOS, initialState(SOBRES));
    expect(indiceSiguiente(items, '00:00')).toBe(0);
    expect(indiceSiguiente(items, '23:59')).toBe(-1);
  });
});
