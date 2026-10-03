import { describe, expect, it } from 'vitest';
import type { Photo } from '../src/storage/db';
import { nombresUnicos } from '../src/storage/descargas';
import { nombreFoto } from '../src/storage/photos';

const t = new Date(2026, 9, 8, 15, 32).getTime();
const foto = (sobre: number, reto: number, createdAt = t) => ({ id: 'x', sobre, reto, createdAt, blob: new Blob() }) as Photo;

describe('nombres de fotos', () => {
  it('llevan sobre, reto (1-based) y fecha local', () => {
    expect(nombreFoto(foto(5, 0))).toBe('cuadriga-05-reto1-20261008-1532-1.jpg');
  });

  it('no colisionan en el zip si hay varias del mismo minuto', () => {
    const n = nombresUnicos([foto(5, 0), foto(5, 0), foto(5, 1), foto(17, 0)]);
    expect(new Set(n).size).toBe(4);
    expect(n[1]).toBe('cuadriga-05-reto1-20261008-1532-2.jpg');
  });
});
