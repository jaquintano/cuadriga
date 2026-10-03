import type { Sobre } from './types';

/** Sobres afectados por la variante de lluvia del viernes (bicis → transporte público). */
export const SOBRES_LLUVIA = { desde: 9, hasta: 14 };

/** Sustituciones; ampliables si hace falta (no distinguen mayúsculas y respetan la inicial). */
export const SUSTITUCIONES: [RegExp, string][] = [
  [/corceles de acero/gi, 'carruajes públicos'],
  [/recuperad los corceles/gi, 'volved a la parada'],
];

function conMismaInicial(original: string, nuevo: string): string {
  const mayus = original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase();
  return mayus ? nuevo[0].toUpperCase() + nuevo.slice(1) : nuevo;
}

export function textoLluvia(t: string): string {
  return SUSTITUCIONES.reduce((acc, [re, nuevo]) => acc.replace(re, (m) => conMismaInicial(m, nuevo)), t);
}

/** Devuelve el sobre con los textos de la variante de lluvia, si aplica. */
export function aplicarLluvia(sobre: Sobre, lluvia: boolean): Sobre {
  if (!lluvia || sobre.num < SOBRES_LLUVIA.desde || sobre.num > SOBRES_LLUVIA.hasta) return sobre;
  return {
    ...sobre,
    historia: sobre.historia.map(textoLluvia),
    enigma: sobre.enigma && textoLluvia(sobre.enigma),
    extras: sobre.extras.map((e) => ({ ...e, texto: textoLluvia(e.texto) })),
    rumbo: sobre.rumbo && textoLluvia(sobre.rumbo),
  };
}
