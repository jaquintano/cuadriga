import { useEffect, useState } from 'preact/hooks';
import { pad2, SOBRES } from '../core/content';
import { bloquear, desbloquear, hostDesbloqueado, materialHost, type HostSobre } from '../core/host';
import { finalNum } from '../core/reducer';
import { fase } from '../core/selectors';
import { crearBackup, leerBackup, nombreBackup } from '../storage/backup';
import { descargar } from '../storage/descargas';
import { borrarTodasLasFotos } from '../storage/photos';
import { Rich } from './components/Rich';
import { avisarFotos } from './Fotos';
import { useGame } from './game';
import { go } from './router';

function PinHost({ onOk }: { onOk: () => void }) {
  const { state, dispatch } = useGame();
  const [pin, setPin] = useState('');
  const [estado, setEstado] = useState<'listo' | 'comprobando' | 'error'>('listo');

  async function entrar(e: Event) {
    e.preventDefault();
    setEstado('comprobando');
    if (await desbloquear(pin)) {
      if (!state.hostPinSet) dispatch({ type: 'SET_HOST_PIN' });
      onOk();
    } else {
      setEstado('error');
      setPin('');
      navigator.vibrate?.(150);
    }
  }

  return (
    <form class="host-pin" onSubmit={entrar}>
      <h2 class="mono">Modo Host</h2>
      <p>
        {state.hostPinSet
          ? 'Introduce el PIN del Host.'
          : 'Primera vez: introduce el PIN con el que se generó el contenido (CUADRIGA_PIN en .env). Se comprobará y quedará configurado.'}
      </p>
      <input
        type="password"
        inputMode="numeric"
        autocomplete="off"
        pattern="[0-9]*"
        maxLength={8}
        value={pin}
        onInput={(e) => setPin((e.target as HTMLInputElement).value.replace(/\D/g, ''))}
        aria-label="PIN"
        autoFocus
      />
      {estado === 'error' && <p class="fallo">PIN incorrecto.</p>}
      <button class="btn-principal" type="submit" disabled={pin.length < 4 || estado === 'comprobando'}>
        {estado === 'comprobando' ? 'Comprobando…' : 'Entrar'}
      </button>
      <button type="button" class="btn-secundario claro" onClick={() => go('/')}>
        Volver al juego
      </button>
    </form>
  );
}

