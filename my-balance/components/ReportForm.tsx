import { useState } from 'react';
import type { DayActivity } from '../lib/schema';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import styles from '../styles/ReportForm.module.css';

interface ReportFormProps {
  activities: DayActivity[];
  onSubmit: (completedIds: string[], missedIds: string[], notes?: string) => void;
  initialCompleted?: string[];
  initialMissed?: string[];
  initialNotes?: string;
}

function getCategoryName(categoryId: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;
}

export default function ReportForm({
  activities,
  onSubmit,
  initialCompleted = [],
  initialMissed = [],
  initialNotes = '',
}: ReportFormProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(initialCompleted)
  );
  const [missedIds, setMissedIds] = useState<Set<string>>(new Set(initialMissed));
  const [notes, setNotes] = useState(initialNotes);

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setMissedIds((m) => {
          const m2 = new Set(m);
          m2.delete(id);
          return m2;
        });
      }
      return next;
    });
  };

  const toggleMissed = (id: string) => {
    setMissedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setCompletedIds((c) => {
          const c2 = new Set(c);
          c2.delete(id);
          return c2;
        });
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(Array.from(completedIds), Array.from(missedIds), notes.trim() || undefined);
  };

  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        No activities to report. Add activities to your day first.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <p className={styles.hint}>
        Mark each activity as Done or Didn&apos;t do for your daily report.
      </p>
      <ul className={styles.list}>
        {activities.map((a) => (
          <li key={a.id} className={styles.item}>
            <span className={styles.name}>{a.name}</span>
            <span className={styles.category}>{getCategoryName(a.categoryId)}</span>
            <div className={styles.buttons}>
              <button
                type="button"
                onClick={() => toggleCompleted(a.id)}
                className={`${styles.btn} ${completedIds.has(a.id) ? styles.btnDone : ''}`}
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => toggleMissed(a.id)}
                className={`${styles.btn} ${missedIds.has(a.id) ? styles.btnMissed : ''}`}
              >
                Didn&apos;t do
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.notes}>
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any reflections on the day..."
          className={styles.textarea}
          rows={3}
        />
      </div>
      <button type="submit" className={styles.submitBtn}>
        Save Report
      </button>
    </form>
  );
}
