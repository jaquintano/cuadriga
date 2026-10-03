import { SECRETS } from './content';
import { derivarClave, descifrar } from './crypto';

/** Material del Host de un sobre (cifrado en secrets.json con la clave del PIN). */
export interface HostSobre {
  respuesta: string;
  llegar: string;
  notas: string;
  cifra?: string;
}

/**
 * Sesión del Host: la clave derivada del PIN vive SOLO en memoria.
 * Ni el PIN ni la clave se guardan en el móvil; al salir del modo Host se borra.
 */
let clave: CryptoKey | null = null;
const cache = new Map<number, HostSobre>();

/** Deriva la clave del PIN (PBKDF2, ~1 s) y la verifica descifrando el bloque de control. */
export async function desbloquear(pin: string): Promise<boolean> {
  if (!/^\d{4,8}$/.test(pin)) return false;
  try {
    const k = await derivarClave(pin, SECRETS.salt, 'host', SECRETS.kdf.iter);
    if ((await descifrar<string>(k, SECRETS.host.check)) !== 'cuadriga') return false;
    clave = k;
    return true;
  } catch {
    return false; // etiqueta GCM inválida → PIN incorrecto
  }
}

export function bloquear(): void {
  clave = null;
  cache.clear();
}

export const hostDesbloqueado = () => clave !== null;

export async function materialHost(num: number): Promise<HostSobre> {
  if (!clave) throw new Error('Modo Host bloqueado');
  const hit = cache.get(num);
  if (hit) return hit;
  const m = await descifrar<HostSobre>(clave, SECRETS.host.sobres[String(num)]);
  cache.set(num, m);
  return m;
}
