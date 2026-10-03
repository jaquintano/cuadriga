import type { Sobre } from '../core/types';

export type GeoCheck = { ok: true } | { ok: false; motivo: string };

/**
 * Hook para un futuro desbloqueo por geolocalización (NO implementado).
 * La idea: añadir lat/lon/radio a cada sobre en contenido.py y comprobar aquí
 * navigator.geolocation antes de permitir romper el sello. Hoy siempre permite.
 */
export async function puedeAbrir(_sobre: Sobre): Promise<GeoCheck> {
  return { ok: true };
}
