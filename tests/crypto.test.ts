import { describe, expect, it } from 'vitest';
import { derivarClave, descifrar, hashCampo } from '../src/core/crypto';
import fx from './crypto.fixture.json';

describe('crypto (compatible con build-content.py)', () => {
  it('descifra el material del Host con el PIN correcto', async () => {
    const k = await derivarClave(fx.pin, fx.salt, 'host', fx.iter);
    expect(await descifrar(k, fx.host)).toEqual({
      respuesta: 'Prueba con ñ, «comillas» y <b>negrita</b>',
      cifra: '7',
    });
  });

  it('rechaza un PIN incorrecto (falla la etiqueta GCM)', async () => {
    const k = await derivarClave('0000', fx.salt, 'host', fx.iter);
    await expect(descifrar(k, fx.host)).rejects.toThrow();
  });

  it('el código del cofre: hash y carta cifrada', async () => {
    expect(await hashCampo(fx.salt, 'cofre', fx.codigo)).toBe(fx.cofreHash);
    const k = await derivarClave(fx.codigo, fx.salt, 'cofre', fx.iter);
    expect(await descifrar(k, fx.carta)).toEqual({ historia: ['Párrafo uno.', 'Párrafo dos.'] });
  });

  it('la clave de propósito «host» no abre el cofre', async () => {
    const k = await derivarClave(fx.codigo, fx.salt, 'host', fx.iter);
    await expect(descifrar(k, fx.carta)).rejects.toThrow();
  });
});
