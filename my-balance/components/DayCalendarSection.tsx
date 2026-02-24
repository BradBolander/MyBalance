import { useState, useEffect } from 'react';
import type { RecurringBlock, DayOfWeek } from '../lib/schema';
import DayCalendarView, { DAYS } from './DayCalendarView';
import styles from '../styles/DayCalendarSection.module.css';

function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = new Date(dateStr + 'T12:00:00');
  const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[d.getDay()];
}

interface DayCalendarSectionProps {
  blocks: RecurringBlock[];
  dateStr?: string;
  onBlocksChange?: (blocks: RecurringBlock[]) => void;
  hideHeader?: boolean;
}

export default function DayCalendarSection({ blocks, dateStr, onBlocksChange, hideHeader }: DayCalendarSectionProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon');

  useEffect(() => {
    if (dateStr) setSelectedDay(getDayOfWeek(dateStr));
  }, [dateStr]);

  const handleBlockTimeChange = (blockId: string, startTime: string, endTime: string) => {
    if (!onBlocksChange) return;
    const updated = blocks.map((b) => {
      if (b.id !== blockId) return b;
      const dayConfig = { ...b.dayConfig, [selectedDay]: { startTime, endTime } };
      return { ...b, dayConfig };
    });
    onBlocksChange(updated);
  };

  return (
    <div className={styles.section}>
      {!hideHeader && (
        <>
          <h2 className={styles.title}>Day Calendar</h2>
          <p className={styles.subtitle}>
            Recurring blocks for this day of the week. Drag to reposition.
          </p>
        </>
      )}
      <div className={styles.dayTabs}>
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`${styles.dayTab} ${selectedDay === key ? styles.dayTabActive : ''}`}
            onClick={() => setSelectedDay(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <DayCalendarView
        blocks={blocks}
        selectedDay={selectedDay}
        onBlockTimeChange={onBlocksChange ? handleBlockTimeChange : undefined}
        dateStr={dateStr}
      />
    </div>
  );
}
