const PALETTES: string[][] = [
  ["#0E5C46", "#2E9470", "#133D2E"], // primary green
  ["#9C5A2E", "#C98A52", "#4A2A14"], // gold
  ["#2B4C73", "#5B87C4", "#152C47"], // accent3 navy
];

function hashSeed(input: string | number): number {
  if (typeof input === "number") return Math.abs(Math.floor(input));
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  return hash;
}

function wedgePath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

// A deterministic "cut-gem" wedge pattern instead of a flat gradient — same
// agent always gets the same look (seeded from their id/slug), but no two
// agents look quite alike. Scales down cleanly to the smallest avatar size
// since it's bold shapes, not fine detail.
export function AgentAvatar({
  seed,
  initials,
  size = 76,
  className,
}: {
  seed: string | number;
  initials: string;
  size?: number;
  className?: string;
}) {
  const n = hashSeed(seed);
  const palette = PALETTES[n % PALETTES.length];
  const wedgeCount = 7;
  const rotationOffset = n % 360;
  const sliceDeg = 360 / wedgeCount;
  const clipId = `avclip-${n}`;

  const wedges = Array.from({ length: wedgeCount }, (_, i) => {
    const start = rotationOffset + sliceDeg * i;
    const end = start + sliceDeg + 1; // +1 to erase hairline seams between wedges
    const color = palette[(n + i * 5) % palette.length];
    return <path key={i} d={wedgePath(50, 50, 60, start, end)} fill={color} />;
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: "block", borderRadius: "50%", flexShrink: 0 }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
        <radialGradient id={`${clipId}-shade`} cx="35%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {wedges}
        <circle cx="50" cy="50" r="50" fill={`url(#${clipId}-shade)`} />
      </g>
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontWeight: 700,
          fontSize: 32,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
        }}
      >
        {initials}
      </text>
    </svg>
  );
}
