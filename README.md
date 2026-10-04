# El Secreto de la Cuádriga

PWA offline para el juego de búsqueda del tesoro por Berlín y Potsdam (8-10 de octubre de 2026).
Sustituye a los 24 sobres, la Tarjeta de Fragmentos y el cofre. Los PDF impresos quedan como copia de seguridad.

**URL:** https://jaquintano.github.io/cuadriga/

> **Repositorio público sin spoilers.** `contenido.py`, `scripts/respuestas.toml`, `.env` y los PDF
> se quedan en local (`.gitignore`). Al repo solo llegan los JSON generados: textos públicos,
> respuestas **hasheadas** y material del Host **cifrado**.

---

## Arquitectura en dos líneas

- **Build de contenido (Python, local):** `contenido.py` + `respuestas.toml` + `.env` → `src/content/*.json`.
- **App (Vite + TypeScript + Preact):** un *reducer* puro con la máquina de estados `LOCKED → OPEN → SOLVED`,
  persistencia en IndexedDB, Web Crypto para validar y descifrar, y Workbox para funcionar sin red.

```
contenido.py ─┐
respuestas.toml ─┼─▶ scripts/build-content.py ─▶ src/content/{sobres,hitos,secrets}.json ─▶ Vite ─▶ dist/ ─▶ GitHub Pages
.env (PIN, sal) ─┘                                         (se suben al repo)
```

| Carpeta | Qué hay |
|---|---|
| `scripts/` | `build-content.py`, `normalize.py` (espejo de la app), `verify-bundle.py` (local), `ci-check-bundle.mjs` (CI) |
| `src/core/` | Lógica pura y probada: normalización, validación, cripto, reducer, agenda, lluvia, cofre |
| `src/storage/` | IndexedDB (estado y fotos), copias de seguridad, descargas y service worker |
| `src/ui/` | Pantallas (Preact) |
| `tests/` | Vitest (83 tests); `e2e/`: smoke test de Playwright (offline) |

### Anti-spoiler

| Qué | Cómo |
|---|---|
| Respuestas | `SHA-256(sal ‖ campo ‖ valor normalizado)`. En `keywords` se hashean los prefijos de cada palabra y bigrama de la entrada. |
| Código del cofre | Solo su hash. La carta final va cifrada con una clave derivada del propio código (PBKDF2 + AES-GCM). |
| Material del Host | `h_respuesta`, `h_llegar` y `h_notas`, cifrados con AES-GCM y una clave derivada del PIN (PBKDF2, 600 000 iteraciones). |
| Interfaz | Los sobres cerrados no muestran el lugar ni en el sobre ni en el Expediente ni en la Agenda. |

**Límite honesto:** la sal está en el bundle, así que una respuesta de un dígito o el código (10⁴ combinaciones) se pueden sacar por fuerza bruta.
Esto protege de mirar el código fuente, no de un ataque deliberado.

---

## 1. Ejecutar en local y probar en el móvil

Requisitos: Node 24 y Python 3.11 o superior.

```bash
npm install
npm run dev
```

Vite muestra dos URL: `Local` (este PC) y `Network` (por ejemplo, `http://192.168.1.20:5173`). Abre la de **Network** en el móvil, conectado a **la misma Wi-Fi**.
La primera vez, Windows puede pedir permiso de firewall para Node: acéptalo en redes privadas.

> En `npm run dev` no hay service worker, y por HTTP en la red local Chrome no deja instalar la PWA.
> Para probar la instalación y el modo offline de verdad, usa la URL desplegada (HTTPS), o en el PC:
> `npm run build && npx vite preview --host` → `http://localhost:4173/cuadriga/`.

Tests:

```bash
npm test               # Vitest (incluye el test con respuestas reales si existen respuestas.toml y .env)
npm run test:e2e       # Playwright: build + preview + juego offline
```

## 2. Cambiar el PIN y regenerar el contenido

Preparación (una sola vez):

```bash
python -m venv .venv
.venv/Scripts/pip install -r scripts/requirements.txt     # en Linux/macOS: .venv/bin/pip
```

`.env` (local, nunca se sube):

```
CUADRIGA_PIN=123456                 # 4-8 dígitos
CUADRIGA_SALT=<openssl rand -hex 16>
```

Regenerar después de cambiar el PIN, `contenido.py` o `scripts/respuestas.toml`:

