import { useEffect, useState } from 'preact/hooks';

// Rutas por hash: funcionan en GitHub Pages sin configurar el servidor y
// el botón «atrás» de Android navega entre pantallas en vez de cerrar la app.
export type Ruta =
  | { v: 'actual' }
  | { v: 'expediente' }
  | { v: 'sobre'; num: number }
  | { v: 'fragmentos' }
  | { v: 'cofre' }
  | { v: 'agenda' }
  | { v: 'galeria' }
  | { v: 'host' };

export function parse(hash: string): Ruta {
  const [, a, b] = hash.replace(/^#/, '').split('/');
  switch (a) {
    case 'expediente':
      return { v: 'expediente' };
    case 'sobre': {
      const num = Number(b);
      return Number.isInteger(num) ? { v: 'sobre', num } : { v: 'expediente' };
    }
    case 'fragmentos':
    case 'cofre':
    case 'agenda':
    case 'galeria':
    case 'host':
      return { v: a };
    default:
      return { v: 'actual' };
  }
}

export function useRuta(): Ruta {
  const [ruta, setRuta] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      setRuta(parse(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return ruta;
}

export const go = (path: string) => {
  location.hash = path;
};
