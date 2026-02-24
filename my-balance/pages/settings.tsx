import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import { generateId, type Activity, type RecurringBlock } from '../lib/schema';
import DayCalendarSection from '../components/DayCalendarSection';
import RecurringBlocksSection from '../components/RecurringBlocksSection';
import styles from '../styles/Settings.module.css';

function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const Settings: NextPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recurringBlocks, setRecurringBlocks] = useState<RecurringBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(DEFAULT_CATEGORIES[0]?.id ?? '');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set(DEFAULT_CATEGORIES.map((c) => c.id))
  );

  useEffect(() => {
    loadActivities();
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

  const loadActivities = async () => {
    setLoading(true);
    const all = await db.activities.toArray();
    setActivities(all);
    setLoading(false);
  };

  const addActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const activity: Activity = {
      id: generateId(),
      name: newName.trim(),
      categoryId: newCategoryId,
      createdAt: Date.now(),
    };
    await db.activities.add(activity);
    setActivities((prev) => [...prev, activity]);
    setNewName('');
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    await db.activities.update(id, updates);
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    setEditingId(null);
  };

  const deleteActivity = async (id: string) => {
    await db.activities.delete(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const activitiesByCategory = DEFAULT_CATEGORIES.map((cat) => ({
    ...cat,
    activities: activities.filter((a) => a.categoryId === cat.id),
  }));

  return (
    <div className={styles.container}>
      <Head>
        <title>Activity Bank - My Balance</title>
        <meta name="description" content="Manage your activity bank" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <div className={styles.colLeft}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Day Calendar</h2>
            <p className={styles.subtitle}>
              Preview your recurring blocks by day of week.
            </p>
            <DayCalendarSection
              blocks={recurringBlocks}
              dateStr={getTodayDateStr()}
              hideHeader
            />
          </section>
        </div>
        <div className={styles.colRight}>
        <section className={styles.section}>
          <RecurringBlocksSection
            blocks={recurringBlocks}
            onBlocksChange={saveRecurringBlocks}
          />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Activity Bank</h2>
          <p className={styles.subtitle}>
            Add activities to each category. The app will suggest from these when you plan your day.
          </p>

        <form onSubmit={addActivity} className={styles.addForm}>
          <input
            type="text"
            placeholder="Activity name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={styles.input}
          />
          <select
            value={newCategoryId}
            onChange={(e) => setNewCategoryId(e.target.value)}
            className={styles.select}
          >
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.btn}>
            Add
          </button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className={styles.categoryList}>
            {activitiesByCategory.map(({ id, name, color, activities: catActivities }) => (
              <div key={id} className={styles.categoryCard}>
                <button
                  className={styles.categoryHeader}
                  onClick={() =>
                    setExpandedCategories((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                  style={{ borderLeftColor: color }}
                >
                  <span>{name}</span>
                  <span className={styles.count}>{catActivities.length}</span>
                </button>
                {expandedCategories.has(id) && (
                  <ul className={styles.activityList}>
                    {catActivities.length === 0 ? (
                      <li className={styles.empty}>No activities yet</li>
                    ) : (
                      catActivities.map((a) => (
                        <li key={a.id} className={styles.activityItem}>
                          {editingId === a.id ? (
                            <input
                              type="text"
                              defaultValue={a.name}
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                if (v) updateActivity(a.id, { name: v });
                                setEditingId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const v = (e.target as HTMLInputElement).value.trim();
                                  if (v) updateActivity(a.id, { name: v });
                                  setEditingId(null);
                                }
                              }}
                              autoFocus
                              className={styles.editInput}
                            />
                          ) : (
                            <>
                              <span>{a.name}</span>
                              <div className={styles.actions}>
                                <button
                                  onClick={() => setEditingId(a.id)}
                                  className={styles.btnSmall}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteActivity(a.id)}
                                  className={styles.btnSmallDanger}
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        </section>
        </div>
      </main>
    </div>
  );
};

export default Settings;
