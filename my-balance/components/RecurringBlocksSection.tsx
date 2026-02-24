import { useState } from 'react';
import type { RecurringBlock, DayOfWeek } from '../lib/schema';
import { generateId } from '../lib/schema';
import { DAYS } from './DayCalendarView';
import styles from '../styles/RecurringBlocksSection.module.css';

const DEFAULT_COLORS = ['#22c55e', '#228B22', '#3b82f6', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899'];

interface RecurringBlocksSectionProps {
  blocks: RecurringBlock[];
  onBlocksChange: (blocks: RecurringBlock[]) => void;
}

export default function RecurringBlocksSection({ blocks, onBlocksChange }: RecurringBlocksSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const addBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const block: RecurringBlock = {
      id: generateId(),
      name: newName.trim(),
      color: DEFAULT_COLORS[blocks.length % DEFAULT_COLORS.length],
      dayConfig: {},
      createdAt: Date.now(),
    };
    onBlocksChange([...blocks, block]);
    setNewName('');
    setExpandedId(block.id);
  };

  const updateBlock = (id: string, updates: Partial<RecurringBlock>) => {
    onBlocksChange(
      blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBlock = (id: string) => {
    onBlocksChange(blocks.filter((b) => b.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const setBlockDayConfig = (id: string, day: DayOfWeek, config: { startTime: string; endTime: string } | null) => {
    onBlocksChange(
      blocks.map((b) => {
        if (b.id !== id) return b;
        const dayConfig = { ...b.dayConfig };
        if (config) dayConfig[day] = config;
        else delete dayConfig[day];
        return { ...b, dayConfig };
      })
    );
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Recurring Blocks</h2>
      <p className={styles.subtitle}>
        Work, sleep, routines that take up parts of your day. Configure per weekday.
      </p>
      <form onSubmit={addBlock} className={styles.addForm}>
        <input
          type="text"
          placeholder="e.g. Work day, Bed time, Morning routine"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.btn}>
          Add
        </button>
      </form>

      <div className={styles.blockList}>
        {blocks.length === 0 ? (
          <p className={styles.empty}>No recurring blocks yet. Add work day, bed time, or routines above.</p>
        ) : (
          blocks.map((block) => (
            <div key={block.id} className={styles.blockCard}>
              <button
                type="button"
                className={styles.blockHeader}
                onClick={() => setExpandedId((id) => (id === block.id ? null : block.id))}
                style={{ borderLeftColor: block.color ?? 'var(--accent)' }}
              >
                <span>{block.name}</span>
                <span className={styles.blockCount}>
                  {Object.keys(block.dayConfig).filter((d) => block.dayConfig[d as DayOfWeek]).length}/7 days
                </span>
              </button>
              {expandedId === block.id && (
                <div className={styles.blockBody}>
                  {DAYS.map(({ key, label }) => {
                    const config = block.dayConfig[key];
                    return (
                      <div key={key} className={styles.dayRow}>
                        <span className={styles.dayLabel}>{label}</span>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            checked={!!config}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBlockDayConfig(block.id, key, { startTime: '09:00', endTime: '17:00' });
                              } else {
                                setBlockDayConfig(block.id, key, null);
                              }
                            }}
                          />
                          <span>On</span>
                        </label>
                        {config && (
                          <>
                            <input
                              type="time"
                              value={config.startTime}
                              onChange={(e) =>
                                setBlockDayConfig(block.id, key, { ...config, startTime: e.target.value })
                              }
                              className={styles.timeInput}
                            />
                            <span className={styles.timeSep}>–</span>
                            <input
                              type="time"
                              value={config.endTime}
                              onChange={(e) =>
                                setBlockDayConfig(block.id, key, { ...config, endTime: e.target.value })
                              }
                              className={styles.timeInput}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                  <div className={styles.blockActions}>
                    <input
                      type="color"
                      value={block.color ?? '#22c55e'}
                      onChange={(e) => updateBlock(block.id, { color: e.target.value })}
                      className={styles.colorInput}
                      title="Color"
                    />
                    <button
                      type="button"
                      onClick={() => deleteBlock(block.id)}
                      className={styles.btnDelete}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
