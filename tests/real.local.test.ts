/**
 * Test SOLO LOCAL: comprueba las respuestas reales contra el secrets.json real.
 * Necesita scripts/respuestas.toml y .env, que no están en el repo; en CI se omite.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'smol-toml';
import { describe, expect, it } from 'vitest';
import { SECRETS, SOBRES } from '../src/core/content';
import { derivarClave, descifrar, hashCampo } from '../src/core/crypto';
import { validar } from '../src/core/validate';

const TOML = 'scripts/respuestas.toml';
const ENV = '.env';
const hayLocal = existsSync(TOML) && existsSync(ENV);

interface Regla {
  sobre: number;
  id: string;
  modo: string;
  valores: string[];
  cifra?: number;
}

function leerEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const linea of readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const i = linea.indexOf('=');
    if (i > 0 && !linea.startsWith('#')) out[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return out;
}

describe.skipIf(!hayLocal)('respuestas reales (local)', () => {
  const reglas = hayLocal ? (parse(readFileSync(TOML, 'utf8')) as unknown as { campo: Regla[] }).campo : [];

  it('todas las respuestas aceptadas validan en la app', async () => {
    for (const r of reglas.filter((x) => x.modo !== 'libre')) {
      const campo = SOBRES[r.sobre].campos.find((c) => c.id === r.id)!;
      for (const v of r.valores) {
        const res = await validar(r.sobre, campo, v);
        expect(res.ok, `${r.sobre}.${r.id} <- ${v}`).toBe(true);
        if (r.cifra) expect(res.valor).toBe(v);
      }
    }
  });

  it('el código del cofre sale de las cifras y abre la carta', async () => {
    const codigo = reglas
      .filter((r) => r.cifra)
      .sort((a, b) => a.cifra! - b.cifra!)
      .map((r) => r.valores[0])
      .join('');
    expect(await hashCampo(SECRETS.salt, 'cofre', codigo)).toBe(SECRETS.cofre.hash);
    const k = await derivarClave(codigo, SECRETS.salt, 'cofre', SECRETS.kdf.iter);
    const carta = await descifrar<{ historia: string[] }>(k, SECRETS.cofre.carta);
    expect(carta.historia.length).toBeGreaterThan(0);
  });

  it('el PIN de .env descifra el material del Host', async () => {
    const k = await derivarClave(leerEnv().CUADRIGA_PIN, SECRETS.salt, 'host', SECRETS.kdf.iter);
    expect(await descifrar(k, SECRETS.host.check)).toBe('cuadriga');
    const s3 = await descifrar<{ cifra?: string }>(k, SECRETS.host.sobres['3']);
    expect(s3.cifra).toMatch(/^\d$/);
  });
});
