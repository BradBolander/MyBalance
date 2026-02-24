import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Nav.module.css';

function getTodayPath(): string {
  return `/day/${new Date().toISOString().slice(0, 10)}`;
}

function ZenLogo({ className }: { className?: string }) {
  const cx = 18;
  const cy = 18;
  const rings = [
    { r: 14, strokeWidth: 2 },
    { r: 10, strokeWidth: 1.5 },
    { r: 6, strokeWidth: 1 },
  ];
  return (
    <svg className={className} viewBox="0 0 36 36" width={36} height={36} preserveAspectRatio="xMidYMid meet" aria-hidden>
      {rings.map(({ r, strokeWidth }, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#228B22"
          strokeWidth={strokeWidth}
        />
      ))}
    </svg>
  );
}

export default function Nav() {
  const router = useRouter();
  const todayPath = getTodayPath();

  const isDayPage = router.asPath.startsWith('/day/');

  return (
    <nav className={styles.nav}>
      <div className={styles.navLeft}>
        <Link href="/dashboard" className={`${styles.logoLink} ${router.asPath === '/dashboard' ? styles.active : ''}`} aria-label="My Balance">
          <span className={styles.logoWrap}>
            <ZenLogo className={styles.logo} />
          </span>
        </Link>
        <Link href="/dashboard" className={router.asPath === '/dashboard' ? styles.active : ''}>
          Dashboard
        </Link>
        <Link href={todayPath} className={isDayPage ? styles.active : ''}>
          Plan
        </Link>
        <Link href="/tracker" className={router.asPath === '/tracker' ? styles.active : ''}>
          Report
        </Link>
        <Link href="/goals" className={router.asPath === '/goals' ? styles.active : ''}>
          Goals
        </Link>
      </div>
      <Link href="/settings" className={router.asPath === '/settings' ? styles.active : ''}>
        Settings
      </Link>
    </nav>
  );
}
