import { useState } from 'preact/hooks';
import { ayudaUtil, tieneAyudas } from '../core/selectors';
import { COMODINES, type SobreState } from '../core/state';
import type { Sobre } from '../core/types';
import { Rich } from './components/Rich';
import { useGame } from './game';

/** Contador de la cabecera: una ficha por comodín, rellena si queda. */
export function ContadorComodines() {
  const { state } = useGame();
  const n = state.comodinesLeft;
  return (
    <span class="contador-comodines" aria-label={`Quedan ${n} de ${COMODINES} comodines`} title="Comodines">
      {Array.from({ length: COMODINES }, (_, i) => (
        <span key={i} class={`ficha${i < n ? ' viva' : ''}`} aria-hidden="true" />
      ))}
    </span>
  );
}

/**
 * Bloque de comodín de un sobre:
 *  - sin gastar: botón con confirmación (dos pulsaciones) si quedan;
 *  - gastado: muestra la ayuda 1 y deja ver la 2 sin gastar otro.
 */
export function Comodin({ sobre, s }: { sobre: Sobre; s: SobreState }) {
  const { state, dispatch } = useGame();
  const [confirmando, setConfirmando] = useState(false);
  const [verSegunda, setVerSegunda] = useState(false);
  if (!tieneAyudas(sobre)) return null;

  if (s.comodin) {
    const segunda = ayudaUtil(sobre.ayudas[1]) ? sobre.ayudas[1] : null;
    return (
      <section class="comodin usado">
        <h3 class="mono">Comodín</h3>
        <Rich as="p" html={sobre.ayudas[0]} />
        {segunda &&
          (verSegunda ? (
            <Rich as="p" class="segunda" html={segunda} />
          ) : (
            <button class="btn-secundario" onClick={() => setVerSegunda(true)}>
              Ver la segunda ayuda
            </button>
          ))}
      </section>
    );
  }

  // Solo se puede gastar con el sobre abierto y sin resolver.
  if (s.st !== 'OPEN') return null;
  const quedan = state.comodinesLeft;
  if (quedan <= 0) {
    return <p class="comodin agotado mono">Sin comodines. Los Guardianes confían en vuestro ingenio.</p>;
  }

  return (
    <section class="comodin">
      {confirmando ? (
        <div class="confirmar">
          <p>
            ¿Gastar un comodín? Os quedarán <b>{quedan - 1}</b> para el resto del viaje.
          </p>
          <div class="botones">
            <button
              class="btn-secundario"
              onClick={() => {
                navigator.vibrate?.(30);
                dispatch({ type: 'USE_COMODIN', num: sobre.num });
                setConfirmando(false);
              }}
            >
              Sí, usar
            </button>
            <button class="btn-secundario claro" onClick={() => setConfirmando(false)}>
              No
            </button>
          </div>
        </div>
      ) : (
        <button class="btn-secundario" onClick={() => setConfirmando(true)}>
          Usar comodín · quedan {quedan}
        </button>
      )}
    </section>
  );
}
