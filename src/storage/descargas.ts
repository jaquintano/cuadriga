import { zipSync } from 'fflate';
import type { Photo } from './db';
import { nombreFoto } from './photos';

/** Dispara la descarga de un Blob con un nombre de fichero. */
export function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Nombres únicos para un lote de fotos (numerados por minuto). */
export function nombresUnicos(fotos: Photo[]): string[] {
  const usados = new Map<string, number>();
  return fotos.map((f) => {
    const base = nombreFoto(f, 1);
    const n = (usados.get(base) ?? 0) + 1;
    usados.set(base, n);
    return nombreFoto(f, n);
  });
}

/** Zip sin compresión (los JPEG ya van comprimidos): rápido y sin bloquear mucho el móvil. */
export async function zipFotos(fotos: Photo[]): Promise<Blob> {
  const nombres = nombresUnicos(fotos);
  const entradas: Record<string, Uint8Array> = {};
  for (let i = 0; i < fotos.length; i++) {
    entradas[nombres[i]] = new Uint8Array(await fotos[i].blob.arrayBuffer());
  }
  return new Blob([zipSync(entradas, { level: 0 })], { type: 'application/zip' });
}

/** Compartir con el menú nativo de Android (Google Fotos, WhatsApp…), si está disponible. */
export async function compartir(blob: Blob, nombre: string): Promise<boolean> {
  const file = new File([blob], nombre, { type: blob.type || 'image/jpeg' });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: 'El Secreto de la Cuádriga' });
    return true;
  } catch {
    return false; // el usuario canceló
  }
}
