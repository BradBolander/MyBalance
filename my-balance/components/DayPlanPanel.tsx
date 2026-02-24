import type { DayActivity } from '../lib/schema';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import styles from '../styles/DayPlanPanel.module.css';

interface DayPlanPanelProps {
  activities: DayActivity[];
  onUpdateTime?: (id: string, startTime: string, endTime: string) => void;
}

function getCategoryColor(categoryId: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.color ?? '#94a3b8';
}

export default function DayPlanPanel({ activities, onUpdateTime }: DayPlanPanelProps) {
  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>Day Plan</h2>
      <p className={styles.subtitle}>
        Activities populate here as you add them.
      </p>
      {activities.length === 0 ? (
        <div className={styles.empty}>
          <p>No activities yet.</p>
          <p className={styles.hint}>Add activities in the left panel to build your day.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {activities.map((a) => (
            <div
              key={a.id}
              className={`${styles.block} ${a.completed ? styles.completed : ''}`}
              style={{ borderLeftColor: getCategoryColor(a.categoryId) }}
            >
              <div className={styles.time}>
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
                  <>{a.startTime} – {a.endTime}</>
                )}
              </div>
              <div className={styles.name}>{a.name}</div>
              <span
                className={styles.badge}
                style={{ backgroundColor: getCategoryColor(a.categoryId) }}
              >
                {DEFAULT_CATEGORIES.find((c) => c.id === a.categoryId)?.name ?? a.categoryId}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
