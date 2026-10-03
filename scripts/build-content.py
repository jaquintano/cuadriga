#!/usr/bin/env python3
"""Genera el contenido de la app a partir de contenido.py y scripts/respuestas.toml.

    CUADRIGA_PIN=123456 CUADRIGA_SALT=<hex> python scripts/build-content.py

Las variables también se leen de un fichero .env en la raíz (no se sube al repo).

Salida (sí se sube al repo, no contiene spoilers en claro):
  src/content/sobres.json   textos públicos + definición de campos (sin valores)
  src/content/hitos.json    paradas sin sobre
  src/content/secrets.json  hashes de respuestas, material del Host cifrado, carta final cifrada

Esquema criptográfico (espejo de src/core/crypto.ts):
  hash(campo, valor)  = hex(SHA-256(f"{SALT}|{campo}|{valor}"))
  clave Host          = PBKDF2-SHA256(PIN,    f"{SALT}:host",  ITER) → AES-256-GCM
  clave cofre         = PBKDF2-SHA256(código, f"{SALT}:cofre", ITER) → AES-256-GCM
  IV                  = HMAC-SHA256(clave, etiqueta‖texto)[:12]  (determinista: builds reproducibles)
"""
import base64
import hashlib
import hmac
import importlib.util
import json
import os
import re
import sys
import tomllib
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from normalize import normalize  # noqa: E402

OUT = ROOT / "src" / "content"
ITER = 600_000
EXTRA_TIPOS = [
    ("PREGUNTA DE HONOR", "honor"), ("RETO", "reto"), ("TESORO", "tesoro"), ("AVISO", "aviso"),
    ("PISTA", "pista"), ("RECOMPENSA", "recompensa"), ("MISIÓN", "mision"),
]


def fail(msg):
    sys.exit(f"ERROR: {msg}")


def load_env():
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    pin = os.environ.get("CUADRIGA_PIN", "")
    salt = os.environ.get("CUADRIGA_SALT", "")
    if not re.fullmatch(r"\d{4,8}", pin):
        fail("CUADRIGA_PIN debe tener entre 4 y 8 dígitos.")
    if len(salt) < 16:
        fail("CUADRIGA_SALT debe tener al menos 16 caracteres (p. ej. `openssl rand -hex 16`).")
    return pin, salt


