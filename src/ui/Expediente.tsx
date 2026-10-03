import { pad2, SOBRES } from '../core/content';
import { useGame } from './game';

/** Índice de sobres. Los cerrados no muestran ni lugar ni título. */
export function Expediente() {
  const { state } = useGame();
  return (
    <section class="expediente">
      <h2 class="mono">Expediente</h2>
      <ol class="indice">
        {SOBRES.filter((s) => !s.final).map((def) => {
          const s = state.sobres[def.num];
          if (s.st === 'LOCKED') {
            return (
              <li key={def.num} class="item cerrado">
                <span class="mono n">{pad2(def.num)}</span>
                <span class="t">
                  <span class="mono">Clasificado</span>
                  <small>
                    {def.dia} · {def.hora}
                  </small>
                </span>
              </li>
            );
          }
          return (
            <li key={def.num} class={`item ${s.st === 'SOLVED' ? 'hecho' : 'en-curso'}`}>
              <a href={s.st === 'SOLVED' ? `#/sobre/${def.num}` : '#/'}>
                <span class="mono n">{pad2(def.num)}</span>
                <span class="t">
                  <span dangerouslySetInnerHTML={{ __html: def.titulo }} />
                  <small>
                    {def.lugar} · {s.st === 'SOLVED' ? '✓ resuelto' : 'en curso'}
                  </small>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
