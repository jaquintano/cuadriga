import contenidoJson from '../content/sobres.json';
import hitosJson from '../content/hitos.json';
import secretsJson from '../content/secrets.json';
import type { Contenido, Hito, Secrets, Sobre } from './types';

export const CONTENIDO = contenidoJson as unknown as Contenido;
export const SOBRES: readonly Sobre[] = CONTENIDO.sobres;
export const HITOS: readonly Hito[] = hitosJson as Hito[];
export const SECRETS = secretsJson as Secrets;

export const pad2 = (n: number) => String(n).padStart(2, '0');
