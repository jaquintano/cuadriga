// Tipos del contenido generado por scripts/build-content.py (src/content/*.json).

export type Modo = 'exact' | 'keywords' | 'libre';
export type TipoCampo = 'obligatorio' | 'honor' | 'tesoro';

export interface Campo {
  id: string;
  tipo: TipoCampo;
  modo: Modo;
  etiqueta: string;
  /** Posición 1-4 en la Tarjeta de Fragmentos; el valor es la propia respuesta. */
  cifra?: number;
}

export interface Extra {
  texto: string;
  tipo: string;
  /** Lleva reto fotográfico. */
  foto: boolean;
}

export interface Sobre {
  num: number;
  dia: string;
  hora: string;
  lugar: string;
  titulo: string;
  historia: string[];
  enigma: string | null;
  extras: Extra[];
  rumbo: string | null;
  mas_info: string[];
  ayudas: [string, string];
  campos: Campo[];
  cifra?: number;
  /** Sobre 23: la carta final, cifrada; se muestra al abrir el cofre. */
  final?: boolean;
  /** Sin enigma: se resuelve con un botón («Aceptar la misión»). */
  accion?: 'aceptar';
}

export interface Dia {
  id: string;
  fecha: string;
}

export interface Contenido {
  v: number;
  dias: Dia[];
  sobres: Sobre[];
}

export interface Hito {
  dia: string;
  hora: string;
  titulo: string;
  notas: string;
}

export interface Cifrado {
  iv: string;
  ct: string;
}

export interface Secrets {
  v: number;
  salt: string;
  kdf: { alg: string; iter: number };
  hashes: Record<string, string[]>;
  cofre: { hash: string; carta: Cifrado };
  host: { check: Cifrado; sobres: Record<string, Cifrado> };
}
