import { db, type Photo } from './db';

export const MAX_LADO = 1600;
export const CALIDAD_JPEG = 0.85;

/**
 * Redimensiona a ≤1600 px por el lado largo y recomprime a JPEG.
 * `imageOrientation: 'from-image'` aplica la rotación EXIF de la cámara.
 * Una foto de 12 MP (~4 MB) queda en ~300-500 KB.
 */
export async function redimensionar(file: Blob, max = MAX_LADO, calidad = CALIDAD_JPEG): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const escala = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * escala);
  const h = Math.round(bmp.height * escala);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error('toBlob falló'))), 'image/jpeg', calidad));
}

export async function guardarFoto(sobre: number, reto: number, original: File): Promise<Photo> {
  let blob: Blob;
  try {
    blob = await redimensionar(original);
  } catch (e) {
    // Si el navegador no sabe decodificarla (p. ej. HEIC), se guarda tal cual si es JPEG.
    if (original.type !== 'image/jpeg') throw e;
    blob = original;
  }
  const foto: Photo = { id: crypto.randomUUID(), sobre, reto, blob, createdAt: Date.now() };
  await (await db()).put('photos', foto);
  return foto;
}

export async function fotosDe(sobre: number): Promise<Photo[]> {
  const fotos = await (await db()).getAllFromIndex('photos', 'sobre', sobre);
  return fotos.sort((a, b) => a.createdAt - b.createdAt);
}

export async function todasLasFotos(): Promise<Photo[]> {
  const fotos = await (await db()).getAll('photos');
  return fotos.sort((a, b) => a.sobre - b.sobre || a.createdAt - b.createdAt);
}

export async function borrarFoto(id: string): Promise<void> {
  await (await db()).delete('photos', id);
}

export async function borrarTodasLasFotos(): Promise<void> {
  await (await db()).clear('photos');
}

/** «cuadriga-05-reto2-20261008-1532-1.jpg» (el sufijo evita colisiones en el zip). */
export function nombreFoto(f: Pick<Photo, 'sobre' | 'reto' | 'createdAt'>, n = 1): string {
  const d = new Date(f.createdAt);
  const p = (x: number) => String(x).padStart(2, '0');
  const fecha = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  return `cuadriga-${p(f.sobre)}-reto${f.reto + 1}-${fecha}-${n}.jpg`;
}