/** Botón con confirmación en dos pasos para acciones con consecuencias. */
function Confirmar({ texto, pregunta, onSi, peligro }: { texto: string; pregunta: string; onSi: () => void; peligro?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  if (!abierto) {
    return (
      <button class={`btn-secundario${peligro ? ' peligro' : ''}`} onClick={() => setAbierto(true)}>
        {texto}
      </button>
    );
  }
  return (
    <div class="confirmar">
      <p>{pregunta}</p>
      <div class="botones">
        <button
          class={`btn-secundario${peligro ? ' peligro' : ''}`}
          onClick={() => {
            setAbierto(false);
            onSi();
          }}
        >
          Sí
        </button>
        <button class="btn-secundario claro" onClick={() => setAbierto(false)}>
          No
        </button>
      </div>
    </div>
  );
}

function FichaSobre({ num, setNum }: { num: number; setNum: (n: number) => void }) {
  const { state, dispatch } = useGame();
  const [m, setM] = useState<HostSobre | null>(null);
  const def = SOBRES[num];
  const s = state.sobres[num];
  const f = fase(state, SOBRES);
  const enJuego = f.tipo === 'sobre' && f.num === num;

  useEffect(() => {
    setM(null);
    materialHost(num).then(setM, console.error);
  }, [num]);

  const resolver = (skip: boolean) =>
    dispatch({ type: 'HOST_SOLVE', num, skip, cifra: m?.cifra, now: Date.now() });

  const estado = s.st === 'LOCKED' ? (enJuego ? 'cerrado (siguiente)' : 'cerrado') : s.st === 'OPEN' ? 'abierto' : 'resuelto';
  return (
    <section class="host-bloque">
      <div class="host-nav">
        <button aria-label="Sobre anterior" disabled={num === 0} onClick={() => setNum(num - 1)}>
          ◀
        </button>
        <div class="host-nav-titulo">
          <span class="mono">
            Sobre {pad2(num)} · {def.dia} · {def.hora}
          </span>
          <strong dangerouslySetInnerHTML={{ __html: def.titulo }} />
          <small>
            {def.lugar} · <b>{estado}</b>
            {s.host ? ` · ${s.host} por el Host` : ''}
            {s.comodin ? ' · comodín usado' : ''}
          </small>
        </div>
        <button aria-label="Sobre siguiente" disabled={num === SOBRES.length - 1} onClick={() => setNum(num + 1)}>
          ▶
        </button>
      </div>

      {!m ? (
        <p class="mono">Descifrando…</p>
      ) : (
        <dl class="host-datos">
          <dt>Respuesta</dt>
          <dd>
            <Rich html={m.respuesta} />
            {m.cifra && <span class="chip cifra">Cifra {def.cifra} = {m.cifra}</span>}
          </dd>
          <dt>Cómo llegar</dt>
          <dd>
            <Rich html={m.llegar} />
          </dd>
          <dt>Ayuda 1</dt>
          <dd>
            <Rich html={def.ayudas[0]} />
          </dd>
          <dt>Ayuda 2</dt>
          <dd>
            <Rich html={def.ayudas[1]} />
          </dd>
          <dt>Notas</dt>
          <dd>
            <Rich html={m.notas} />
          </dd>
        </dl>
      )}

      {enJuego && m && !def.final && (
        <div class="host-acciones">
          <Confirmar texto="Marcar como resuelto" pregunta={`¿Dar por resuelto el sobre ${pad2(num)}?`} onSi={() => resolver(false)} />
          <Confirmar texto="Saltar este sobre" pregunta={`¿Saltar el sobre ${pad2(num)}? Contará como saltado.`} onSi={() => resolver(true)} />
        </div>
      )}
    </section>
  );
}

function Lluvia() {
  const { state, dispatch } = useGame();
  return (
    <section class="host-bloque">
      <h3 class="mono">Variante de lluvia (viernes)</h3>
      <p>En los sobres 09-14, «corceles de acero» pasa a «carruajes públicos» y «Recuperad los corceles» a «Volved a la parada».</p>
      <label class="interruptor">
        <input type="checkbox" checked={state.lluvia} onChange={(e) => dispatch({ type: 'SET_LLUVIA', on: (e.target as HTMLInputElement).checked })} />
        <span>{state.lluvia ? 'Activada: hoy llueve' : 'Desactivada'}</span>
      </label>
    </section>
  );
}

function Mensaje() {
  const { state, dispatch } = useGame();
  const [texto, setTexto] = useState(state.hostMessage);
  const cambiado = texto !== state.hostMessage;
  return (
    <section class="host-bloque">
      <h3 class="mono">Mensaje personal del cofre</h3>
      <p>Aparece bajo la carta final al abrir el cofre. Deja una línea en blanco para separar párrafos.</p>
      <textarea rows={6} value={texto} onInput={(e) => setTexto((e.target as HTMLTextAreaElement).value)} />
      <button class="btn-secundario" disabled={!cambiado} onClick={() => dispatch({ type: 'SET_MSG', text: texto })}>
        {cambiado ? 'Guardar mensaje' : 'Guardado ✓'}
      </button>
    </section>
  );
}

function Copias() {
  const { state, dispatch } = useGame();
  const [pendiente, setPendiente] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [borrarFotos, setBorrarFotos] = useState(false);

  async function elegir(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      setPendiente(leerBackup(await file.text()));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <section class="host-bloque">
      <h3 class="mono">Copia de seguridad</h3>
      <p>El JSON guarda el progreso, no las fotos (para ellas, «Descargar todas» en Fotos).</p>
      <button
        class="btn-secundario"
        onClick={() => descargar(new Blob([JSON.stringify(crearBackup(state), null, 1)], { type: 'application/json' }), nombreBackup())}
      >
        Exportar estado (JSON)
      </button>
      <label class="btn-secundario como-boton" for="importar">
        Importar estado…
      </label>
      <input id="importar" type="file" accept="application/json,.json" hidden onChange={elegir} />
      {error && <p class="fallo">{error}</p>}
      {pendiente !== null && (
        <div class="confirmar">
          <p>¿Sustituir la partida actual por la del fichero?</p>
          <div class="botones">
            <button
              class="btn-secundario peligro"
              onClick={() => {
                dispatch({ type: 'IMPORT', state: pendiente });
                setPendiente(null);
              }}
            >
              Sí, importar
            </button>
            <button class="btn-secundario claro" onClick={() => setPendiente(null)}>
              No
            </button>
          </div>
        </div>
      )}

      <h3 class="mono peligro-titulo">Reiniciar la partida</h3>
      <p>Vuelve al sobre 00 y repone los comodines. Se conservan el mensaje personal y el PIN.</p>
      <label class="interruptor">
        <input type="checkbox" checked={borrarFotos} onChange={(e) => setBorrarFotos((e.target as HTMLInputElement).checked)} />
        <span>Borrar también las fotos</span>
      </label>
      <Confirmar
        peligro
        texto="Reiniciar partida"
        pregunta={borrarFotos ? '¿Reiniciar y BORRAR TODAS LAS FOTOS? No se puede deshacer.' : '¿Reiniciar la partida? Las fotos se conservan.'}
        onSi={async () => {
          if (borrarFotos) {
            await borrarTodasLasFotos();
            avisarFotos();
          }
          try {
            localStorage.removeItem('cuadriga.fragmentosVistos');
          } catch {
            /* nada */
          }
          dispatch({ type: 'RESET' });
          go('/');
        }}
      />
    </section>
  );
}

function PanelHost() {
  const { state } = useGame();
  const f = fase(state, SOBRES);
  const [num, setNum] = useState(f.tipo === 'sobre' ? f.num : finalNum(SOBRES) - 1);
  const cifras = state.cifras.map((c) => c ?? '?').join(' ');
  return (
    <div class="host">
      <div class="host-cab">
        <h2 class="mono">Modo Host</h2>
        <button
          class="btn-secundario claro"
          onClick={() => {
            bloquear();
            go('/');
          }}
        >
          Salir
        </button>
      </div>
      <p class="mono host-estado">
        En juego: {f.tipo === 'sobre' ? `sobre ${pad2(f.num)}` : f.tipo === 'cofre' ? 'el cofre' : 'terminado'} · comodines {state.comodinesLeft} · cifras {cifras}
      </p>
      {f.tipo === 'sobre' && f.num !== num && (
        <button class="btn-secundario" onClick={() => setNum(f.num)}>
          Ir al sobre en juego ({pad2(f.num)})
        </button>
      )}
      <FichaSobre num={num} setNum={setNum} />
      <Lluvia />
      <Mensaje />
      <Copias />
    </div>
  );
}

export function Host() {
  const [ok, setOk] = useState(hostDesbloqueado());
  // Al salir de la pantalla, la clave se olvida: hay que volver a meter el PIN.
  useEffect(() => () => bloquear(), []);
  return ok ? <PanelHost /> : <PinHost onOk={() => setOk(true)} />;
}
