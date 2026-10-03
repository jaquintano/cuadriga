/**
 * Primitivas Web Crypto. ESPEJO de scripts/build-content.py:
 *   hash(campo, valor) = hex(SHA-256(`${salt}|${campo}|${valor}`))
 *   clave              = PBKDF2-SHA256(secreto, `${salt}:${propósito}`, iter) → AES-256-GCM
 *   cifrado            = { iv: b64(12 bytes), ct: b64(texto cifrado ‖ tag) }
 */
import type { Cifrado } from './types';

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashCampo(salt: string, campo: string, valor: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(`${salt}|${campo}|${valor}`)));
}

export async function derivarClave(secreto: string, salt: string, proposito: string, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(secreto), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(`${salt}:${proposito}`), iterations: iter },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

/** Descifra y parsea JSON. Lanza si la clave es incorrecta (falla la etiqueta GCM). */
export async function descifrar<T>(clave: CryptoKey, c: Cifrado): Promise<T> {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(c.iv) }, clave, b64(c.ct));
  return JSON.parse(dec.decode(pt)) as T;
}
