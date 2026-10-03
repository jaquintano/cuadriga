import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Action } from '../core/reducer';
import type { GameState } from '../core/state';

export interface Game {
  state: GameState;
  dispatch: (a: Action) => void;
}

export const GameCtx = createContext<Game | null>(null);

export function useGame(): Game {
  const g = useContext(GameCtx);
  if (!g) throw new Error('useGame fuera de <GameCtx.Provider>');
  return g;
}
