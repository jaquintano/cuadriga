// Iconos de trazo para la barra inferior (24×24, heredan el color del texto).
const P = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' } as const;

const ICONOS: Record<string, preact.JSX.Element> = {
  sobre: (
    <g {...P}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3 6l9 7 9-7" />
    </g>
  ),
  expediente: (
    <g {...P}>
      <path d="M3 6.5V18a1 1 0 001 1h16a1 1 0 001-1V8.5a1 1 0 00-1-1h-8l-2-2.5H4a1 1 0 00-1 1z" />
      <path d="M7 12h10M7 15.5h6" />
    </g>
  ),
  fragmentos: (
    <g {...P}>
      <rect x="2.5" y="7" width="4" height="10" rx="1" />
      <rect x="8.5" y="7" width="4" height="10" rx="1" />
      <rect x="14.5" y="7" width="4" height="10" rx="1" />
      <path d="M21.5 9v6" />
    </g>
  ),
  agenda: (
    <g {...P}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 10h18M8 3v4M16 3v4M7.5 14h3M7.5 17.5h6" />
    </g>
  ),
  galeria: (
    <g {...P}>
      <path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </g>
  ),
};

export function Icono({ nombre }: { nombre: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      {ICONOS[nombre]}
    </svg>
  );
}
