import type { GameState } from '../core/state';

/**
 * Copia de seguridad del estado en JSON. No incluye las fotos (pesan mucho):
 * se guardan aparte con «Descargar todas (zip)» en la galería.
 */
export interface Backup {
  app: 'cuadriga';
  exportadoEn: string;
  state: GameState;
}

export function crearBackup(state: GameState, now = new Date()): Backup {
  return { app: 'cuadriga', exportadoEn: now.toISOString(), state };
}

export function nombreBackup(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `cuadriga-estado-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.json`;
}

/** Valida y extrae el estado de un backup. Lanza un Error con un mensaje legible. */
export function leerBackup(texto: string): unknown {
  let data: unknown;
  try {
    data = JSON.parse(texto);
  } catch {
    throw new Error('El fichero no es un JSON válido.');
  }
  const b = data as Partial<Backup>;
  if (b?.app !== 'cuadriga' || !b.state || (b.state as GameState).v !== 1) {
    throw new Error('El fichero no es una copia de «El Secreto de la Cuádriga».');
  }
  return b.state;
}
