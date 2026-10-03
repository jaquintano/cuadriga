import type { Sobre } from './types';

/**
 * Máquina de estados de cada sobre:
 *
 *   LOCKED ──OPEN──▶ OPEN ──(todos los obligatorios OK | ACCEPT | HOST_SOLVE)──▶ SOLVED
 *
 * OPEN solo es válido si el sobre anterior está SOLVED. El sobre final (23) no se abre
 * con OPEN: pasa a SOLVED al abrir el cofre.
 */
export type SobreStatus = 'LOCKED' | 'OPEN' | 'SOLVED';

export interface SobreState {
  st: SobreStatus;
  openedAt?: number;
  solvedAt?: number;
  /** Respuestas aceptadas por campo (normalizadas). Incluye honor/tesoros acertados. */
  campos: Record<string, string>;
  /** Se gastó un comodín en este sobre. */
  comodin?: boolean;
  /** El Host lo saltó o lo marcó resuelto. */
  host?: 'resuelto' | 'saltado';
}

export interface GameState {
  v: 1;
  startedAt?: number;
  finishedAt?: number;
  /** Indexado por número de sobre (0-23). */
  sobres: SobreState[];
  /** Tarjeta de Fragmentos: 4 casillas. */
  cifras: (string | null)[];
  comodinesLeft: number;
  cofreAbierto: boolean;
  /** Carta final descifrada al abrir el cofre (así no hay que volver a pedir el código). */
  carta?: string[];
  lluvia: boolean;
  hostMessage: string;
  hostPinSet: boolean;
}

export const COMODINES = 3;

export function initialState(sobres: readonly Sobre[]): GameState {
  return {
    v: 1,
    sobres: sobres.map(() => ({ st: 'LOCKED', campos: {} })),
    cifras: [null, null, null, null],
    comodinesLeft: COMODINES,
    cofreAbierto: false,
    lluvia: false,
    hostMessage: '',
    hostPinSet: false,
  };
}

/** Rellena con valores por defecto un estado guardado (o importado) que pueda venir incompleto. */
export function hydrate(raw: unknown, sobres: readonly Sobre[]): GameState {
  const base = initialState(sobres);
  if (!raw || typeof raw !== 'object' || (raw as GameState).v !== 1) return base;
  const r = raw as Partial<GameState>;
  return {
    ...base,
    ...r,
    v: 1,
    sobres: base.sobres.map((def, i) => ({ ...def, ...(r.sobres?.[i] ?? {}), campos: { ...(r.sobres?.[i]?.campos ?? {}) } })),
    cifras: base.cifras.map((_, i) => r.cifras?.[i] ?? null),
  };
}
