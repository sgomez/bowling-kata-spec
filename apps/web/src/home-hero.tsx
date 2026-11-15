const PIN =
  "M-7.5,0 C-10,-8 -16,-18 -16,-32 C-16,-48 -8,-56 -6.5,-68 C-6,-74 -8.5,-78 -8.5,-86 C-8.5,-95 -4,-100 0,-100 C4,-100 8.5,-95 8.5,-86 C8.5,-78 6,-74 6.5,-68 C8,-56 16,-48 16,-32 C16,-18 10,-8 7.5,0 Z";

const PINS: [number, number, number][] = [
  [150.7, 260.2, 0.369],
  [180.2, 260.2, 0.369],
  [209.8, 260.2, 0.369],
  [239.3, 260.2, 0.369],
  [164.1, 272.8, 0.387],
  [195, 272.8, 0.387],
  [225.9, 272.8, 0.387],
  [178.8, 286.7, 0.406],
  [211.2, 286.7, 0.406],
  [195, 302.1, 0.427],
];

export const HomeHero = ({
  viewBox = "0 70 390 330",
}: {
  viewBox?: string;
}) => (
  <svg
    class="home-hero"
    role="img"
    aria-label="Pista de bolos con los diez bolos al fondo"
    viewBox={viewBox}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <radialGradient id="hero-pink">
        <stop offset="0" stop-color="#ff3d8b" stop-opacity="0.5" />
        <stop offset="1" stop-color="#ff3d8b" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="hero-cyan">
        <stop offset="0" stop-color="#3de8ff" stop-opacity="0.4" />
        <stop offset="1" stop-color="#3de8ff" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="hero-lane" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b98a5a" />
        <stop offset="1" stop-color="#efcf96" />
      </linearGradient>
      <linearGradient id="hero-pin" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0.55" stop-color="#fff" />
        <stop offset="1" stop-color="#cfc6e2" />
      </linearGradient>
      <g id="hero-pin-shape">
        <path d={PIN} fill="url(#hero-pin)" />
        <path
          d="M-6.6,-66.5 L6.6,-66.5 M-6.9,-73.5 L6.9,-73.5"
          stroke="#e5263a"
          stroke-width="3.6"
        />
      </g>
    </defs>
    <rect x="0" y="0" width="390" height="844" fill="#0b0817" />
    <ellipse cx="60" cy="98" rx="230" ry="170" fill="url(#hero-pink)" />
    <ellipse cx="340" cy="118" rx="220" ry="160" fill="url(#hero-cyan)" />
    <rect x="0" y="250.7" width="390" height="593.3" fill="#110d20" />
    <rect x="-10" y="128.5" width="410" height="74.9" fill="#1b1436" />
    <line
      class="neon-cyan"
      x1="-10"
      y1="128.5"
      x2="400"
      y2="128.5"
      stroke="#3de8ff"
      stroke-width="3"
    />
    <line
      class="neon-pink"
      x1="-10"
      y1="203.4"
      x2="400"
      y2="203.4"
      stroke="#ff3d8b"
      stroke-width="3.5"
    />
    <rect x="123.9" y="203.4" width="142.1" height="47.9" fill="#040309" />
    <polygon
      points="-47.3,874 123.9,250.7 266.1,250.7 437.3,874"
      fill="#090712"
    />
    <polygon
      points="69,656.2 145.9,250.7 244.1,250.7 321,656.2"
      fill="url(#hero-lane)"
    />
    {PINS.map(([x, y, scale]) => (
      <use
        key={`${x},${y}`}
        href="#hero-pin-shape"
        transform={`translate(${x},${y}) scale(${scale})`}
      />
    ))}
  </svg>
);
