/**
 * Normalización de respuestas. ESPEJO EXACTO de scripts/normalize.py.
 * Ambas implementaciones se validan con tests/normalize.vectors.json.
 *
 * 1. ß → ss, minúsculas, quitar diacríticos (ä → a, ñ → n).
 * 2. Quitar separadores de miles entre dígitos (3.300 → 3300).
 * 3. Todo lo que no sea [a-z0-9] → espacio; colapsar espacios.
 * 4. Números en letra → cifra («veinticuatro» → 24).
 */

const UNITS: Record<string, number> = {
  cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14,
  quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const TENS: Record<string, number> = {
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60,
  setenta: 70, ochenta: 80, noventa: 90,
};
const HUNDREDS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400,
  quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800,
  novecientos: 900,
};

type Kind = 'U' | 'T' | 'H' | 'M';
type State = 'start' | Kind | 'Y';

const has = (o: Record<string, number>, k: string) => Object.prototype.hasOwnProperty.call(o, k);

function kind(tok: string): Kind | null {
  if (has(UNITS, tok)) return 'U';
  if (has(TENS, tok)) return 'T';
  if (has(HUNDREDS, tok)) return 'H';
  if (tok === 'mil') return 'M';
  return null;
}

function value(tok: string): number {
  return UNITS[tok] ?? TENS[tok] ?? HUNDREDS[tok] ?? 0;
}

// Qué clase de palabra puede seguir a cada estado (gramática numérica).
const NEXT: Record<State, ReadonlySet<string>> = {
  start: new Set(['H', 'T', 'U', 'M']),
  H: new Set(['T', 'U', 'M']),
  T: new Set(['Y', 'M']),
  Y: new Set(['U']),
  U: new Set(['M']),
  M: new Set(['H', 'T', 'U']),
};

const isUnit1to9 = (tok: string | undefined) =>
  tok !== undefined && has(UNITS, tok) && UNITS[tok] >= 1 && UNITS[tok] <= 9;

export function wordsToNumbers(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;
  const n = tokens.length;
  while (i < n) {
    if (kind(tokens[i]) === null) {
      out.push(tokens[i]);
      i++;
      continue;
    }
    let total = 0;
    let cur = 0;
    let state: State = 'start';
    let hasMil = false;
    while (i < n) {
      const tok = tokens[i];
      const k = kind(tok);
      if (tok === 'y' && state === 'T') {
        // «y» solo une decena con unidad 1-9: «treinta y dos».
        if (isUnit1to9(tokens[i + 1])) {
          state = 'Y';
          i++;
          continue;
        }
        break;
      }
      if (k === null || !NEXT[state].has(k)) break;
      if (k === 'M') {
        if (hasMil) break;
        total += (cur || 1) * 1000;
        cur = 0;
        hasMil = true;
      } else {
        if (state === 'Y' && !isUnit1to9(tok)) break;
        cur += value(tok);
      }
      state = k;
      i++;
    }
    out.push(String(total + cur));
  }
  return out;
}

export function normalize(text: string | null | undefined): string {
  if (!text) return '';
  let s = text.replace(/ß|ẞ/g, 'ss').toLowerCase();
  s = s.normalize('NFD').replace(/\p{Mn}/gu, '');
  s = s.replace(/(?<=\d)\.(?=\d)/g, '');
  s = s.replace(/[^a-z0-9]+/g, ' ').trim();
  if (!s) return '';
  return wordsToNumbers(s.split(' ')).join(' ');
}
