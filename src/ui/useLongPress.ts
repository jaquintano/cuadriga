import { useRef } from 'preact/hooks';

/** Pulsación larga (por defecto 800 ms) con ratón o dedo. Se cancela si el dedo se mueve o se levanta. */
export function useLongPress(onLong: () => void, ms = 800) {
  const t = useRef<number | null>(null);
  const cancelar = () => {
    if (t.current !== null) clearTimeout(t.current);
    t.current = null;
  };
  return {
    onPointerDown: () => {
      cancelar();
      t.current = window.setTimeout(() => {
        t.current = null;
        navigator.vibrate?.(60);
        onLong();
      }, ms);
    },
    onPointerUp: cancelar,
    onPointerLeave: cancelar,
    onPointerCancel: cancelar,
    onContextMenu: (e: Event) => e.preventDefault(),
  };
}
