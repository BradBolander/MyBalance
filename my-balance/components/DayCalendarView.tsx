import { useRef, useState, useEffect } from 'react';
import type { RecurringBlock, DayOfWeek } from '../lib/schema';
import styles from '../styles/DayCalendarView.module.css';

function getCurrentTimePercent(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  return (minutes / (24 * 60)) * 100;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function minutesToPercent(minutes: number): number {
  return (minutes / (24 * 60)) * 100;
}

interface DayCalendarViewProps {
  blocks: RecurringBlock[];
  selectedDay: DayOfWeek;
  onBlockTimeChange?: (blockId: string, startTime: string, endTime: string) => void;
  dateStr?: string;
}

export default function DayCalendarView({ blocks, selectedDay, onBlockTimeChange, dateStr }: DayCalendarViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentTimePercent, setCurrentTimePercent] = useState(getCurrentTimePercent);

  const isToday = dateStr === new Date().toISOString().slice(0, 10);
  const showCurrentTime = isToday;

  useEffect(() => {
    if (!showCurrentTime) return;
    const tick = () => setCurrentTimePercent(getCurrentTimePercent());
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [showCurrentTime]);

  type BlockSegment = RecurringBlock & { config: { startTime: string; endTime: string }; top: number; height: number };

  const dayBlockSegments: BlockSegment[] = [];
  for (const b of blocks) {
    const config = b.dayConfig[selectedDay];
    if (!config) continue;
    const startMin = timeToMinutes(config.startTime);
    let endMin = timeToMinutes(config.endTime);
    const isOvernight = endMin <= startMin;
    if (isOvernight) endMin += 24 * 60;

    if (isOvernight) {
      const beforeMidnight = 24 * 60 - startMin;
      dayBlockSegments.push({
        ...b,
        config,
        top: minutesToPercent(startMin),
        height: minutesToPercent(beforeMidnight),
      });
      dayBlockSegments.push({
        ...b,
        config,
        top: 0,
        height: minutesToPercent(endMin - 24 * 60),
      });
    } else {
      dayBlockSegments.push({
        ...b,
        config,
        top: minutesToPercent(startMin),
        height: minutesToPercent(endMin - startMin),
      });
    }
  }

  const handleDragStart = (e: React.DragEvent, block: BlockSegment) => {
    const startMin = timeToMinutes(block.config.startTime);
    let endMin = timeToMinutes(block.config.endTime);
    if (endMin <= startMin) endMin += 24 * 60;
    const duration = endMin - startMin;
    e.dataTransfer.setData('application/json', JSON.stringify({ blockId: block.id, duration }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!onBlockTimeChange) return;
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const { blockId, duration } = JSON.parse(data) as { blockId: string; duration: number };
    const timeline = timelineRef.current;
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const pct = Math.max(0, Math.min(1, y / rect.height));
    const newStartMin = Math.round((pct * 24 * 60) / 5) * 5;
    const newEndMin = newStartMin + duration;
    const startTime = minutesToTime(newStartMin);
    const endTime = minutesToTime(newEndMin);
    onBlockTimeChange(blockId, startTime, endTime);
  };

  return (
    <div className={styles.wrapper}>
      <div
        ref={timelineRef}
        className={styles.timeline}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {Array.from({ length: 25 }, (_, i) => (
          <div key={i} className={styles.hourMark} style={{ top: `${(i / 24) * 100}%` }}>
            <span className={styles.hourLabel}>{i === 0 ? '12am' : i === 12 ? '12pm' : i < 12 ? `${i}am` : `${i - 12}pm`}</span>
          </div>
        ))}
        {showCurrentTime && (
          <div
            className={styles.currentTimeIndicator}
            style={{ top: `${currentTimePercent}%` }}
            title={`Current time: ${new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`}
          />
        )}
        <div className={styles.blocks}>
          {dayBlockSegments.map((b, i) => (
            <div
              key={`${b.id}-${b.top}-${i}`}
              className={`${styles.block} ${onBlockTimeChange ? styles.draggable : ''}`}
              style={{
                top: `${b.top}%`,
                height: `${Math.max(b.height, 2)}%`,
                backgroundColor: b.color ?? 'var(--accent)',
              }}
              title={onBlockTimeChange ? `Drag to move • ${b.name} ${b.config.startTime}–${b.config.endTime}` : `${b.name} ${b.config.startTime}–${b.config.endTime}`}
              draggable={!!onBlockTimeChange}
              onDragStart={(e) => handleDragStart(e, b)}
              onDragOver={onBlockTimeChange ? handleDragOver : undefined}
              onDrop={onBlockTimeChange ? handleDrop : undefined}
            >
              <span className={styles.blockName}>{b.name}</span>
              <span className={styles.blockTime}>{b.config.startTime} – {b.config.endTime}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { DAYS };
