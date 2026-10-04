#!/usr/bin/env node
/**
 * Comprobación anti-spoiler para CI (sin conocer el código del cofre).
 *
 * Extrae del bundle todas las secuencias de 4 dígitos (también «8-3-4-4», «8 3 4 4»…),
 * calcula hash(salt, "cofre", dígitos) y falla si alguna coincide con secrets.cofre.hash.
 * Así el repo público no necesita contener el código para vigilar que no se filtre.
 *
 *   node scripts/ci-check-bundle.mjs [dir]   (por defecto: dist)
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const { salt, cofre } = JSON.parse(readFileSync('src/content/secrets.json', 'utf8'));
const TEXTO = /\.(js|mjs|css|html|json|webmanifest|txt|svg)$/;

function* ficheros(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) yield* ficheros(p);
    else if (TEXTO.test(n)) yield p;
  }
}

// 4 dígitos seguidos, o separados por un carácter no alfanumérico (guion, espacio, punto…).
const PATRON = /(?<!\d)\d(?:[^\p{L}\p{N}]?\d){3}(?!\d)/gu;
const candidatos = new Set();
let n = 0;
for (const f of ficheros(dir)) {
  n++;
  for (const m of readFileSync(f, 'utf8').matchAll(PATRON)) candidatos.add(m[0].replace(/\D/g, ''));
}

const fuga = [...candidatos].find((c) => createHash('sha256').update(`${salt}|cofre|${c}`).digest('hex') === cofre.hash);
if (fuga) {
  console.error(`FALLO: el código del cofre aparece en claro en ${dir}/.`);
  process.exit(1);
}
console.log(`OK: ${n} ficheros, ${candidatos.size} secuencias de 4 dígitos revisadas; el código del cofre no aparece.`);
