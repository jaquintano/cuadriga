import { normalize } from './normalize';
import type { Campo } from './types';

export interface Resultado {
  ok: boolean;
  /** Valor aceptado (normalizado). Para un campo de cifra, la cifra. */
  valor: string;
}

/**
 * PROVISIONAL (hito 2): acepta cualquier texto no vacío.
 * El hito 3 lo sustituye por la validación con hashes (exact / keywords / libre).
 */
export async function validar(_num: number, _campo: Campo, input: string): Promise<Resultado> {
  const valor = normalize(input);
  return { ok: valor.length > 0, valor };
}
