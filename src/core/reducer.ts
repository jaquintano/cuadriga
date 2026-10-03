import { hydrate, initialState, type GameState, type SobreState } from './state';
import type { Sobre } from './types';

/**
 * Reducer puro de la partida. Sin efectos: el tiempo llega en la acción (`now`)
 * y la validación (asíncrona, con Web Crypto) se hace fuera; aquí solo llegan resultados.
 * Una acción inválida en el estado actual devuelve el mismo objeto (no-op).
 */
export type Action =
  | { type: 'OPEN'; num: number; now: number }
  | { type: 'ACCEPT'; num: number; now: number }
  | { type: 'FIELD_OK'; num: number; campo: string; valor: string; now: number }
  | { type: 'USE_COMODIN'; num: number }
  | { type: 'OPEN_COFRE'; carta: string[]; now: number }
  | { type: 'HOST_SOLVE'; num: number; skip: boolean; cifra?: string; now: number }
  | { type: 'SET_LLUVIA'; on: boolean }
  | { type: 'SET_MSG'; text: string }
  | { type: 'SET_HOST_PIN' }
  | { type: 'RESET' }
  | { type: 'IMPORT'; state: unknown };

export function finalNum(sobres: readonly Sobre[]): number {
  return sobres.findIndex((s) => s.final);
}

function patchSobre(state: GameState, num: number, patch: Partial<SobreState>): GameState {
  const sobres = state.sobres.slice();
  sobres[num] = { ...sobres[num], ...patch };
  return { ...state, sobres };
}

function allRequiredDone(def: Sobre, campos: Record<string, string>): boolean {
  return def.campos.filter((c) => c.tipo === 'obligatorio').every((c) => c.id in campos);
}

export function reduce(state: GameState, action: Action, sobres: readonly Sobre[]): GameState {
  switch (action.type) {
    case 'OPEN': {
      const { num, now } = action;
      const def = sobres[num];
      if (!def || def.final || state.sobres[num].st !== 'LOCKED') return state;
      if (num > 0 && state.sobres[num - 1].st !== 'SOLVED') return state;
      const next = patchSobre(state, num, { st: 'OPEN', openedAt: now });
      return next.startedAt ? next : { ...next, startedAt: now };
    }

    case 'ACCEPT': {
      const { num, now } = action;
      if (sobres[num]?.accion !== 'aceptar' || state.sobres[num].st !== 'OPEN') return state;
      return patchSobre(state, num, { st: 'SOLVED', solvedAt: now });
    }

    case 'FIELD_OK': {
      const { num, campo, valor, now } = action;
      const def = sobres[num];
      const cur = state.sobres[num];
      const c = def?.campos.find((x) => x.id === campo);
      if (!c || cur.st === 'LOCKED' || campo in cur.campos) return state;
      // Un sobre resuelto (p. ej., saltado por el Host) solo admite ya honor/tesoros.
      if (cur.st === 'SOLVED' && c.tipo === 'obligatorio') return state;
      const campos = { ...cur.campos, [campo]: valor };
      let next = patchSobre(state, num, { campos });
      if (c.cifra) {
        const cifras = next.cifras.slice();
        cifras[c.cifra - 1] = valor;
        next = { ...next, cifras };
      }
      if (cur.st === 'OPEN' && allRequiredDone(def, campos)) {
        next = patchSobre(next, num, { st: 'SOLVED', solvedAt: now });
      }
      return next;
    }

    case 'USE_COMODIN': {
      const cur = state.sobres[action.num];
      if (!cur || cur.st !== 'OPEN' || cur.comodin || state.comodinesLeft <= 0) return state;
      return { ...patchSobre(state, action.num, { comodin: true }), comodinesLeft: state.comodinesLeft - 1 };
    }

    case 'OPEN_COFRE': {
      const fin = finalNum(sobres);
      if (state.cofreAbierto || fin < 1 || state.sobres[fin - 1].st !== 'SOLVED') return state;
      const next = patchSobre(state, fin, { st: 'SOLVED', openedAt: action.now, solvedAt: action.now });
      return { ...next, cofreAbierto: true, carta: action.carta, finishedAt: action.now };
    }

    case 'HOST_SOLVE': {
      const { num, skip, cifra, now } = action;
      const def = sobres[num];
      const cur = state.sobres[num];
      if (!def || def.final || cur.st === 'SOLVED') return state;
      // Solo el sobre en juego: el abierto o el siguiente disponible.
      if (cur.st === 'LOCKED' && num > 0 && state.sobres[num - 1].st !== 'SOLVED') return state;
      let next = patchSobre(state, num, {
        st: 'SOLVED',
        openedAt: cur.openedAt ?? now,
        solvedAt: now,
        host: skip ? 'saltado' : 'resuelto',
      });
      if (!next.startedAt) next = { ...next, startedAt: now };
      if (def.cifra && cifra) {
        const cifras = next.cifras.slice();
        cifras[def.cifra - 1] = cifra;
        next = { ...next, cifras };
      }
      return next;
    }

    case 'SET_LLUVIA':
      return { ...state, lluvia: action.on };
    case 'SET_MSG':
      return { ...state, hostMessage: action.text };
    case 'SET_HOST_PIN':
      return { ...state, hostPinSet: true };
    case 'RESET':
      // El mensaje personal y el PIN configurado sobreviven al reinicio.
      return { ...initialState(sobres), hostMessage: state.hostMessage, hostPinSet: state.hostPinSet };
    case 'IMPORT':
      return hydrate(action.state, sobres);
  }
}