def load_contenido():
    spec = importlib.util.spec_from_file_location("contenido", ROOT / "contenido.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def sha(salt, campo, valor):
    return hashlib.sha256(f"{salt}|{campo}|{valor}".encode()).hexdigest()


def derive(secret, salt, purpose, iterations=ITER):
    return hashlib.pbkdf2_hmac("sha256", secret.encode(), f"{salt}:{purpose}".encode(), iterations, 32)


def encrypt(key, label, obj):
    data = json.dumps(obj, ensure_ascii=False).encode()
    iv = hmac.new(key, label.encode() + b"\0" + data, hashlib.sha256).digest()[:12]
    ct = AESGCM(key).encrypt(iv, data, None)  # ct ‖ tag, igual que Web Crypto
    return {"iv": base64.b64encode(iv).decode(), "ct": base64.b64encode(ct).decode()}


def tipo_extra(texto):
    for prefijo, tipo in EXTRA_TIPOS:
        if texto.upper().startswith(prefijo):
            return tipo
    return "nota"


def fecha_de(dia):
    m = re.search(r"(\d+)$", dia)
    return f"2026-10-{int(m.group(1)):02d}"


def build_campos(reglas, sobres, salt):
    """Devuelve ({num: [campo público]}, {clave: [hash]}, {num: valor cifra})."""
    por_sobre, hashes, cifras = {}, {}, {}
    nums = {s["num"]: s for s in sobres}
    for r in reglas:
        num, cid = r["sobre"], r["id"]
        if num not in nums:
            fail(f"respuestas.toml: el sobre {num} no existe.")
        if r["tipo"] not in ("obligatorio", "honor", "tesoro"):
            fail(f"sobre {num}.{cid}: tipo desconocido {r['tipo']!r}")
        if r["modo"] not in ("exact", "keywords", "libre"):
            fail(f"sobre {num}.{cid}: modo desconocido {r['modo']!r}")
        clave = f"{num:02d}.{cid}"
        if clave in hashes:
            fail(f"campo duplicado {clave}")
        valores = [normalize(v) for v in r.get("valores", [])]
        if r["modo"] != "libre" and not valores:
            fail(f"{clave}: modo {r['modo']} sin valores.")
        for v in valores:
            if r["modo"] == "keywords" and (len(v) < 3 or len(v.split()) > 2):
                fail(f"{clave}: palabra clave {v!r} debe tener ≥3 letras y como mucho 2 palabras.")
        publico = {"id": cid, "tipo": r["tipo"], "modo": r["modo"], "etiqueta": r["etiqueta"]}
        if "cifra" in r:
            if nums[num].get("cifra") != r["cifra"]:
                fail(f"{clave}: cifra={r['cifra']} no coincide con contenido.py.")
            if r["modo"] != "exact" or len(valores) != 1 or not valores[0].isdigit():
                fail(f"{clave}: un campo de cifra debe ser exact con un único dígito.")
            publico["cifra"] = r["cifra"]
            cifras[num] = valores[0]
        por_sobre.setdefault(num, []).append(publico)
        hashes[clave] = sorted(sha(salt, clave, v) for v in valores)
    # Coherencia: todo sobre con respuesta tiene al menos un campo obligatorio.
    for s in sobres:
        obligatorios = [c for c in por_sobre.get(s["num"], []) if c["tipo"] == "obligatorio"]
        if s.get("respuesta") and not obligatorios:
            fail(f"El sobre {s['num']} tiene respuesta=True pero ningún campo obligatorio.")
        if not s.get("respuesta") and s["num"] in por_sobre:
            fail(f"El sobre {s['num']} tiene respuesta=False pero campos en respuestas.toml.")
        if s.get("cifra") and s["num"] not in cifras:
            fail(f"El sobre {s['num']} da la cifra {s['cifra']} pero no tiene campo de cifra.")
    return por_sobre, hashes, cifras


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    pin, salt = load_env()
    c = load_contenido()
    reglas = tomllib.loads((ROOT / "scripts" / "respuestas.toml").read_text(encoding="utf-8"))["campo"]
    campos, hashes, cifras = build_campos(reglas, c.SOBRES, salt)

    codigo = re.sub(r"\D", "", c.CODIGO)
    if [cifras[n] for n in sorted(cifras)] != list(codigo):
        fail(f"Las cifras de los sobres {sorted(cifras)} no forman el código {c.CODIGO}.")

    print(f"Derivando claves (PBKDF2 × {ITER:,})…")
    k_host = derive(pin, salt, "host")
    k_cofre = derive(codigo, salt, "cofre")

    dias = list(dict.fromkeys(s["dia"] for s in c.SOBRES))
    publicos, host = [], {}
    for s in c.SOBRES:
        num = s["num"]
        final = bool(s.get("final"))
        p = {
            "num": num, "dia": s["dia"], "hora": s["hora"], "lugar": s["lugar"], "titulo": s["titulo"],
            "historia": [] if final else s["historia"],
            "enigma": s.get("enigma"),
            "extras": [{"texto": e, "tipo": tipo_extra(e), "foto": "RETO" in e.upper()}
                       for e in s.get("extras", [])],
            "rumbo": s.get("rumbo"),
            "mas_info": s.get("mas_info", []),
            "ayudas": [s.get("h_ayuda1", ""), s.get("h_ayuda2", "")],
            "campos": campos.get(num, []),
        }
        if s.get("cifra"):
            p["cifra"] = s["cifra"]
        if final:
            p["final"] = True
        elif not s.get("respuesta"):
            p["accion"] = "aceptar"
        publicos.append(p)
        secreto = {"respuesta": s["h_respuesta"], "llegar": s["h_llegar"], "notas": s["h_notas"]}
        if num in cifras:
            secreto["cifra"] = cifras[num]
        host[str(num)] = encrypt(k_host, f"host:{num}", secreto)

    final_sobre = next(s for s in c.SOBRES if s.get("final"))
    secrets_json = {
        "v": 1,
        "salt": salt,
        "kdf": {"alg": "PBKDF2-SHA256", "iter": ITER},
        "hashes": hashes,
        "cofre": {
            "hash": sha(salt, "cofre", codigo),
            "carta": encrypt(k_cofre, "cofre:carta", {"historia": final_sobre["historia"]}),
        },
        "host": {"check": encrypt(k_host, "host:check", "cuadriga"), "sobres": host},
    }
    sobres_json = {
        "v": 1,
        "dias": [{"id": d, "fecha": fecha_de(d)} for d in dias],
        "sobres": publicos,
    }
    hitos_json = [{"dia": d, "hora": h, "titulo": t, "notas": n} for d, h, t, n in c.HITOS]

    # Salvaguarda anti-spoiler: nada secreto en el JSON público.
    publico_txt = json.dumps(sobres_json, ensure_ascii=False)
    for s in c.SOBRES:
        for campo in ("h_respuesta", "h_llegar", "h_notas"):
            frag = s[campo][:40]
            if len(frag) > 12 and frag in publico_txt:
                fail(f"Fuga: {campo} del sobre {s['num']} aparece en sobres.json")
    if codigo in publico_txt or c.CODIGO in publico_txt:
        fail("Fuga: el código del cofre aparece en sobres.json")

    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in (("sobres", sobres_json), ("hitos", hitos_json), ("secrets", secrets_json)):
        path = OUT / f"{name}.json"
        path.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"  {path.relative_to(ROOT)}  ({path.stat().st_size / 1024:.1f} KB)")
    print(f"OK: {len(publicos)} sobres, {len(hitos_json)} hitos, {len(hashes)} campos con hash.")


if __name__ == "__main__":
    main()
