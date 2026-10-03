import { pad2, SOBRES } from '../core/content';
import { finalNum } from '../core/reducer';
import type { SobreState } from '../core/state';
import type { Sobre } from '../core/types';
import { Campos } from './Campos';
import { Comodin } from './Comodin';
import { Rich } from './components/Rich';
import { Tarjeta } from './Fragmentos';

const ETIQUETA_EXTRA: Record<string, string> = {
  reto: 'Reto',
  tesoro: 'Tesoro',
  honor: 'Honor',
  aviso: 'Aviso',
  pista: 'Pista',
  recompensa: 'Recompensa',
  mision: 'Misión',
};

export function SobreView({ sobre, s, onSiguiente }: { sobre: Sobre; s: SobreState; onSiguiente?: () => void }) {
  const resuelto = s.st === 'SOLVED';
  return (
    <article class={`sobre${resuelto ? ' resuelto' : ''}`}>
      <header class="sobre-cab">
        <p class="mono meta">
          Sobre {pad2(sobre.num)} · {sobre.dia} · {sobre.hora}
        </p>
        <p class="mono lugar">{sobre.lugar}</p>
        <h2>
          <Rich html={sobre.titulo} />
        </h2>
        <div class={`sello-clasificado${resuelto ? ' sello-resuelto' : ''}`}>{resuelto ? 'Resuelto' : 'Clasificado'}</div>
      </header>

      <div class="historia">
        {sobre.historia.map((p, i) => (
          <Rich key={i} as="p" html={p} />
        ))}
      </div>

      {sobre.enigma && (
        <section class="bloque enigma">
          <h3 class="mono">Enigma</h3>
          <Rich as="p" html={sobre.enigma} />
        </section>
      )}

      {sobre.extras.length > 0 && (
        <ul class="extras">
          {sobre.extras.map((e, i) => (
            <li key={i} class={`extra extra-${e.tipo}`}>
              {ETIQUETA_EXTRA[e.tipo] && <span class="chip mono">{ETIQUETA_EXTRA[e.tipo]}</span>}
              <Rich html={e.texto} />
            </li>
          ))}
        </ul>
      )}

      {sobre.rumbo && (
        <section class="bloque rumbo">
          <h3 class="mono">Rumbo</h3>
          <Rich as="p" html={sobre.rumbo} />
        </section>
      )}

      <Campos sobre={sobre} s={s} />

      <Comodin sobre={sobre} s={s} />

      {resuelto && sobre.cifra && onSiguiente && (
        <section class="fragmento-recuperado">
          <h3 class="mono centrado">Fragmento recuperado</h3>
          <Tarjeta destacar={sobre.cifra} />
        </section>
      )}

      {resuelto && onSiguiente && (
        <button class="btn-principal" onClick={onSiguiente}>
          {sobre.num === finalNum(SOBRES) - 1 ? 'Ir al Cofre →' : 'Siguiente sobre →'}
        </button>
      )}

      {sobre.mas_info.length > 0 && (
        <details class="mas-info">
          <summary class="mono">Más información · Archivo de los Guardianes</summary>
          {sobre.mas_info.map((p, i) => (
            <Rich key={i} as="p" html={p} />
          ))}
        </details>
      )}
    </article>
  );
}
