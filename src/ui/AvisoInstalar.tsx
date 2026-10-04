import { useEffect, useState } from 'preact/hooks';
import { instalar, suscribirInstalacion, type EstadoInstalacion } from '../storage/instalar';

const KEY = 'cuadriga.avisoInstalarCerrado';
function leerCerrado(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Aviso bajo la cabecera mientras la app se usa en el navegador: invita a instalarla
 * para jugar a pantalla completa. Desaparece al instalarla o al abrirla desde el icono.
 */
export function AvisoInstalar() {
  const [e, setE] = useState<EstadoInstalacion>({ instalada: true, puedeInstalar: false });
  const [cerrado, setCerrado] = useState(leerCerrado);
  useEffect(() => suscribirInstalacion(setE), []);

  if (e.instalada || cerrado) return null;

  const cerrar = () => {
    setCerrado(true);
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* sin almacenamiento: se volverá a mostrar al recargar */
    }
  };

  return (
    <div class="aviso-instalar" role="region" aria-label="Instalar la aplicación">
      <p>
        <b>Instalad la app</b> para jugar a pantalla completa, sin la barra del navegador.
        {!e.puedeInstalar && (
          <>
            {' '}
            En Chrome: menú <b>⋮</b> → <b>«Instalar aplicación»</b>.
          </>
        )}
      </p>
      <div class="aviso-instalar-botones">
        {e.puedeInstalar && (
          <button class="instalar" onClick={() => void instalar()}>
            Instalar
          </button>
        )}
        <button class="cerrar" onClick={cerrar} aria-label="Ocultar aviso">
          ✕
        </button>
      </div>
    </div>
  );
}
