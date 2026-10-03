import { useState } from 'preact/hooks';
import { pad2 } from '../core/content';
import type { Sobre } from '../core/types';
import { puedeAbrir } from '../geo/unlock';
import { useGame } from './game';

const ANIM_MS = 1100;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function SobreCerrado({ sobre }: { sobre: Sobre }) {
  const { dispatch } = useGame();
  const [abriendo, setAbriendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function abrir() {
    if (abriendo) return;
    const geo = await puedeAbrir(sobre);
    if (!geo.ok) {
      setAviso(geo.motivo);
      return;
    }
    setAbriendo(true);
    navigator.vibrate?.(40);
    setTimeout(() => dispatch({ type: 'OPEN', num: sobre.num, now: Date.now() }), reduceMotion() ? 0 : ANIM_MS);
  }

  return (
    <section class={`sobre-cerrado${abriendo ? ' abriendo' : ''}`} aria-label={`Sobre ${pad2(sobre.num)} cerrado`}>
      <div class="solapa" />
      <div class="sello-clasificado">Clasificado</div>
      <p class="mono etiqueta">Expediente Cuádriga</p>
      <h2 class="mono num-grande">Sobre {pad2(sobre.num)}</h2>
      <dl class="ficha">
        <dt>Día</dt>
        <dd>{sobre.dia}</dd>
        <dt>Hora</dt>
        <dd>{sobre.hora}</dd>
      </dl>
      {/* El lugar no se muestra: lo revela el RUMBO del sobre anterior (anti-spoiler). */}
      <button class="lacre" onClick={abrir} disabled={abriendo} aria-label="Romper el sello y abrir el sobre">
        <span class="mitad izq">GL</span>
        <span class="mitad der">GL</span>
      </button>
      <p class="pista-sello">{abriendo ? 'Rompiendo el sello…' : 'Pulsad el sello para abrir'}</p>
      {aviso && <p class="aviso">{aviso}</p>}
    </section>
  );
}
