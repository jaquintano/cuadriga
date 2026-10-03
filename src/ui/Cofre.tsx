import { useEffect, useState } from 'preact/hooks';
import { formatoDuracion, probarCodigo } from '../core/cofre';
import { SOBRES } from '../core/content';
import { finalNum } from '../core/reducer';
import { comodinesUsados, honorPosibles, puntosHonor } from '../core/selectors';
import { COMODINES } from '../core/state';
import { contarFotos } from '../storage/db';
import { Rich } from './components/Rich';
import { Tarjeta } from './Fragmentos';
import { useGame } from './game';

const MIN_ANIM_MS = 2200;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Baul({ abierto }: { abierto: boolean }) {
  return (
    <div class={`baul${abierto ? ' abierto' : ''}`} aria-hidden="true">
      <div class="luz" />
      <div class="tapa">
        <span class="banda" />
      </div>
      <div class="cuerpo">
        <span class="banda" />
        <span class="cerradura" />
      </div>
    </div>
  );
}

function Dial({ onAbrir }: { onAbrir: (codigo: string) => Promise<boolean> }) {
  const [d, setD] = useState([0, 0, 0, 0]);
  const [estado, setEstado] = useState<'listo' | 'probando' | 'error'>('listo');
  const girar = (i: number, delta: number) => {
    setEstado('listo');
    navigator.vibrate?.(8);
    setD((v) => v.map((x, j) => (j === i ? (x + delta + 10) % 10 : x)));
  };
  async function abrir() {
    setEstado('probando');
    const ok = await onAbrir(d.join(''));
    if (!ok) {
      setEstado('error');
      navigator.vibrate?.([80, 40, 80]);
    }
  }
  return (
    <div class={`dial${estado === 'error' ? ' error' : ''}`}>
      <div class="ruedas">
        {d.map((x, i) => (
          <div class="rueda" key={i}>
            <button aria-label={`Subir dígito ${i + 1}`} onClick={() => girar(i, 1)} disabled={estado === 'probando'}>
              ▲
            </button>
            <span class="digito mono" aria-live="polite">
              {x}
            </span>
            <button aria-label={`Bajar dígito ${i + 1}`} onClick={() => girar(i, -1)} disabled={estado === 'probando'}>
              ▼
            </button>
          </div>
        ))}
      </div>
      {estado === 'error' && <p class="fallo centrado">El mecanismo no cede. Revisad la Tarjeta de Fragmentos.</p>}
      <button class="btn-principal" onClick={abrir} disabled={estado === 'probando'}>
        {estado === 'probando' ? 'Girando el mecanismo…' : 'Abrir el cofre'}
      </button>
    </div>
  );
}

function Resumen() {
  const { state } = useGame();
  const [fotos, setFotos] = useState<number | null>(null);
  useEffect(() => {
    contarFotos().then(setFotos, () => setFotos(0));
  }, []);
  const total = state.startedAt && state.finishedAt ? formatoDuracion(state.finishedAt - state.startedAt) : '—';
  return (
    <section class="resumen">
      <h3 class="mono">Informe de la misión</h3>
      <dl class="ficha">
        <dt>Tiempo</dt>
        <dd>{total}</dd>
        <dt>Comodines</dt>
        <dd>
          {comodinesUsados(state)} de {COMODINES}
        </dd>
        <dt>Honor</dt>
        <dd>
          {puntosHonor(state, SOBRES)} de {honorPosibles(SOBRES)} puntos
        </dd>
        <dt>Fotos</dt>
        <dd>
          {fotos ?? '…'} {fotos ? <a href="#/galeria">· ver galería</a> : null}
        </dd>
      </dl>
    </section>
  );
}

function Carta() {
  const { state } = useGame();
  const def = SOBRES[finalNum(SOBRES)];
  return (
    <article class="carta">
      <p class="mono meta">Dentro del cofre</p>
      <h2>
        <Rich html={def.titulo} />
      </h2>
      {(state.carta ?? []).map((p, i) => (
        <Rich key={i} as="p" html={p} />
      ))}
      {state.hostMessage.trim() && (
        <div class="mensaje-personal">
          {state.hostMessage
            .trim()
            .split(/\n{2,}/)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      )}
    </article>
  );
}

export function Cofre() {
  const { state, dispatch } = useGame();
  const [abriendo, setAbriendo] = useState(false);
  const fin = finalNum(SOBRES);
  const desbloqueado = state.sobres[fin - 1].st === 'SOLVED';

  async function abrir(codigo: string): Promise<boolean> {
    const inicio = Date.now();
    const carta = await probarCodigo(codigo).catch(() => null);
    if (!carta) return false;
    setAbriendo(true);
    navigator.vibrate?.([60, 80, 200]);
    await sleep(Math.max(0, MIN_ANIM_MS - (Date.now() - inicio)));
    dispatch({ type: 'OPEN_COFRE', carta, now: Date.now() });
    return true;
  }

  if (state.cofreAbierto) {
    return (
      <section class="cofre">
        <Baul abierto />
        <Carta />
        <Resumen />
      </section>
    );
  }

  return (
    <section class="cofre">
      <h2 class="mono centrado">El Cofre de la Cuádriga</h2>
      <Baul abierto={abriendo} />
      {desbloqueado ? (
        <>
          {!abriendo && <p class="centrado">Introducid la clave de cuatro cifras.</p>}
          {abriendo ? <p class="centrado mono">El cofre se abre…</p> : <Dial onAbrir={abrir} />}
        </>
      ) : (
        <p class="centrado">Sellado. Solo se abrirá cuando la luz vuelva a la Puerta.</p>
      )}
      <Tarjeta />
    </section>
  );
}
