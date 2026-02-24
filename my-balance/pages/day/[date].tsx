import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { DEFAULT_CATEGORIES } from '../../lib/categories';
import { generateId, type Day, type DayActivity, type Activity, type RecurringBlock } from '../../lib/schema';
import ActivityList from '../../components/ActivityList';
import DayCalendarSection from '../../components/DayCalendarSection';
import styles from '../../styles/Day.module.css';

function formatDateForUrl(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function getNextStartTime(activities: DayActivity[]): string {
  if (activities.length === 0) return '08:00';
  return activities[activities.length - 1].endTime;
}

const DayPage: NextPage = () => {
  const router = useRouter();
  const dateStr = router.query.date as string | undefined;
  const [day, setDay] = useState<Day | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualDuration, setManualDuration] = useState(60);
  const [bankActivities, setBankActivities] = useState<Activity[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedSuggestCategoryId, setSelectedSuggestCategoryId] = useState<string>('');
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);

  useEffect(() => {
    if (!dateStr) return;
    loadDay(dateStr);
  }, [dateStr]);

  useEffect(() => {
    loadBankActivities();
  }, [dateStr]);

  useEffect(() => {
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

  const saveRecurringBlocks = async (blocks: RecurringBlock[]) => {
    setRecurringBlocks(blocks);
    await db.recurringBlocks.clear();
    if (blocks.length > 0) {
      await db.recurringBlocks.bulkPut(blocks);
    }
  };

  const loadBankActivities = async () => {
    try {
      const all = await db.activities.toArray();
      setBankActivities(all);
    } catch (e) {
      console.error('Failed to load activity bank:', e);
    }
  };

  const loadDay = async (date: string) => {
    setLoading(true);
    const existing = await db.days.where('date').equals(date).first();
    if (existing) {
      setDay(existing);
    } else {
      const defaultAllocations = await getDefaultAllocations();
      setDay({
        id: generateId(),
        date,
        allocations: defaultAllocations,
        activities: [],
        createdAt: Date.now(),
      });
    }
    setLoading(false);
  };

  const getDefaultAllocations = async (): Promise<Record<string, number>> => {
    try {
      const stored = await db.settings.get('defaultAllocations');
      if (stored?.allocations) return stored.allocations;
    } catch (_) {}
    const result: Record<string, number> = {};
    let remainder = 100;
    DEFAULT_CATEGORIES.forEach((c, i) => {
      const v = i === DEFAULT_CATEGORIES.length - 1 ? remainder : Math.floor(100 / DEFAULT_CATEGORIES.length);
      result[c.id] = v;
      remainder -= v;
    });
    return result;
  };

  const activities = day?.activities ?? [];

  const saveDay = async (updates: Partial<Day>) => {
    if (!dateStr) return;
    setSaving(true);
    const dayRecord: Day = {
      id: day?.id ?? generateId(),
      date: dateStr,
      allocations: updates.allocations ?? day?.allocations ?? {},
      activities: updates.activities ?? activities,
      createdAt: day?.createdAt ?? Date.now(),
    };
    await db.days.put(dayRecord);
    setDay(dayRecord);
    setSaving(false);
  };

  const addActivityFromBank = (activity: Activity) => {
    const startTime = getNextStartTime(activities);
    const duration = manualDuration;
    const endTime = addMinutesToTime(startTime, duration);
    const dayActivity: DayActivity = {
      id: generateId(),
      activityId: activity.id,
      name: activity.name,
      categoryId: activity.categoryId,
      startTime,
      endTime,
      completed: false,
    };
    const newActivities = [...activities, dayActivity];
    saveDay({ activities: newActivities });
    setSelectedBankId('');
  };

  const addSelectedFromBank = () => {
    const activity = bankActivities.find((a) => a.id === selectedBankId);
    if (activity) addActivityFromBank(activity);
  };

  const suggestFromCategory = async (categoryId: string) => {
    const activities = await db.activities.where('categoryId').equals(categoryId).toArray();
    if (activities.length > 0) {
      const random = activities[Math.floor(Math.random() * activities.length)];
      addActivityFromBank(random);
    }
    setSelectedSuggestCategoryId('');
  };

  const toggleComplete = async (id: string, completed: boolean) => {
    const newActivities = activities.map((a) =>
      a.id === id ? { ...a, completed } : a
    );
    await saveDay({ activities: newActivities });
  };

  const removeActivity = async (id: string) => {
    const newActivities = activities.filter((a) => a.id !== id);
    await saveDay({ activities: newActivities });
  };

  const updateActivityTime = async (id: string, startTime: string, endTime: string) => {
    const newActivities = activities.map((a) =>
      a.id === id ? { ...a, startTime, endTime } : a
    );
    await saveDay({ activities: newActivities });
  };

  const goToPrevDay = () => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    router.push(`/day/${formatDateForUrl(d)}`);
  };

  const goToNextDay = () => {
    if (!dateStr) return;
    const d = new Date(dateStr);
    d.setDate(d.getDate() + 1);
    router.push(`/day/${formatDateForUrl(d)}`);
  };

  const displayDate = dateStr
    ? new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  if (!dateStr) {
    return (
      <div className={styles.container}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container} key={router.asPath}>
      <Head>
        <title>{displayDate} - My Balance</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <div className={styles.dateNav}>
          <button onClick={goToPrevDay} className={styles.navBtn}>
            ← Prev
          </button>
          <h1 className={styles.title}>{displayDate}</h1>
          <button onClick={goToNextDay} className={styles.navBtn}>
            Next →
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className={styles.planGrid}>
              <div className={styles.planLeft}>
                <section className={styles.section}>
                  <h2>Day Outline</h2>
                  <p className={styles.hint}>
                    Add activities from your activity bank or get suggestions by category.
                  </p>
                  <div className={styles.rowFields}>
                    <div className={styles.fieldBlock}>
                      <label htmlFor="activity-duration" className={styles.fieldLabel}>Duration (min):</label>
                      <input
                        id="activity-duration"
                        type="number"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(parseInt(e.target.value, 10) || 60)}
                        min={5}
                        step={5}
                        className={styles.inputSmall}
                      />
                    </div>
                    <div className={styles.fieldBlock}>
                      <label className={styles.fieldLabel}>Suggest from category:</label>
                      <div className={styles.suggestRow}>
                        <select
                          value={selectedSuggestCategoryId}
                          onChange={(e) => setSelectedSuggestCategoryId(e.target.value)}
                          className={styles.suggestSelect}
                        >
                          <option value="">Select category...</option>
                          {DEFAULT_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => selectedSuggestCategoryId && suggestFromCategory(selectedSuggestCategoryId)}
                          disabled={!selectedSuggestCategoryId}
                          className={styles.btn}
                        >
                          Suggest
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className={styles.addFromBank}>
                    <label className={styles.fieldLabel}>Add from activity bank:</label>
                    <div className={styles.addFromBankRow}>
                    <select
                      value={selectedBankId}
                      onChange={(e) => setSelectedBankId(e.target.value)}
                      className={styles.bankSelect}
                    >
                      <option value="">
                        {bankActivities.length === 0
                          ? 'No activities yet – add some in Settings'
                          : 'Select an activity...'}
                      </option>
                      {DEFAULT_CATEGORIES.map((cat) => {
                        const catActivities = bankActivities.filter((a) => a.categoryId === cat.id);
                        if (catActivities.length === 0) return null;
                        return (
                          <optgroup key={cat.id} label={cat.name}>
                            {catActivities.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={addSelectedFromBank}
                      disabled={!selectedBankId}
                      className={styles.btn}
                    >
                      Add
                    </button>
                    </div>
                  </div>
                  <ActivityList
                    activities={activities}
                    onToggleComplete={toggleComplete}
                    onRemove={removeActivity}
                    onUpdateTime={updateActivityTime}
                  />
                </section>
              </div>
              <div className={styles.planRight}>
                <DayCalendarSection
                  blocks={recurringBlocks}
                  dateStr={dateStr}
                  onBlocksChange={saveRecurringBlocks}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DayPage;