```bash
.venv/Scripts/python scripts/build-content.py      # genera src/content/*.json
.venv/Scripts/python -m unittest scripts/test_normalize.py
npm test                                           # incluye la comprobación de las respuestas reales
npm run build && .venv/Scripts/python scripts/verify-bundle.py
git add src/content && git commit -m "Regenera contenido" && git push
```

- Las **reglas de validación** están en `scripts/respuestas.toml` (plantilla pública en `respuestas.example.toml`):
  `exact` (la entrada, o su único número, coincide), `keywords` (alguna palabra o bigrama **empieza** por la clave) y `libre`.
- Si cambias la **sal**, cambian todos los hashes: hay que regenerar y desplegar.
- Si cambias el **PIN**, el móvil pedirá el nuevo la próxima vez que entres en el modo Host.
- Si cambias `scripts/normalize.py`, cambia también `src/core/normalize.ts` y añade casos a `tests/normalize.vectors.json`.
- `scripts/make-test-fixture.py` regenera el fixture sintético de los tests de cifrado (no contiene spoilers).

## 3. Desplegar

Cada `git push` a `main` lanza `.github/workflows/deploy.yml`:
tests → build → comprobación anti-spoiler → smoke test offline → GitHub Pages.

```bash
git push
gh run watch            # seguir el despliegue
```

GitHub Pages ya está configurado con **Source: GitHub Actions**. El `base` de Vite es `/cuadriga/` en `build` y `preview`, y `/` en `dev`.
CI no necesita el PIN ni `contenido.py`: despliega los JSON ya generados.

## 4. Instalar en Android

1. Abre **https://jaquintano.github.io/cuadriga/** en **Chrome** (no en el navegador integrado de WhatsApp o Gmail).
2. Pulsa **«Instalar»** en el aviso azul bajo la cabecera. Si no aparece el botón, usa el menú ⋮ → **«Instalar aplicación»**.
3. Ábrela desde el icono del sello rojo: se abre a pantalla completa, sin la barra del navegador, y el aviso ya no sale.

Tras la primera carga, todo funciona sin conexión. Si despliegas una versión nueva, se actualiza sola la próxima vez que la abras con conexión.

## 5. Checklist previa al viaje

En el móvil de la jugadora, unos días antes:

- [ ] Abrir la URL **con conexión** e instalar la app.
- [ ] Cerrarla y volver a abrirla desde el icono.
- [ ] **Modo Host** (pulsación larga en el logo → PIN): comprobar **«Offline listo: sí ✓»** y **«almacenamiento persistente: sí ✓»**.
- [ ] Activar el **modo avión**.
- [ ] Recorrer los **sobres 00-02**: romper sellos, responder, **gastar un comodín** y **hacer una foto** en un reto.
- [ ] Cerrar la app (también de recientes), volver a abrirla en modo avión y comprobar que el progreso sigue ahí.
- [ ] Mirar Expediente, Fragmentos, Agenda y Fotos sin conexión.
- [ ] Modo Host → **Reiniciar partida** (marcando «Borrar también las fotos»).
- [ ] Desactivar el modo avión.
- [ ] Modo Host → escribir el **mensaje personal** del cofre.
- [ ] Modo Host → **Exportar estado** (JSON) y guardarlo en tu móvil como copia de seguridad.

Durante el viaje:

- Viernes con lluvia: Modo Host → **Variante de lluvia**.
- Cada noche, opcional: **Exportar estado** y **Fotos → Descargar todas (zip)**.
- Si algo falla: Modo Host → **Marcar como resuelto** o **Saltar** el sobre en juego (si tiene cifra, se rellena igual).

## Modo Host

Pulsación larga (~1 s) en la llave del encabezado. El PIN es el de `CUADRIGA_PIN`; la primera vez queda «configurado».
La clave solo vive en memoria: al salir del modo Host se olvida.

- Ficha de cada sobre (◀ ▶): respuesta, cómo llegar, ayudas y notas.
- Marcar como resuelto o saltar el sobre en juego.
- Variante de lluvia (sobres 09-14).
- Mensaje personal del cofre.
- Exportar e importar el estado (JSON) y reiniciar la partida.

## Pendiente (no implementado)

- Desbloqueo por geolocalización: el *hook* está en `src/geo/unlock.ts` (hoy siempre permite abrir).
