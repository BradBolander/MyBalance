import Dexie, { type Table } from 'dexie';
import type { Activity, Day, DailyReport, RecurringBlock } from './schema';

export interface DefaultAllocations {
  id: string;
  allocations: Record<string, number>;
}

export class MyBalanceDB extends Dexie {
  activities!: Table<Activity, string>;
  days!: Table<Day, string>;
  reports!: Table<DailyReport, string>;
  settings!: Table<DefaultAllocations, string>;
  recurringBlocks!: Table<RecurringBlock, string>;

  constructor() {
    super('MyBalanceDB');
    this.version(2).stores({
      activities: 'id, categoryId, createdAt',
      days: 'id, date, createdAt',
      reports: 'date, createdAt',
      settings: 'id',
    });
    this.version(3).stores({
      activities: 'id, categoryId, createdAt',
      days: 'id, date, createdAt',
      reports: 'date, createdAt',
      settings: 'id',
      recurringBlocks: 'id, createdAt',
    });
  }
}

// Only instantiate in browser - IndexedDB doesn't exist in Node/SSR
const db =
  typeof window !== 'undefined'
    ? new MyBalanceDB()
    : (null as unknown as MyBalanceDB);

export { db };
