// El contenido sale de nuestro propio build (contenido.py) y solo usa <b>, <i> y <br/>.
// Es confiable, así que se inyecta como HTML.

export function Rich({ html, as: Tag = 'span', class: cls }: { html: string; as?: 'p' | 'span' | 'div'; class?: string }) {
  return <Tag class={cls} dangerouslySetInnerHTML={{ __html: html }} />;
}
