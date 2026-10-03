import { useEffect, useState } from 'preact/hooks';
import { finalNum } from '../core/reducer';
import { SOBRES } from '../core/content';
import { useGame } from './game';
import { go } from './router';

const GRUPOS = [
  { titulo: 'Época del fuego', pos: [1] },
  { titulo: 'Potsdam: vencedores y reyes', pos: [2, 3] },
  { titulo: 'Época de la luz', pos: [4] },
];

// Qué casillas ha visto ya la jugadora rellenas (para animar solo las nuevas).
// Es una comodidad visual por dispositivo: si se pierde, solo se repite la animación.
const KEY = 'cuadriga.fragmentosVistos';
function leerVistos(): number[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
function guardarVistos(v: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/** La Tarjeta de Fragmentos. `destacar` fuerza la animación de una casilla (al resolver su sobre). */
export function Tarjeta({ destacar }: { destacar?: number }) {
  const { state } = useGame();
  const [nuevas] = useState(() => {
    const vistos = leerVistos();
    return new Set(
      state.cifras.map((c, i) => (c !== null && (!vistos.includes(i + 1) || destacar === i + 1) ? i + 1 : 0)).filter(Boolean),
    );
  });

  useEffect(() => {
    guardarVistos(state.cifras.map((c, i) => (c !== null ? i + 1 : 0)).filter(Boolean));
  }, [state.cifras]);

  return (
    <div class="tarjeta" role="group" aria-label="Tarjeta de Fragmentos">
      <p class="mono tarjeta-titulo">Tarjeta de Fragmentos</p>
      <div class="grupos">
        {GRUPOS.map((g) => (
          <div class="grupo" key={g.titulo}>
            <div class="casillas">
              {g.pos.map((p) => {
                const c = state.cifras[p - 1];
                return (
                  <div
                    key={p}
                    class={`casilla${c !== null ? ' llena' : ''}${nuevas.has(p) ? ' nueva' : ''}`}
                    aria-label={`Cifra ${p}: ${c ?? 'desconocida'}`}
                  >
                    <span class="cara">{c ?? '?'}</span>
                  </div>
                );
              })}
            </div>
            <p class="grupo-titulo">{g.titulo}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Fragmentos() {
  const { state } = useGame();
  const fin = finalNum(SOBRES);
  const desbloqueado = state.sobres[fin - 1].st === 'SOLVED';
  const n = state.cifras.filter((c) => c !== null).length;
  return (
    <section class="fragmentos">
      <h2 class="mono">Fragmentos</h2>
      <Tarjeta />
      <p class="centrado">
        {n === 4 ? 'Las cuatro cifras están reunidas.' : `${n} de 4 cifras recuperadas.`}
      </p>
      {desbloqueado && (
        <button class="btn-principal" onClick={() => go('/cofre')}>
          {state.cofreAbierto ? 'Ver el cofre' : 'Abrir el Cofre de la Cuádriga'}
        </button>
      )}
    </section>
  );
}
