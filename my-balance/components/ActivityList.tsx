import type { DayActivity } from '../lib/schema';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import styles from '../styles/ActivityList.module.css';

interface ActivityListProps {
  activities: DayActivity[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onRemove?: (id: string) => void;
  onUpdateTime?: (id: string, startTime: string, endTime: string) => void;
}

function getCategoryColor(categoryId: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.color ?? '#94a3b8';
}

export default function ActivityList({
  activities,
  onToggleComplete,
  onRemove,
  onUpdateTime,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className={styles.empty}>
        No activities yet. Add some from the activity bank or use suggestions.
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {activities.map((a) => (
        <li
          key={a.id}
          className={`${styles.item} ${a.completed ? styles.completed : ''}`}
        >
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={a.completed}
              onChange={(e) => onToggleComplete(a.id, e.target.checked)}
              className={styles.checkbox}
            />
            <span className={styles.name}>{a.name}</span>
          </label>
          <span
            className={styles.badge}
            style={{ backgroundColor: getCategoryColor(a.categoryId) }}
          >
            {DEFAULT_CATEGORIES.find((c) => c.id === a.categoryId)?.name ?? a.categoryId}
          </span>
          {onUpdateTime ? (
            <span className={styles.timeInputs}>
              <input
                type="time"
                value={a.startTime}
                onChange={(e) => onUpdateTime(a.id, e.target.value, a.endTime)}
                className={styles.timeInput}
              />
              <span className={styles.timeSeparator}>–</span>
              <input
                type="time"
                value={a.endTime}
                onChange={(e) => onUpdateTime(a.id, a.startTime, e.target.value)}
                className={styles.timeInput}
              />
            </span>
          ) : (
            <span className={styles.time}>
              {a.startTime} – {a.endTime}
            </span>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(a.id)}
              className={styles.removeBtn}
              title="Remove"
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
