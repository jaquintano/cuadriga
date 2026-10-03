import { render } from 'preact';
import contenido from './content/sobres.json';

// Placeholder del hito 1: comprueba que el contenido generado se carga.
function App() {
  return (
    <main style={{ fontFamily: 'serif', padding: 16 }}>
      <h1>El Secreto de la Cuádriga</h1>
      <p>{contenido.sobres.length} sobres cargados.</p>
      <ol start={0}>
        {contenido.sobres.map((s) => (
          <li key={s.num}>
            {s.dia} {s.hora} · {s.titulo} · {s.campos.length} campos
          </li>
        ))}
      </ol>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
