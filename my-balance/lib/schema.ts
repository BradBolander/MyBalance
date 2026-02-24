// Types for My Balance

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Activity {
  id: string;
  name: string;
  categoryId: string;
  createdAt: number;
}

export interface DayActivity {
  id: string;
  activityId: string;
  name: string;
  categoryId: string;
  startTime: string; // ISO time or "HH:mm"
  endTime: string;
  completed: boolean;
  missed?: boolean;
}

export interface Day {
  id: string;
  date: string; // YYYY-MM-DD
  allocations: Record<string, number>; // categoryId -> percentage (0-100)
  activities: DayActivity[];
  createdAt: number;
}

export interface DailyReport {
  date: string; // YYYY-MM-DD
  completedIds: string[];
  missedIds: string[];
  notes?: string;
  createdAt: number;
}

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayBlockConfig {
  startTime: string; // HH:mm
  endTime: string;
}

export interface RecurringBlock {
  id: string;
  name: string;
  color?: string;
  dayConfig: Partial<Record<DayOfWeek, DayBlockConfig | null>>; // null = not applicable that day
  createdAt: number;
}
