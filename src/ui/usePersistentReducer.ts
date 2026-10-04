import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { SOBRES } from '../core/content';
import { reduce, type Action } from '../core/reducer';
import type { GameState } from '../core/state';
import { saveState } from '../storage/db';

const guardar = (s: GameState) => saveState(s).catch((e) => console.error('No se pudo guardar el estado', e));

/**
 * useReducer que persiste en IndexedDB DENTRO del dispatch: el estado nuevo se calcula de
 * forma síncrona y la escritura empieza en ese instante, sin esperar al render. Además,
 * al ocultarse la página (cambio de app, cierre de la PWA) se vuelve a volcar el último estado.
 */
export function usePersistentReducer(initial: GameState): [GameState, (a: Action) => void] {
  const [state, setState] = useState(initial);
  const ref = useRef(initial);

  const dispatch = useCallback((a: Action) => {
    const next = reduce(ref.current, a, SOBRES);
    if (next === ref.current) return; // acción no válida en este estado: no-op
    ref.current = next;
    setState(next);
    void guardar(next);
  }, []);

  useEffect(() => {
    const volcar = () => void guardar(ref.current);
    const onVis = () => document.visibilityState === 'hidden' && volcar();
    window.addEventListener('pagehide', volcar);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', volcar);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return [state, dispatch];
}
