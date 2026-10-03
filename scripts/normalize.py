"""Normalización de respuestas. ESPEJO EXACTO de src/core/normalize.ts.

Ambas implementaciones se validan con tests/normalize.vectors.json:
si cambias una, cambia la otra y añade vectores.

Pasos:
  1. ß → ss, minúsculas, quitar diacríticos (ä → a, ñ → n).
  2. Quitar separadores de miles entre dígitos (3.300 → 3300).
  3. Todo lo que no sea [a-z0-9] → espacio; colapsar espacios.
  4. Números en letra → cifra («veinticuatro» → 24, «mil novecientos ochenta y cinco» → 1985).
"""
import re
import unicodedata

UNITS = {
    "cero": 0, "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6, "siete": 7,
    "ocho": 8, "nueve": 9, "diez": 10, "once": 11, "doce": 12, "trece": 13, "catorce": 14,
    "quince": 15, "dieciseis": 16, "diecisiete": 17, "dieciocho": 18, "diecinueve": 19,
    "veinte": 20, "veintiuno": 21, "veintidos": 22, "veintitres": 23, "veinticuatro": 24,
    "veinticinco": 25, "veintiseis": 26, "veintisiete": 27, "veintiocho": 28, "veintinueve": 29,
}
TENS = {
    "treinta": 30, "cuarenta": 40, "cincuenta": 50, "sesenta": 60,
    "setenta": 70, "ochenta": 80, "noventa": 90,
}
HUNDREDS = {
    "cien": 100, "ciento": 100, "doscientos": 200, "trescientos": 300, "cuatrocientos": 400,
    "quinientos": 500, "seiscientos": 600, "setecientos": 700, "ochocientos": 800,
    "novecientos": 900,
}


def _kind(tok):
    if tok in UNITS:
        return "U"
    if tok in TENS:
        return "T"
    if tok in HUNDREDS:
        return "H"
    if tok == "mil":
        return "M"
    return None


def _value(tok):
    return UNITS.get(tok) or TENS.get(tok) or HUNDREDS.get(tok) or 0


# Qué clase de palabra puede seguir a cada estado (máquina de estados de la gramática numérica).
_NEXT = {
    "start": {"H", "T", "U", "M"},
    "H": {"T", "U", "M"},
    "T": {"Y", "M"},
    "Y": {"U"},
    "U": {"M"},
    "M": {"H", "T", "U"},
}


def words_to_numbers(tokens):
    out = []
    i = 0
    n = len(tokens)
    while i < n:
        if _kind(tokens[i]) is None:
            out.append(tokens[i])
            i += 1
            continue
        total, cur, state, has_mil = 0, 0, "start", False
        while i < n:
            tok = tokens[i]
            k = _kind(tok)
            if tok == "y" and state == "T":
                # «y» solo une decena con unidad 1-9: «treinta y dos».
                nxt = tokens[i + 1] if i + 1 < n else None
                if nxt in UNITS and 1 <= UNITS[nxt] <= 9:
                    state = "Y"
                    i += 1
                    continue
                break
            if k is None or k not in _NEXT[state]:
                break
            if k == "M":
                if has_mil:
                    break
                total += (cur or 1) * 1000
                cur, has_mil = 0, True
            else:
                if state == "Y" and not (1 <= UNITS.get(tok, 0) <= 9):
                    break
                cur += _value(tok)
            state = k
            i += 1
        out.append(str(total + cur))
    return out


def normalize(text):
    if text is None:
        return ""
    s = text.replace("ß", "ss").replace("ẞ", "ss").lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"(?<=\d)\.(?=\d)", "", s)
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    if not s:
        return ""
    return " ".join(words_to_numbers(s.split(" ")))
