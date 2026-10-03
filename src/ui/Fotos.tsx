import { useEffect, useState } from 'preact/hooks';
import type { Photo } from '../storage/db';
import { compartir, descargar } from '../storage/descargas';
import { borrarFoto, fotosDe, guardarFoto, nombreFoto } from '../storage/photos';

// Aviso entre componentes cuando cambian las fotos (guardar/borrar).
const EVENTO = 'cuadriga:fotos';
export const avisarFotos = () => window.dispatchEvent(new Event(EVENTO));
export function useFotosCambian(fn: () => void) {
  useEffect(() => {
    window.addEventListener(EVENTO, fn);
    return () => window.removeEventListener(EVENTO, fn);
  }, [fn]);
}

/** URL temporal para mostrar un Blob; se libera al desmontar. */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

export function Miniatura({ foto, onClick }: { foto: Photo; onClick: () => void }) {
  const url = useObjectUrl(foto.blob);
  return (
    <button class="miniatura" onClick={onClick} aria-label="Ver foto">
      {url && <img src={url} alt="" loading="lazy" decoding="async" />}
    </button>
  );
}

export function Visor({ foto, onCerrar }: { foto: Photo; onCerrar: () => void }) {
  const url = useObjectUrl(foto.blob);
  const [borrando, setBorrando] = useState(false);
  const nombre = nombreFoto(foto);
  const puedeCompartir = typeof navigator.canShare === 'function';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCerrar]);

  return (
    <div class="visor" role="dialog" aria-modal="true" aria-label="Foto">
      {url && <img src={url} alt="" />}
      <div class="visor-botones">
        {borrando ? (
          <>
            <button
              class="peligro"
              onClick={async () => {
                await borrarFoto(foto.id);
                avisarFotos();
                onCerrar();
              }}
            >
              Sí, borrar
            </button>
            <button onClick={() => setBorrando(false)}>No</button>
          </>
        ) : (
          <>
            {puedeCompartir && <button onClick={() => compartir(foto.blob, nombre)}>Compartir</button>}
            <button onClick={() => descargar(foto.blob, nombre)}>Descargar</button>
            <button onClick={() => setBorrando(true)}>Borrar</button>
            <button onClick={onCerrar}>Cerrar</button>
          </>
        )}
      </div>
    </div>
  );
}

/** Botón de cámara de un reto fotográfico + miniaturas de lo ya hecho. */
export function RetoFoto({ sobre, reto }: { sobre: number; reto: number }) {
  const [fotos, setFotos] = useState<Photo[]>([]);
  const [viendo, setViendo] = useState<Photo | null>(null);
  const [estado, setEstado] = useState<'listo' | 'guardando' | 'error'>('listo');

  const cargar = () => {
    fotosDe(sobre).then((fs) => setFotos(fs.filter((f) => f.reto === reto)), console.error);
  };
  useEffect(cargar, [sobre, reto]);
  useFotosCambian(cargar);

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite repetir con la misma foto
    if (!file) return;
    setEstado('guardando');
    try {
      await guardarFoto(sobre, reto, file);
      navigator.vibrate?.(30);
      setEstado('listo');
      avisarFotos();
    } catch (err) {
      console.error(err);
      setEstado('error');
    }
  }

  const id = `foto-${sobre}-${reto}`;
  return (
    <div class="reto-foto">
      <label for={id} class={`btn-camara${estado === 'guardando' ? ' ocupado' : ''}`}>
        {estado === 'guardando' ? 'Revelando…' : fotos.length ? '📷 Otra foto' : '📷 Hacer la foto'}
      </label>
      <input id={id} type="file" accept="image/*" capture="environment" onChange={onFile} hidden />
      {estado === 'error' && <p class="fallo">No se pudo guardar la foto. Probad otra vez.</p>}
      {fotos.length > 0 && (
        <div class="tira">
          {fotos.map((f) => (
            <Miniatura key={f.id} foto={f} onClick={() => setViendo(f)} />
          ))}
        </div>
      )}
      {viendo && <Visor foto={viendo} onCerrar={() => setViendo(null)} />}
    </div>
  );
}
