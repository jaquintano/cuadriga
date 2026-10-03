// Llave estilizada: el aro es una rueda de carro (la cuádriga), el paletón, cuatro dientes (las cuatro cifras).
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">
        <circle cx="20" cy="32" r="12" />
        <path d="M20 20v24M8 32h24M11.5 23.5l17 17M28.5 23.5l-17 17" stroke-width="2" />
        <path d="M32 32h26" />
        <path d="M40 32v7M46 32v5M52 32v7M58 32v5" stroke-width="3.5" />
      </g>
    </svg>
  );
}
