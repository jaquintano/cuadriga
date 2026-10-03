import { useEffect, useMemo, useReducer } from 'preact/hooks';
import { SOBRES } from '../core/content';
import { reduce, type Action } from '../core/reducer';
import type { GameState } from '../core/state';
import { saveState } from '../storage/db';
import { Logo } from './components/Logo';
import { Cofre } from './Cofre';
import { ContadorComodines } from './Comodin';
import { Expediente } from './Expediente';
import { Fragmentos } from './Fragmentos';
import { Galeria } from './Galeria';
import { GameCtx, useGame } from './game';
import { useRuta, type Ruta } from './router';
import { SobreActual } from './SobreActual';
import { SobreView } from './SobreView';

const reducer = (s: GameState, a: Action) => reduce(s, a, SOBRES);

const NAV: { ruta: Ruta['v']; href: string; texto: string }[] = [
  { ruta: 'actual', href: '#/', texto: 'Sobre' },
  { ruta: 'expediente', href: '#/expediente', texto: 'Expediente' },
  { ruta: 'fragmentos', href: '#/fragmentos', texto: 'Fragmentos' },
  { ruta: 'galeria', href: '#/galeria', texto: 'Fotos' },
];

function Pantalla({ ruta }: { ruta: Ruta }) {
  switch (ruta.v) {
    case 'expediente':
      return <Expediente />;
    case 'sobre':
      return <SobreLectura num={ruta.num} />;
    case 'fragmentos':
      return <Fragmentos />;
    case 'cofre':
      return <Cofre />;
    case 'galeria':
      return <Galeria />;
    default:
      return <SobreActual />;
  }
}

/** Relectura de un sobre ya abierto desde el Expediente. */
function SobreLectura({ num }: { num: number }) {
  const { state } = useGame();
  const def = SOBRES[num];
  const s = state.sobres[num];
  if (!def || def.final || s.st === 'LOCKED') return <Expediente />;
  return <SobreView sobre={def} s={s} />;
}

export function App({ initial }: { initial: GameState }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const ruta = useRuta();

  // Persistir cada cambio. IndexedDB es transaccional: un cierre brusco deja el último estado completo.
  useEffect(() => {
    saveState(state).catch((e) => console.error('No se pudo guardar el estado', e));
  }, [state]);

  const game = useMemo(() => ({ state, dispatch }), [state]);

  return (
    <GameCtx.Provider value={game}>
      <header class="cabecera">
        <span class="logo" aria-label="El Secreto de la Cuádriga">
          <Logo size={34} />
        </span>
        <span class="mono titulo-app">El Secreto de la Cuádriga</span>
        <ContadorComodines />
      </header>
      <main class="contenido">
        <Pantalla ruta={ruta} />
      </main>
      <nav class="nav">
        {NAV.map((n) => (
          <a key={n.ruta} href={n.href} class={ruta.v === n.ruta || (n.ruta === 'expediente' && ruta.v === 'sobre') || (n.ruta === 'fragmentos' && ruta.v === 'cofre') ? 'activo' : ''}>
            {n.texto}
          </a>
        ))}
      </nav>
    </GameCtx.Provider>
  );
}
