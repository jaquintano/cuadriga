import { useEffect, useState } from 'preact/hooks';
import { SOBRES } from '../core/content';
import { fase } from '../core/selectors';
import { useGame } from './game';
import { go } from './router';
import { SobreCerrado } from './SobreCerrado';
import { SobreView } from './SobreView';

/**
 * Pantalla principal. Muestra el sobre en juego; al resolverlo, se queda en él
 * (con «Siguiente sobre →») para que la jugadora vea el sello RESUELTO antes de avanzar.
 */
export function SobreActual() {
  const { state } = useGame();
  const f = fase(state, SOBRES);
  const enJuego = f.tipo === 'sobre' ? f.num : null;
  const [mostrando, setMostrando] = useState<number | null>(enJuego);

  // Si no hay nada fijado (primer render o tras «Siguiente»), seguir al sobre en juego.
  useEffect(() => {
    if (mostrando === null && enJuego !== null) setMostrando(enJuego);
  }, [mostrando, enJuego]);

  const num = mostrando ?? enJuego;
  if (num === null) {
    return (
      <section class="aviso-cofre">
        <h2 class="mono">{f.tipo === 'fin' ? 'Misión cumplida' : 'Las cuatro cifras'}</h2>
        <p>{f.tipo === 'fin' ? 'El cofre está abierto.' : 'Habéis resuelto todos los sobres. Pedid al Host el Cofre de la Cuádriga.'}</p>
        <button class="btn-principal" onClick={() => go('/cofre')}>
          {f.tipo === 'fin' ? 'Ver el cofre' : 'Ir al cofre'}
        </button>
      </section>
    );
  }

  const def = SOBRES[num];
  const s = state.sobres[num];
  if (s.st === 'LOCKED') return <SobreCerrado key={num} sobre={def} />;

  const siguiente = () => {
    setMostrando(null);
    if (enJuego === null) go('/cofre');
    window.scrollTo(0, 0);
  };
  return <SobreView key={num} sobre={def} s={s} onSiguiente={s.st === 'SOLVED' ? siguiente : undefined} />;
}
