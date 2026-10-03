import type { GameState } from './state';
import type { Sobre } from './types';

/** Sobre en juego: el primero no resuelto (sin contar el final), o la fase del cofre. */
export type Fase = { tipo: 'sobre'; num: number } | { tipo: 'cofre' } | { tipo: 'fin' };

export function fase(state: GameState, sobres: readonly Sobre[]): Fase {
  const num = state.sobres.findIndex((s, i) => !sobres[i].final && s.st !== 'SOLVED');
  if (num >= 0) return { tipo: 'sobre', num };
  return state.cofreAbierto ? { tipo: 'fin' } : { tipo: 'cofre' };
}

/** El lugar de un sobre solo se muestra si ya se abrió alguna vez. */
export function lugarVisible(state: GameState, num: number): boolean {
  return state.sobres[num]?.st !== 'LOCKED';
}

export function puntosHonor(state: GameState, sobres: readonly Sobre[]): number {
  let n = 0;
  sobres.forEach((def, i) => {
    for (const c of def.campos) {
      if (c.tipo !== 'obligatorio' && c.id in state.sobres[i].campos) n++;
    }
  });
  return n;
}

export function honorPosibles(sobres: readonly Sobre[]): number {
  return sobres.reduce((n, s) => n + s.campos.filter((c) => c.tipo !== 'obligatorio').length, 0);
}

export function comodinesUsados(state: GameState): number {
  return state.sobres.filter((s) => s.comodin).length;
}
