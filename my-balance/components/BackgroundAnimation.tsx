import styles from '../styles/BackgroundAnimation.module.css';

// Zen circle: half-circles with concentric rings. opacity: higher at edges, lower at center
function ZenCircle({ cx, cy, r, opacity, className }: { cx: number; cy: number; r: number; opacity: number; className: string }) {
  const rings = [1, 0.7, 0.45, 0.25];
  const stroke = `rgba(34, 139, 34, ${opacity})`; /* forest green */
  return (
    <g className={className}>
      {rings.map((scale, i) => (
        <path
          key={i}
          d={`M ${cx - r * scale} ${cy} A ${r * scale} ${r * scale} 0 0 1 ${cx + r * scale} ${cy}`}
          style={{ stroke }}
        />
      ))}
    </g>
  );
}

export default function BackgroundAnimation() {
  const bottom = 440;
  const circles = [
    { cx: 100, cy: bottom, r: 140, opacity: 0.5 },
    { cx: 280, cy: bottom, r: 160, opacity: 0.42 },
    { cx: 480, cy: bottom, r: 180, opacity: 0.32 },
    { cx: 800, cy: bottom, r: 220, opacity: 0.2 },
    { cx: 1120, cy: bottom, r: 180, opacity: 0.32 },
    { cx: 1320, cy: bottom, r: 160, opacity: 0.42 },
    { cx: 1500, cy: bottom, r: 140, opacity: 0.5 },
  ];
  return (
    <div className={styles.wrapper} aria-hidden>
      <svg className={styles.arcs} viewBox={`0 0 1700 ${bottom}`} preserveAspectRatio="xMidYMax meet">
        {circles.map((c, i) => (
          <ZenCircle key={i} {...c} className={styles[`zen${(i % 3) + 1}`]} />
        ))}
      </svg>
    </div>
  );
}
