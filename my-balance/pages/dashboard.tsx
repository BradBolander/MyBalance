import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { generateId, type Day, type DayActivity, type RecurringBlock } from '../lib/schema';
import DayCalendarSection from '../components/DayCalendarSection';
import styles from '../styles/Dashboard.module.css';

function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultAllocations(): Promise<Record<string, number>> {
  return db.settings.get('defaultAllocations').then((stored) => {
    if (stored?.allocations) return stored.allocations;
    const result: Record<string, number> = {};
    let remainder = 100;
    DEFAULT_CATEGORIES.forEach((c, i) => {
      const v = i === DEFAULT_CATEGORIES.length - 1 ? remainder : Math.floor(100 / DEFAULT_CATEGORIES.length);
      result[c.id] = v;
      remainder -= v;
    });
    return result;
  }).catch(() => ({}));
}

function getCategoryColor(categoryId: string): string {
  return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.color ?? '#94a3b8';
}

function getDayOfWeek(dateStr: string): 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' {
  const d = new Date(dateStr + 'T12:00:00');
  const days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[d.getDay()];
}

function getTodayRecurringBlocks(blocks: RecurringBlock[]): { block: RecurringBlock; startTime: string; endTime: string }[] {
  const today = getTodayDateStr();
  const dow = getDayOfWeek(today);
  return blocks
    .map((b) => {
      const config = b.dayConfig[dow];
      if (!config) return null;
      return { block: b, startTime: config.startTime, endTime: config.endTime };
    })
    .filter(Boolean) as { block: RecurringBlock; startTime: string; endTime: string }[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [day, setDay] = useState<Day | null>(null);
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDay();
    loadRecurringBlocks();
  }, []);

  const loadRecurringBlocks = async () => {
    try {
      const all = await db.recurringBlocks.toArray();
      setRecurringBlocks(all);
    } catch (e) {
      console.error('Failed to load recurring blocks:', e);
    }
  };

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadDay();
        loadRecurringBlocks();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const onRouteChange = (url: string) => {
      if (url === '/dashboard' || url.startsWith('/dashboard?')) {
        loadDay();
        loadRecurringBlocks();
      }
    };
    router.events.on('routeChangeComplete', onRouteChange);
    return () => router.events.off('routeChangeComplete', onRouteChange);
  }, [router.events]);

  const loadDay = async () => {
    const today = getTodayDateStr();
    setLoading(true);
    const existing = await db.days.where('date').equals(today).first();
    if (existing) {
      setDay(existing);
    } else {
      const allocations = await getDefaultAllocations();
      setDay({
        id: generateId(),
        date: today,
        allocations,
        activities: [],
        createdAt: Date.now(),
      });
    }
    setLoading(false);
  };

  const saveDay = async (updates: Partial<Day>) => {
    const today = getTodayDateStr();
    if (!day) return;
    setSaving(true);
    const dayRecord: Day = {
      ...day,
      ...updates,
      activities: updates.activities ?? day.activities,
    };
    await db.days.put(dayRecord);
    setDay(dayRecord);
    setSaving(false);
  };

  const markComplete = async (id: string) => {
    const activities = (day?.activities ?? []).map((a) =>
      a.id === id ? { ...a, completed: true, missed: false } : a
    );
    await saveDay({ activities });
    await syncReport(activities);
  };

  const markMissed = async (id: string) => {
    const activities = (day?.activities ?? []).map((a) =>
      a.id === id ? { ...a, completed: false, missed: true } : a
    );
    await saveDay({ activities });
    await syncReport(activities);
  };

  const syncReport = async (activities: DayActivity[]) => {
    const today = getTodayDateStr();
    const completedIds = activities.filter((a) => a.completed).map((a) => a.id);
    const missedIds = activities.filter((a) => a.missed).map((a) => a.id);
    const existing = await db.reports.where('date').equals(today).first();
    await db.reports.put({
      date: today,
      completedIds,
      missedIds,
      notes: existing?.notes,
      createdAt: existing?.createdAt ?? Date.now(),
    });
  };

  const activities = day?.activities ?? [];
  const completed = activities.filter((a) => a.completed);
  const missed = activities.filter((a) => a.missed);
  const upcomingActivities = activities.filter((a) => !a.completed && !a.missed);
  const todayRecurring = getTodayRecurringBlocks(recurringBlocks);

  type UpcomingItem =
    | { type: 'activity'; data: DayActivity }
    | { type: 'recurring'; data: { block: RecurringBlock; startTime: string; endTime: string } };

  const upcoming: UpcomingItem[] = [
    ...upcomingActivities.map((a) => ({ type: 'activity' as const, data: a })),
    ...todayRecurring.map((r) => ({ type: 'recurring' as const, data: r })),
  ].sort((a, b) => {
    const startA = a.type === 'activity' ? a.data.startTime : a.data.startTime;
    const startB = b.type === 'activity' ? b.data.startTime : b.data.startTime;
    return timeToMinutes(startA) - timeToMinutes(startB);
  });

  const displayDate = day?.date
    ? new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - My Balance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Today&apos;s Plan</h1>
        <p className={styles.subtitle}>{displayDate}</p>

        <div className={styles.dashboardGrid}>
          <div className={styles.dashboardLeft}>
            <DayCalendarSection
              blocks={recurringBlocks}
              dateStr={getTodayDateStr()}
              hideHeader
            />
          </div>
          <div className={styles.dashboardRight}>
        {activities.length === 0 && todayRecurring.length === 0 ? (
          <div className={styles.empty}>
            <p>No activities planned for today.</p>
            <Link href={`/day/${getTodayDateStr()}`} className={styles.link}>
              Plan your day →
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Upcoming</h2>
                <ul className={styles.list}>
                  {upcoming.map((item) =>
                    item.type === 'activity' ? (
                      <ActivityItem
                        key={`act-${item.data.id}`}
                        activity={item.data}
                        onComplete={markComplete}
                        onMissed={markMissed}
                        saving={saving}
                      />
                    ) : (
                      <RecurringBlockItem key={`rec-${item.data.block.id}`} item={item.data} />
                    )
                  )}
                </ul>
              </section>
            )}

            {completed.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Done</h2>
                <ul className={styles.list}>
                  {completed.map((a) => (
                    <ActivityItem
                      key={a.id}
                      activity={a}
                      onComplete={markComplete}
                      onMissed={markMissed}
                      saving={saving}
                      isCompleted
                    />
                  ))}
                </ul>
              </section>
            )}

            {missed.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Missed</h2>
                <ul className={styles.list}>
                  {missed.map((a) => (
                    <ActivityItem
                      key={a.id}
                      activity={a}
                      onComplete={markComplete}
                      onMissed={markMissed}
                      saving={saving}
                      isMissed
                    />
                  ))}
                </ul>
              </section>
            )}

            <Link href={`/day/${getTodayDateStr()}`} className={styles.editLink}>
              Edit plan →
            </Link>
          </>
        )}
          </div>
        </div>
      </main>
    </div>
  );
};

