import { expect, test } from '@playwright/test';

/**
 * Smoke test: instalación offline + primeros pasos del juego, SIN respuestas reales
 * (el repo es público). Recorre lo que importa en el metro: que la app cargue sin red,
 * que el flujo avance y que el progreso sobreviva a recargar.
 */
test('funciona sin conexión y conserva el progreso', async ({ page, context }) => {
  // 1. Primera visita con red: el service worker precachea la app.
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Sobre 00' })).toBeVisible();
  // Regresión: la ficha (Día/Hora) del sobre cerrado no debe colapsar por choques de clases CSS.
  expect((await page.locator('.sobre-cerrado .ficha').boundingBox())!.width).toBeGreaterThan(200);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Recarga para que el SW controle la página (igual que abrir la PWA instalada).
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // 2. Sin red: la app sigue cargando.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sobre 00' })).toBeVisible();

  // 3. Juego: romper el sello, aceptar la misión, pasar al 01.
  await page.getByRole('button', { name: /Romper el sello/ }).click();
  await expect(page.getByRole('heading', { name: /Prólogo/ })).toBeVisible();
  await page.getByRole('button', { name: 'Aceptar la misión' }).click();
  await expect(page.getByText('Misión aceptada')).toBeVisible();
  await page.getByRole('button', { name: /Siguiente sobre/ }).click();
  await page.getByRole('button', { name: /Romper el sello/ }).click();
  await expect(page.getByRole('heading', { name: /frontera/ })).toBeVisible();

  // 4. Una respuesta inventada se rechaza (la validación por hash funciona offline).
  await page.getByLabel('Número de idiomas').fill('treinta y siete');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.locator('.fallo')).toBeVisible();

  // 5. Comodín: gastar uno muestra la ayuda y baja el contador.
  await page.getByRole('button', { name: /Usar comodín/ }).click();
  await page.getByRole('button', { name: 'Sí, usar' }).click();
  await expect(page.getByRole('heading', { name: 'Comodín' })).toBeVisible();
  await expect(page.locator('.ficha-comodin.viva')).toHaveCount(2);

  // 6. Recargar sin red: el progreso sigue ahí (IndexedDB).
  await page.reload();
  await expect(page.getByRole('heading', { name: /frontera/ })).toBeVisible();
  await expect(page.locator('.ficha-comodin.viva')).toHaveCount(2);

  // 7. Las demás pantallas cargan offline y no revelan lugares de sobres cerrados.
  await page.getByRole('link', { name: /Expediente/ }).click();
  await expect(page.getByText('Clasificado').first()).toBeVisible();
  await page.getByRole('link', { name: /Agenda/ }).click();
  await expect(page.getByRole('tab', { name: 'Jueves 8' })).toBeVisible();
  await page.getByRole('link', { name: /Fragmentos/ }).click();
  await expect(page.getByText('0 de 4 cifras recuperadas.')).toBeVisible();
});

test('manifest instalable', async ({ request }) => {
  const res = await request.get('manifest.webmanifest');
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ display: 'standalone', orientation: 'portrait', short_name: 'Cuádriga' });
  const tamanos = m.icons.map((i: { sizes: string }) => i.sizes);
  expect(tamanos).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) expect((await request.get(i.src)).ok(), i.src).toBe(true);
});
