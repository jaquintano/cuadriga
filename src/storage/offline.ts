import { registerSW } from 'virtual:pwa-register';

/** Estado offline observable (para el modo Host y el aviso «listo sin conexión»). */
export interface EstadoOffline {
  /** El service worker ha precacheado la app: funciona sin red. */
  listo: boolean;
  /** El navegador garantiza no borrar IndexedDB por falta de espacio. */
  persistente: boolean | null;
}

const estado: EstadoOffline = { listo: false, persistente: null };
const subs = new Set<(e: EstadoOffline) => void>();
const emitir = () => subs.forEach((fn) => fn({ ...estado }));

export function suscribirOffline(fn: (e: EstadoOffline) => void): () => void {
  subs.add(fn);
  fn({ ...estado });
  return () => subs.delete(fn);
}

export function marcarPersistencia(p: boolean) {
  estado.persistente = p;
  emitir();
}

export function registrarSW() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onOfflineReady() {
      estado.listo = true;
      emitir();
    },
    onRegisteredSW(_url, reg) {
      // Si ya había un SW activo de una visita anterior, la app ya está en caché.
      if (reg?.active) {
        estado.listo = true;
        emitir();
      }
    },
  });
}
