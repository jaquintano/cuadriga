/**
 * Instalación de la PWA. Chrome (Android) lanza `beforeinstallprompt` cuando la app cumple
 * los requisitos; guardamos el evento para mostrar nuestro propio botón «Instalar».
 * Hay que escucharlo pronto (antes del render), por eso se inicializa desde main.tsx.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface EstadoInstalacion {
  /** Ya se está ejecutando como app instalada (sin barra del navegador). */
  instalada: boolean;
  /** Chrome nos ha dado el aviso: podemos abrir su diálogo con un botón. */
  puedeInstalar: boolean;
}

let aviso: BeforeInstallPromptEvent | null = null;
const estado: EstadoInstalacion = { instalada: false, puedeInstalar: false };
const subs = new Set<(e: EstadoInstalacion) => void>();
const emitir = () => subs.forEach((fn) => fn({ ...estado }));

export function esStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function iniciarInstalacion() {
  estado.instalada = esStandalone();
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // sin la mini-barra de Chrome: usamos nuestro botón
    aviso = e as BeforeInstallPromptEvent;
    estado.puedeInstalar = true;
    emitir();
  });
  window.addEventListener('appinstalled', () => {
    aviso = null;
    estado.instalada = true;
    estado.puedeInstalar = false;
    emitir();
  });
}

export function suscribirInstalacion(fn: (e: EstadoInstalacion) => void): () => void {
  subs.add(fn);
  fn({ ...estado });
  return () => subs.delete(fn);
}

/** Abre el diálogo de instalación de Chrome. Devuelve true si la jugadora aceptó. */
export async function instalar(): Promise<boolean> {
  if (!aviso) return false;
  const e = aviso;
  aviso = null; // el evento solo se puede usar una vez
  estado.puedeInstalar = false;
  emitir();
  await e.prompt();
  return (await e.userChoice).outcome === 'accepted';
}
