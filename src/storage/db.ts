import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { hydrate, type GameState } from '../core/state';
import type { Sobre } from '../core/types';

export interface Photo {
  id: string;
  sobre: number;
  /** Índice del extra (reto) dentro del sobre. */
  reto: number;
  blob: Blob;
  createdAt: number;
}

interface CuadrigaDB extends DBSchema {
  kv: { key: string; value: unknown };
  photos: { key: string; value: Photo; indexes: { sobre: number } };
}

let dbp: Promise<IDBPDatabase<CuadrigaDB>> | null = null;

export function db(): Promise<IDBPDatabase<CuadrigaDB>> {
  dbp ??= openDB<CuadrigaDB>('cuadriga', 1, {
    upgrade(d) {
      d.createObjectStore('kv');
      d.createObjectStore('photos', { keyPath: 'id' }).createIndex('sobre', 'sobre');
    },
  });
  return dbp;
}

export async function loadState(sobres: readonly Sobre[]): Promise<GameState> {
  return hydrate(await (await db()).get('kv', 'state'), sobres);
}

export async function saveState(state: GameState): Promise<void> {
  await (await db()).put('kv', state, 'state');
}

/** Pide almacenamiento persistente: el navegador no lo borrará por falta de espacio. */
export async function pedirPersistencia(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function contarFotos(): Promise<number> {
  return (await db()).count('photos');
}