function RecurringBlockItem({ item }: { item: { block: RecurringBlock; startTime: string; endTime: string } }) {
  return (
    <li className={styles.item}>
      <div className={styles.itemMain}>
        <span className={styles.time}>
          {item.startTime} – {item.endTime}
        </span>
        <span className={styles.name}>{item.block.name}</span>
        <span
          className={styles.badge}
          style={{ backgroundColor: item.block.color ?? 'var(--accent)' }}
        >
          Recurring
        </span>
      </div>
    </li>
  );
}

function ActivityItem({
  activity,
  onComplete,
  onMissed,
  saving,
  isCompleted,
  isMissed,
}: {
  activity: DayActivity;
  onComplete: (id: string) => void;
  onMissed: (id: string) => void;
  saving: boolean;
  isCompleted?: boolean;
  isMissed?: boolean;
}) {
  return (
    <li
      className={`${styles.item} ${isCompleted ? styles.completed : ''} ${isMissed ? styles.missed : ''}`}
    >
      <div className={styles.itemMain}>
        <span className={styles.time}>
          {activity.startTime} – {activity.endTime}
        </span>
        <span className={styles.name}>{activity.name}</span>
        <span
          className={styles.badge}
          style={{ backgroundColor: getCategoryColor(activity.categoryId) }}
        >
          {DEFAULT_CATEGORIES.find((c) => c.id === activity.categoryId)?.name ?? activity.categoryId}
        </span>
      </div>
      {!isCompleted && !isMissed && (
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => onComplete(activity.id)}
            disabled={saving}
            className={styles.btnComplete}
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => onMissed(activity.id)}
            disabled={saving}
            className={styles.btnMissed}
          >
            Missed
          </button>
        </div>
      )}
      {(isCompleted || isMissed) && (
        <button
          type="button"
          onClick={() => (isCompleted ? onMissed(activity.id) : onComplete(activity.id))}
          disabled={saving}
          className={styles.btnUndo}
        >
          Undo
        </button>
      )}
    </li>
  );
}

export default Dashboard;
