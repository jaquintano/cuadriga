import type { GameState } from './state';
import type { Dia, Hito, Sobre } from './types';

export type ItemAgenda =
  | { tipo: 'sobre'; hora: string; num: number; titulo: string; lugar: string | null; estado: 'cerrado' | 'abierto' | 'resuelto' }
  | { tipo: 'hito'; hora: string; titulo: string; notas: string };

/** «Final» y otras horas no numéricas van al final del día. */
const claveHora = (h: string) => (/^\d{1,2}:\d{2}$/.test(h) ? h.padStart(5, '0') : '99:99');

/**
 * Agenda de un día: sobres + hitos ordenados por hora (a igual hora, el sobre primero).
 * Anti-spoiler: un sobre cerrado muestra número, hora y título, pero no el lugar.
 */
export function agendaDelDia(dia: string, sobres: readonly Sobre[], hitos: readonly Hito[], state: GameState): ItemAgenda[] {
  const items: ItemAgenda[] = [
    ...sobres
      .filter((s) => s.dia === dia && !s.final)
      .map((s): ItemAgenda => {
        const st = state.sobres[s.num].st;
        return {
          tipo: 'sobre',
          hora: s.hora,
          num: s.num,
          titulo: s.titulo,
          lugar: st === 'LOCKED' ? null : s.lugar,
          estado: st === 'LOCKED' ? 'cerrado' : st === 'OPEN' ? 'abierto' : 'resuelto',
        };
      }),
    ...hitos.filter((h) => h.dia === dia).map((h): ItemAgenda => ({ tipo: 'hito', hora: h.hora, titulo: h.titulo, notas: h.notas })),
  ];
  return items.sort((a, b) => claveHora(a.hora).localeCompare(claveHora(b.hora)) || (a.tipo === 'sobre' ? -1 : 1));
}

/** Fecha local en ISO (YYYY-MM-DD). */
export function hoyISO(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Día que se muestra por defecto: hoy si estamos en el viaje; si no, el primero o el último. */
export function diaPorDefecto(dias: readonly Dia[], hoy: string): string {
  const exacto = dias.find((d) => d.fecha === hoy);
  if (exacto) return exacto.id;
  return hoy > dias[dias.length - 1].fecha ? dias[dias.length - 1].id : dias[0].id;
}

/** Índice del siguiente elemento (el primero con hora ≥ ahora), para resaltarlo hoy. */
export function indiceSiguiente(items: ItemAgenda[], horaActual: string): number {
  return items.findIndex((i) => claveHora(i.hora) >= horaActual);
}
