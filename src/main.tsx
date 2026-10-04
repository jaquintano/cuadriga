import { render } from 'preact';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-400-italic.css';
import '@fontsource/source-serif-4/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-700.css';
import './styles/base.css';
import { SOBRES } from './core/content';
import { loadState, pedirPersistencia } from './storage/db';
import { marcarPersistencia, registrarSW } from './storage/offline';
import { App } from './ui/App';

async function arrancar() {
  const root = document.getElementById('app')!;
  registrarSW();
  void pedirPersistencia().then(marcarPersistencia);
  try {
    const initial = await loadState(SOBRES);
    render(<App initial={initial} />, root);
  } catch (e) {
    console.error(e);
    root.innerHTML =
      '<p style="padding:16px">No se pudo abrir el almacenamiento del expediente. ' +
      'Comprobad que no estáis en modo incógnito y recargad.</p>';
  }
}

void arrancar();
