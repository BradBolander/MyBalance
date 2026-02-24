import { useMemo } from 'react';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import type { Category } from '../lib/schema';
import styles from '../styles/PieAllocator.module.css';

interface PieAllocatorProps {
  allocations: Record<string, number>;
  onAllocationsChange: (allocations: Record<string, number>) => void;
  categories?: Category[];
}

const TOTAL = 100;
const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 128;
const FREE_TIME_COLOR = '#e5e7eb';

function clampAllocations(
  allocations: Record<string, number>,
  categories: Category[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const c of categories) {
    result[c.id] = Math.max(0, Math.min(TOTAL, allocations[c.id] ?? 0));
  }
  return result;
}

function getArcPath(
  startAngle: number,
  endAngle: number,
  innerR: number,
  outerR: number
): string {
  const start = polarToCartesian(CENTER, CENTER, outerR, startAngle);
  const end = polarToCartesian(CENTER, CENTER, outerR, endAngle);
  const startInner = polarToCartesian(CENTER, CENTER, innerR, startAngle);
  const endInner = polarToCartesian(CENTER, CENTER, innerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    'M', start.x, start.y,
    'A', outerR, outerR, 0, largeArc, 1, end.x, end.y,
    'L', endInner.x, endInner.y,
    'A', innerR, innerR, 0, largeArc, 0, startInner.x, startInner.y,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angle: number
): { x: number; y: number } {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

export default function PieAllocator({
  allocations,
  onAllocationsChange,
  categories = DEFAULT_CATEGORIES,
}: PieAllocatorProps) {
  const values = useMemo(
    () => clampAllocations(allocations, categories),
    [allocations, categories]
  );

  const allocatedSum = useMemo(
    () => Object.values(values).reduce((a, b) => a + b, 0),
    [values]
  );
  const freeTime = Math.max(0, TOTAL - allocatedSum);

  const segments = useMemo(() => {
    const segs: Array<{ id: string; name: string; color: string; startAngle: number; endAngle: number }> = [];
    let currentAngle = 0;
    for (const c of categories) {
      const pct = values[c.id] ?? 0;
      if (pct > 0) {
        const angle = (pct / 100) * 360;
        segs.push({
          id: c.id,
          name: c.name,
          color: c.color,
          startAngle: currentAngle,
          endAngle: currentAngle + angle,
        });
        currentAngle += angle;
      }
    }
    if (freeTime > 0) {
      const angle = (freeTime / 100) * 360;
      segs.push({
        id: 'freeTime',
        name: 'Free time',
        color: FREE_TIME_COLOR,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      });
    }
    return segs;
  }, [values, categories, freeTime]);

  const handleInputChange = (categoryId: string, value: number) => {
    const next = { ...values, [categoryId]: Math.max(0, Math.min(TOTAL, value)) };
    onAllocationsChange(next);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pieWrapper}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {segments.map((seg) => (
            <path
              key={seg.id}
              d={getArcPath(seg.startAngle, seg.endAngle, RADIUS - 20, RADIUS)}
              fill={seg.color}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </svg>
        <div className={styles.legend}>
          {segments.map((seg) => (
            <span
              key={seg.id}
              className={styles.legendItem}
              style={{ color: seg.id === 'freeTime' ? '#6b7280' : seg.color }}
            >
              {seg.name} ({seg.id === 'freeTime' ? freeTime : values[seg.id] ?? 0}%)
            </span>
          ))}
        </div>
      </div>
      <div className={styles.inputs}>
        {categories.map((c) => (
          <div key={c.id} className={styles.inputRow}>
            <label
              className={styles.label}
              style={{ borderLeftColor: c.color }}
            >
              {c.name}
            </label>
            <input
              type="number"
              min={0}
              max={TOTAL}
              value={values[c.id] ?? 0}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') handleInputChange(c.id, 0);
                else {
                  const v = parseInt(val, 10);
                  if (!Number.isNaN(v)) handleInputChange(c.id, v);
                }
              }}
              onBlur={(e) => {
                const v = parseInt(e.target.value, 10);
                if (Number.isNaN(v) || v < 0) handleInputChange(c.id, 0);
                else if (v > TOTAL) handleInputChange(c.id, TOTAL);
              }}
              className={styles.input}
            />
            <span className={styles.percent}>%</span>
          </div>
        ))}
      </div>
      <p className={styles.totalHint}>
        Allocated: {allocatedSum}% · Free time: {freeTime}%
      </p>
    </div>
  );
}
