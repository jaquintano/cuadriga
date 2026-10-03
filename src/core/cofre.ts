import { SECRETS } from './content';
import { derivarClave, descifrar, hashCampo } from './crypto';
import type { Secrets } from './types';

/**
 * Comprueba el código del dial. Si es correcto, deriva la clave (PBKDF2, ~1 s en móvil)
 * y devuelve la carta final descifrada; si no, null. El hash previo evita esperar
 * la derivación con cada intento fallido.
 */
export async function probarCodigo(codigo: string, secrets: Secrets = SECRETS): Promise<string[] | null> {
  if (!/^\d{4}$/.test(codigo)) return null;
  if ((await hashCampo(secrets.salt, 'cofre', codigo)) !== secrets.cofre.hash) return null;
  const clave = await derivarClave(codigo, secrets.salt, 'cofre', secrets.kdf.iter);
  const { historia } = await descifrar<{ historia: string[] }>(clave, secrets.cofre.carta);
  return historia;
}

/** «2 d 11 h 05 min» */
export function formatoDuracion(ms: number): string {
  const min = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return [d && `${d} d`, (d || h) && `${h} h`, `${String(m).padStart(2, '0')} min`].filter(Boolean).join(' ');
}
