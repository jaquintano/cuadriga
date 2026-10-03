#!/usr/bin/env python3
"""Genera tests/crypto.fixture.json con datos SINTÉTICOS (sin spoilers) para comprobar
que src/core/crypto.ts y validate.ts reproducen exactamente el esquema de build-content.py.
Uso: python scripts/make-test-fixture.py
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("build", ROOT / "scripts" / "build-content.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

SALT, PIN, CODIGO, ITER = "sal-de-prueba-0123456789", "4321", "1234", 1000
campos = {"01.a": ["42"], "02.a": ["georg", "sans souci"], "03.c": ["7"]}
k_host = build.derive(PIN, SALT, "host", ITER)
k_cofre = build.derive(CODIGO, SALT, "cofre", ITER)
fixture = {
    "salt": SALT, "pin": PIN, "codigo": CODIGO, "iter": ITER,
    "hashes": {k: sorted(build.sha(SALT, k, build.normalize(v)) for v in vs) for k, vs in campos.items()},
    "cofreHash": build.sha(SALT, "cofre", CODIGO),
    "host": build.encrypt(k_host, "host:1", {"respuesta": "Prueba con ñ, «comillas» y <b>negrita</b>", "cifra": "7"}),
    "carta": build.encrypt(k_cofre, "cofre:carta", {"historia": ["Párrafo uno.", "Párrafo dos."]}),
}
out = ROOT / "tests" / "crypto.fixture.json"
out.write_text(json.dumps(fixture, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"OK: {out.relative_to(ROOT)}")
