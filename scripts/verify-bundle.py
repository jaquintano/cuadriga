#!/usr/bin/env python3
"""Busca spoilers en claro en el bundle construido (dist/). Solo local: usa contenido.py y respuestas.toml.

    npm run build && python scripts/verify-bundle.py [directorio]   (por defecto: dist)

FALLA si en dist/ aparece:
  - el código del cofre (con o sin guiones),
  - cualquier texto del Host (h_respuesta, h_llegar, h_notas) o la carta final.
INFORMA (sin fallar) de los valores aceptados que aparecen como palabra en el bundle:
suele ser legítimo (salen en las ayudas, que van en claro, o en el propio enigma).
"""
import importlib.util
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).parent))
from normalize import normalize  # noqa: E402

DIST = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "dist"


def plano(html):
    return re.sub(r"<[^>]+>", "", html)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    if not DIST.exists():
        sys.exit("ERROR: no existe dist/. Ejecuta antes `npm run build`.")
    spec = importlib.util.spec_from_file_location("contenido", ROOT / "contenido.py")
    c = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(c)
    reglas = tomllib.loads((ROOT / "scripts" / "respuestas.toml").read_text(encoding="utf-8"))["campo"]

    bundle = "\n".join(
        p.read_text(encoding="utf-8", errors="ignore")
        for p in DIST.rglob("*")
        if p.is_file() and p.suffix in {".js", ".html", ".json", ".css", ".webmanifest", ".txt"}
    )
    fallos = []
    codigo = re.sub(r"\D", "", c.CODIGO)
    for needle in (codigo, c.CODIGO):
        if needle in bundle:
            fallos.append(f"código del cofre «{needle}»")
    for s in c.SOBRES:
        for campo in ("h_respuesta", "h_llegar", "h_notas"):
            frag = plano(s[campo]).strip()[:40]
            if len(frag) > 12 and frag in bundle:
                fallos.append(f"sobre {s['num']} {campo}: «{frag}»")
        if s.get("final"):
            for p in s["historia"]:
                frag = plano(p)[:40]
                if frag in bundle:
                    fallos.append(f"carta final: «{frag}»")

    norm_bundle = " " + normalize(bundle) + " "
    avisos = sorted({
        f"{r['sobre']:02d}.{r['id']}: «{v}»"
        for r in reglas for v in r.get("valores", [])
        if len(normalize(v)) > 2 and f" {normalize(v)} " in norm_bundle
    })

    print(f"Analizados {sum(1 for p in DIST.rglob('*') if p.is_file())} ficheros de dist/.")
    if avisos:
        print(f"Aviso: {len(avisos)} valores aceptados aparecen como palabra (revisa que sea en ayudas o enigmas):")
        for a in avisos:
            print("   ", a)
    if fallos:
        print("FALLO: spoilers en claro en el bundle:")
        for f in fallos:
            print("   ", f)
        sys.exit(1)
    print("OK: ni el código del cofre ni el material del Host aparecen en claro.")


if __name__ == "__main__":
    main()
