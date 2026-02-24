import type { NextPage } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import PieAllocator from '../components/PieAllocator';
import styles from '../styles/Settings.module.css';

const SETTINGS_KEY = 'defaultAllocations';

const Goals: NextPage = () => {
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [savingAllocations, setSavingAllocations] = useState(false);

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    try {
      const stored = await db.settings.get(SETTINGS_KEY);
      if (stored?.allocations) {
        setAllocations(stored.allocations);
      } else {
        const defaultAllocations: Record<string, number> = {};
        let remainder = 100;
        DEFAULT_CATEGORIES.forEach((c, i) => {
          const v = i === DEFAULT_CATEGORIES.length - 1 ? remainder : Math.floor(100 / DEFAULT_CATEGORIES.length);
          defaultAllocations[c.id] = v;
          remainder -= v;
        });
        setAllocations(defaultAllocations);
      }
    } catch (e) {
      console.error('Failed to load allocations:', e);
    }
  };

  const saveAllocations = async () => {
    setSavingAllocations(true);
    await db.settings.put({ id: SETTINGS_KEY, allocations });
    setSavingAllocations(false);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Goals - My Balance</title>
        <meta name="description" content="Set your default day allocation goals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.mainGoals}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Default Day Allocation</h2>
          <p className={styles.subtitle}>
            Set how you typically allocate your day across categories. New days will use these defaults.
          </p>
          <PieAllocator
            allocations={allocations}
            onAllocationsChange={setAllocations}
          />
          <button
            onClick={saveAllocations}
            disabled={savingAllocations}
            className={styles.btn}
          >
            {savingAllocations ? 'Saving...' : 'Save Allocations'}
          </button>
        </section>
      </main>
    </div>
  );
};

export default Goals;
