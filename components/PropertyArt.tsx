const GRADIENT_ID = "pgrad";

const SKYLINES: Record<number, React.ReactNode> = {
  1: (
    <g fill="#F4F6FA" opacity={0.9}>
      <rect x="40" y="90" width="34" height="78" />
      <rect x="86" y="60" width="28" height="108" />
      <rect x="126" y="105" width="40" height="63" />
      <rect x="270" y="78" width="30" height="90" />
      <rect x="308" y="50" width="24" height="118" />
      <rect x="340" y="98" width="36" height="70" />
    </g>
  ),
  2: (
    <g fill="#F4F6FA" opacity={0.9}>
      <rect x="170" y="26" width="18" height="142" />
      <polygon points="179,4 190,26 168,26" />
      <rect x="120" y="90" width="30" height="78" />
      <rect x="220" y="106" width="34" height="62" />
    </g>
  ),
  3: (
    <g fill="#F4F6FA" opacity={0.9}>
      <rect x="60" y="118" width="52" height="50" />
      <rect x="130" y="118" width="52" height="50" />
      <rect x="200" y="118" width="52" height="50" />
      <rect x="270" y="118" width="52" height="50" />
    </g>
  ),
  4: (
    <g fill="none" stroke="#F4F6FA" strokeWidth={3} opacity={0.9}>
      <rect x="90" y="62" width="70" height="106" />
      <rect x="210" y="94" width="60" height="74" />
    </g>
  ),
  5: (
    <g fill="#F4F6FA" opacity={0.9}>
      <rect x="50" y="126" width="46" height="42" />
      <rect x="106" y="126" width="46" height="42" />
      <rect x="162" y="126" width="46" height="42" />
      <rect x="218" y="126" width="46" height="42" />
      <rect x="274" y="126" width="46" height="42" />
    </g>
  ),
};

export function PropertyArt({ seed, height = 168 }: { seed: number; height?: number }) {
  const skyline = SKYLINES[((seed - 1) % 5) + 1];
  const gradId = `${GRADIENT_ID}-${seed}`;
  return (
    <svg viewBox={`0 0 400 ${height}`} preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2E5A8C" />
          <stop offset="1" stopColor="#0E2135" />
        </linearGradient>
      </defs>
      <rect width="400" height={height} fill={`url(#${gradId})`} />
      {skyline}
    </svg>
  );
}
