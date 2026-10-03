import { useState } from 'preact/hooks';
import type { Campo, Sobre } from '../core/types';
import type { SobreState } from '../core/state';
import { validar } from '../core/validate';
import { useGame } from './game';

const FALLOS = [
  'Los Guardianes no reconocen esa respuesta. Mirad otra vez.',
  'Mmm… no es eso. Observad con calma.',
  'Todavía no. El lugar guarda la respuesta.',
  'Los Guardianes guardan silencio. Probad de nuevo.',
];

function CampoInput({ sobre, campo, s }: { sobre: Sobre; campo: Campo; s: SobreState }) {
  const { dispatch } = useGame();
  const [texto, setTexto] = useState('');
  const [fallo, setFallo] = useState<string | null>(null);
  const [comprobando, setComprobando] = useState(false);
  const aceptada = s.campos[campo.id];
  const opcional = campo.tipo !== 'obligatorio';
  const inputId = `c-${sobre.num}-${campo.id}`;

  async function comprobar(e: Event) {
    e.preventDefault();
    if (comprobando || !texto.trim()) return;
    setComprobando(true);
    const r = await validar(sobre.num, campo, texto);
    setComprobando(false);
    if (r.ok) {
      setFallo(null);
      navigator.vibrate?.([30, 60, 30]);
      dispatch({ type: 'FIELD_OK', num: sobre.num, campo: campo.id, valor: r.valor, now: Date.now() });
    } else {
      setFallo(FALLOS[Math.floor(Math.random() * FALLOS.length)]);
      navigator.vibrate?.(120);
    }
  }

  return (
    <form class={`campo${opcional ? ' opcional' : ''}${aceptada !== undefined ? ' ok' : ''}`} onSubmit={comprobar}>
      <label for={inputId}>
        {campo.etiqueta}
        {opcional && <span class="chip">{campo.tipo === 'tesoro' ? 'Tesoro opcional' : 'Honor · opcional'}</span>}
      </label>
      {aceptada !== undefined ? (
        <p class="aceptada">
          <span aria-hidden="true">✓</span> {aceptada || 'Aceptada'}
          {opcional && <span class="chip honor">+1 honor</span>}
          {campo.cifra && <span class="chip cifra">Cifra {campo.cifra}</span>}
        </p>
      ) : (
        <div class="fila-input">
          <input
            id={inputId}
            value={texto}
            onInput={(e) => setTexto((e.target as HTMLInputElement).value)}
            autocomplete="off"
            autocapitalize="off"
            spellcheck={false}
            enterKeyHint="done"
          />
          <button type="submit" disabled={comprobando || !texto.trim()}>
            {comprobando ? '…' : 'Comprobar'}
          </button>
        </div>
      )}
      {fallo && <p class="fallo" role="status">{fallo}</p>}
    </form>
  );
}

export function Campos({ sobre, s }: { sobre: Sobre; s: SobreState }) {
  const { dispatch } = useGame();
  if (sobre.accion === 'aceptar') {
    return s.st === 'SOLVED' ? (
      <p class="aceptada centrado">✓ Misión aceptada</p>
    ) : (
      <button class="btn-principal" onClick={() => dispatch({ type: 'ACCEPT', num: sobre.num, now: Date.now() })}>
        Aceptar la misión
      </button>
    );
  }
  if (!sobre.campos.length) return null;
  // Un sobre resuelto solo muestra lo acertado y los opcionales aún sin responder.
  const visibles = s.st === 'SOLVED' ? sobre.campos.filter((c) => c.id in s.campos || c.tipo !== 'obligatorio') : sobre.campos;
  return (
    <section class="respuestas">
      <h3 class="mono">Respuesta</h3>
      {visibles.map((c) => (
        <CampoInput key={c.id} sobre={sobre} campo={c} s={s} />
      ))}
      {s.host && <p class="nota-host">{s.host === 'saltado' ? 'Sobre saltado por el Host.' : 'Resuelto por el Host.'}</p>}
    </section>
  );
}
