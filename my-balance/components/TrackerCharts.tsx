import { useMemo } from 'react';
import styles from '../styles/TrackerCharts.module.css';

export interface CategoryStats {
  categoryId: string;
  categoryName: string;
  color: string;
  completed: number;
  missed: number;
  total: number;
  completionRate: number;
}

interface TrackerChartsProps {
  stats: CategoryStats[];
  daysConsidered: number;
}

export default function TrackerCharts({ stats, daysConsidered }: TrackerChartsProps) {
  const needsImprovement = useMemo(
    () => stats.filter((s) => s.total > 0 && s.completionRate < 70),
    [stats]
  );

  const maxTotal = useMemo(
    () => Math.max(...stats.map((s) => s.total), 1),
    [stats]
  );

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <p>Based on {daysConsidered} day{daysConsidered !== 1 ? 's' : ''} of reports.</p>
      </div>

      {stats.length === 0 ? (
        <div className={styles.empty}>
          No report data yet. Complete daily reports to see your tracker.
        </div>
      ) : (
        <>
          <div className={styles.chartWrapper}>
            <h3>Completion by Category</h3>
            <div className={styles.barChart}>
              {stats.map((s) => (
                <div key={s.categoryId} className={styles.barRow}>
                  <span className={styles.barLabel}>{s.categoryName}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barSegment}
                      style={{
                        width: `${(s.completed / maxTotal) * 100}%`,
                        backgroundColor: '#22c55e',
                      }}
                      title={`${s.completed} done`}
                    />
                    <div
                      className={styles.barSegment}
                      style={{
                        width: `${(s.missed / maxTotal) * 100}%`,
                        backgroundColor: '#ef4444',
                      }}
                      title={`${s.missed} missed`}
                    />
                  </div>
                  <span className={styles.barLegend}>
                    {s.completed}/{s.total}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.chartLegend}>
              <span className={styles.legendItem} style={{ color: '#22c55e' }}>Done</span>
              <span className={styles.legendItem} style={{ color: '#ef4444' }}>Missed</span>
            </div>
          </div>

          <div className={styles.progressList}>
            {stats.map((s) => (
              <div key={s.categoryId} className={styles.progressItem}>
                <div className={styles.progressHeader}>
                  <span
                    className={styles.dot}
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.categoryName}</span>
                  <span className={styles.rate}>
                    {s.total > 0 ? `${Math.round(s.completionRate)}%` : '-'}
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${s.completionRate}%`,
                      backgroundColor: s.color,
                    }}
                  />
                </div>
                <span className={styles.counts}>
                  {s.completed} done, {s.missed} missed
                </span>
              </div>
            ))}
          </div>

          {needsImprovement.length > 0 && (
            <div className={styles.improve}>
              <h3>Where to Improve</h3>
              <p>Categories with completion below 70%:</p>
              <ul>
                {needsImprovement.map((s) => (
                  <li key={s.categoryId}>
                    <strong>{s.categoryName}</strong> – {Math.round(s.completionRate)}% completion
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
