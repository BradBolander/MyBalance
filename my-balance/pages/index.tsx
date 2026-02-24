import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import styles from '../styles/Home.module.css';

function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

const Home: NextPage = () => {
  useEffect(() => {
    window.location.replace('/dashboard');
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>My Balance</title>
        <meta name="description" content="Track your daily activities and balance" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>My Balance</h1>
        <p className={styles.redirect}>Redirecting to today...</p>
        <Link href="/dashboard">
          <a className={styles.link}>Go to dashboard</a>
        </Link>
      </main>
    </div>
  );
};

export default Home;
