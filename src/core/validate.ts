import { SECRETS } from './content';
import { hashCampo } from './crypto';
import { normalize } from './normalize';
import type { Campo, Secrets } from './types';

export interface Resultado {
  ok: boolean;
  /** Lo que escribió la jugadora (para mostrarlo). En un campo de cifra, la cifra. */
  valor: string;
}

const MAX_INPUT = 200;
const MIN_PREFIJO = 3;

/** Clave del campo en secrets.hashes: «03.a». */
export const claveCampo = (num: number, id: string) => `${String(num).padStart(2, '0')}.${id}`;

/**
 * Candidatos del modo exact: la entrada completa y, si contiene UN solo número,
 * ese número («28 años» → 28). Con varios números no se extrae ninguno.
 */
export function candidatosExact(norm: string): string[] {
  const nums = norm.split(' ').filter((t) => /^\d+$/.test(t));
  return nums.length === 1 && nums[0] !== norm ? [norm, nums[0]] : [norm];
}

/**
 * Candidatos del modo keywords: todos los prefijos (≥3 caracteres) de cada palabra
 * y de cada bigrama. Así «Georgbräu» casa con «georg» y «patatas» con «patata»,
 * sin que la app conozca las palabras clave (solo sus hashes).
 */
export function candidatosKeywords(norm: string): string[] {
  const toks = norm.split(' ').filter(Boolean);
  const unidades = [...toks, ...toks.slice(1).map((t, i) => `${toks[i]} ${t}`)];
  const out = new Set<string>();
  for (const u of unidades) {
    for (let n = MIN_PREFIJO; n <= u.length; n++) {
      const p = u.slice(0, n);
      if (!p.endsWith(' ')) out.add(p);
    }
  }
  return [...out];
}

export async function validarCon(secrets: Secrets, num: number, campo: Campo, input: string): Promise<Resultado> {
  const original = input.trim().slice(0, MAX_INPUT);
  const norm = normalize(original);
  if (!norm) return { ok: false, valor: '' };
  if (campo.modo === 'libre') return { ok: true, valor: original };

  const clave = claveCampo(num, campo.id);
  const aceptados = new Set(secrets.hashes[clave] ?? []);
  const candidatos = campo.modo === 'exact' ? candidatosExact(norm) : candidatosKeywords(norm);
  const hashes = await Promise.all(candidatos.map((c) => hashCampo(secrets.salt, clave, c)));
  const i = hashes.findIndex((h) => aceptados.has(h));
  if (i < 0) return { ok: false, valor: original };
  // En una cifra guardamos el número acertado; en el resto, lo que escribió la jugadora.
  return { ok: true, valor: campo.cifra ? candidatos[i] : original };
}

export function validar(num: number, campo: Campo, input: string): Promise<Resultado> {
  return validarCon(SECRETS, num, campo, input);
}
