import { useEffect, useState } from 'preact/hooks';
import { agendaDelDia, diaPorDefecto, hoyISO, indiceSiguiente } from '../core/agenda';
import { CONTENIDO, HITOS, pad2, SOBRES } from '../core/content';
import { useGame } from './game';

const horaActual = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export function Agenda() {
  const { state } = useGame();
  const dias = CONTENIDO.dias;
  const [dia, setDia] = useState(() => diaPorDefecto(dias, hoyISO()));
  const [ahora, setAhora] = useState(horaActual);

  // Refresca el resaltado «Ahora» cada minuto.
  useEffect(() => {
    const t = setInterval(() => setAhora(horaActual()), 60_000);
    return () => clearInterval(t);
  }, []);

  const items = agendaDelDia(dia, SOBRES, HITOS, state);
  const esHoy = dias.find((d) => d.id === dia)?.fecha === hoyISO();
  const siguiente = esHoy ? indiceSiguiente(items, ahora) : -1;

  return (
    <section class="agenda">
      <h2 class="mono">Agenda</h2>
      <div class="dias" role="tablist">
        {dias.map((d) => (
          <button key={d.id} role="tab" aria-selected={d.id === dia} class={d.id === dia ? 'activo' : ''} onClick={() => setDia(d.id)}>
            {d.id}
          </button>
        ))}
      </div>
      <ol class="linea">
        {items.map((it, i) => (
          <li key={i} class={`item-agenda es-${it.tipo}${it.tipo === 'sobre' ? ` ${it.estado}` : ''}${i === siguiente ? ' siguiente' : ''}`}>
            <span class="mono hora">{it.hora}</span>
            <div class="cuerpo-item">
              {i === siguiente && <span class="chip ahora">Lo siguiente</span>}
              {it.tipo === 'sobre' ? (
                <>
                  <span class="mono etiqueta-sobre">
                    Sobre {pad2(it.num)}
                    {it.estado === 'resuelto' ? ' · ✓' : it.estado === 'abierto' ? ' · en curso' : ''}
                  </span>
                  <strong dangerouslySetInnerHTML={{ __html: it.titulo }} />
                  {it.lugar && <small>{it.lugar}</small>}
                </>
              ) : (
                <>
                  <strong>{it.titulo}</strong>
                  <small>{it.notas}</small>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
