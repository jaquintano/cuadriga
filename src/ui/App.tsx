import { useMemo } from 'preact/hooks';
import { SOBRES } from '../core/content';
import type { GameState } from '../core/state';
import { Icono } from './components/Iconos';
import { Logo } from './components/Logo';
import { Agenda } from './Agenda';
import { Cofre } from './Cofre';
import { ContadorComodines } from './Comodin';
import { Expediente } from './Expediente';
import { Fragmentos } from './Fragmentos';
import { Galeria } from './Galeria';
import { Host } from './Host';
import { GameCtx, useGame } from './game';
import { go, useRuta, type Ruta } from './router';
import { SobreActual } from './SobreActual';
import { SobreView } from './SobreView';
import { useLongPress } from './useLongPress';
import { usePersistentReducer } from './usePersistentReducer';

const NAV: { ruta: Ruta['v']; icono: string; href: string; texto: string }[] = [
  { ruta: 'actual', icono: 'sobre', href: '#/', texto: 'Sobre' },
  { ruta: 'expediente', icono: 'expediente', href: '#/expediente', texto: 'Expediente' },
  { ruta: 'fragmentos', icono: 'fragmentos', href: '#/fragmentos', texto: 'Fragmentos' },
  { ruta: 'agenda', icono: 'agenda', href: '#/agenda', texto: 'Agenda' },
  { ruta: 'galeria', icono: 'galeria', href: '#/galeria', texto: 'Fotos' },
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
    case 'agenda':
      return <Agenda />;
    case 'host':
      return <Host />;
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
  // Cada cambio se guarda en IndexedDB al despacharlo (ver usePersistentReducer).
  const [state, dispatch] = usePersistentReducer(initial);
  const ruta = useRuta();

  const game = useMemo(() => ({ state, dispatch }), [state]);
  // Entrada al modo Host: pulsación larga en el logo.
  const longPress = useLongPress(() => go('/host'));

  return (
    <GameCtx.Provider value={game}>
      <header class="cabecera">
        <span class="logo" aria-label="El Secreto de la Cuádriga" {...longPress}>
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
            <Icono nombre={n.icono} />
            <span>{n.texto}</span>
          </a>
        ))}
      </nav>
    </GameCtx.Provider>
  );
}
