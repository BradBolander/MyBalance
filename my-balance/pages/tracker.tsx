import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import TrackerCharts, { type CategoryStats } from '../components/TrackerCharts';
import styles from '../styles/Tracker.module.css';

const Tracker: NextPage = () => {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [daysConsidered, setDaysConsidered] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const reports = await db.reports.toArray();
    const days = await db.days.toArray();
    const dayByDate = new Map(days.map((d) => [d.date, d]));

    const categoryCounts: Record<
      string,
      { completed: number; missed: number }
    > = {};
    DEFAULT_CATEGORIES.forEach((c) => {
      categoryCounts[c.id] = { completed: 0, missed: 0 };
    });

    for (const report of reports) {
      const day = dayByDate.get(report.date);
      if (!day?.activities?.length) continue;

      const activityToCategory = new Map(
        day.activities.map((a) => [a.id, a.categoryId])
      );

      for (const id of report.completedIds) {
        const catId = activityToCategory.get(id);
        if (catId && categoryCounts[catId]) {
          categoryCounts[catId].completed += 1;
        }
      }
      for (const id of report.missedIds) {
        const catId = activityToCategory.get(id);
        if (catId && categoryCounts[catId]) {
          categoryCounts[catId].missed += 1;
        }
      }
    }

    const result: CategoryStats[] = DEFAULT_CATEGORIES.map((c) => {
      const { completed, missed } = categoryCounts[c.id];
      const total = completed + missed;
      return {
        categoryId: c.id,
        categoryName: c.name,
        color: c.color,
        completed,
        missed,
        total,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    });

    setStats(result);
    setDaysConsidered(reports.length);
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Tracker - My Balance</title>
        <meta name="description" content="Your cumulative activity tracker" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Cumulative Tracker</h1>
        <p className={styles.subtitle}>
          See where you&apos;re doing well and where to improve.
        </p>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <TrackerCharts stats={stats} daysConsidered={daysConsidered} />
        )}
      </main>
    </div>
  );
};

export default Tracker;
