import { useCallback, useEffect, useState } from 'preact/hooks';
import { pad2, SOBRES } from '../core/content';
import type { Photo } from '../storage/db';
import { descargar, zipFotos } from '../storage/descargas';
import { todasLasFotos } from '../storage/photos';
import { Miniatura, useFotosCambian, Visor } from './Fotos';

export function Galeria() {
  const [fotos, setFotos] = useState<Photo[] | null>(null);
  const [viendo, setViendo] = useState<Photo | null>(null);
  const [zipeando, setZipeando] = useState(false);

  const cargar = useCallback(() => {
    todasLasFotos().then(setFotos, () => setFotos([]));
  }, []);
  useEffect(cargar, [cargar]);
  useFotosCambian(cargar);

  async function bajarTodo() {
    if (!fotos?.length) return;
    setZipeando(true);
    try {
      descargar(await zipFotos(fotos), 'cuadriga-fotos.zip');
    } finally {
      setZipeando(false);
    }
  }

  if (fotos === null) return <p class="centrado">Cargando…</p>;

  const porSobre = new Map<number, Photo[]>();
  for (const f of fotos) porSobre.set(f.sobre, [...(porSobre.get(f.sobre) ?? []), f]);
  const bytes = fotos.reduce((n, f) => n + f.blob.size, 0);
  const tamano = bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.ceil(bytes / 1e3)} KB`;

  return (
    <section class="galeria">
      <h2 class="mono">Galería del viaje</h2>
      {fotos.length === 0 ? (
        <p>Todavía no hay fotos. Aparecerán aquí cuando completéis los retos fotográficos.</p>
      ) : (
        <>
          <p class="mono meta-galeria">
            {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'} · {tamano}
          </p>
          <button class="btn-principal" onClick={bajarTodo} disabled={zipeando}>
            {zipeando ? 'Preparando el zip…' : 'Descargar todas (zip)'}
          </button>
          {[...porSobre].map(([num, fs]) => (
            <div class="grupo-fotos" key={num}>
              <h3>
                <span class="mono">Sobre {pad2(num)}</span> · <span dangerouslySetInnerHTML={{ __html: SOBRES[num].titulo }} />
              </h3>
              <div class="rejilla">
                {fs.map((f) => (
                  <Miniatura key={f.id} foto={f} onClick={() => setViendo(f)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
      {viendo && <Visor foto={viendo} onCerrar={() => setViendo(null)} />}
    </section>
  );
}
