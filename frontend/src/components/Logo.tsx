interface LogoProps {
  variant?: 'blue' | 'white';
  width?: number;
}

const BLUE = '#003764';
const WHITE = '#FFFFFF';
const RED = '#E4032E';

export default function Logo({ variant = 'blue', width = 163 }: LogoProps) {
  const main = variant === 'blue' ? BLUE : WHITE;
  const height = Math.round(width * (158 / 325.53));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 325.53 158"
      width={width}
      height={height}
      aria-label="PIPAi"
      role="img"
    >
      <g transform="translate(24 24)">
        <rect x="1.5" y="1.5" width="19" height="107" fill={main} />
        <rect x="23.5" y="1.5" width="19" height="19" fill={main} />
        <rect x="23.5" y="45.5" width="19" height="19" fill={main} />
        <rect x="45.5" y="1.5" width="19" height="63" fill={main} />
        <rect x="45.5" y="89.5" width="19" height="19" fill={variant === 'blue' ? BLUE : RED} />
      </g>
      <text
        x="116.4"
        y="79"
        dominantBaseline="central"
        fontFamily="'Space Grotesk', system-ui, sans-serif"
        fontWeight={800}
        fontSize={72.6}
        letterSpacing="-0.04em"
        fill={main}
      >
        {variant === 'blue' ? (
          'PIPAi'
        ) : (
          <>PIPA<tspan fill={RED}>i</tspan></>
        )}
      </text>
    </svg>
  );
}
