import { db } from '../lib/db';
import type { Activity } from '../lib/schema';
import { DEFAULT_CATEGORIES } from '../lib/categories';
import styles from '../styles/SuggestionButton.module.css';

interface SuggestionButtonProps {
  categoryId: string;
  onSuggest: (activity: Activity | null) => void;
  disabled?: boolean;
}

export default function SuggestionButton({
  categoryId,
  onSuggest,
  disabled,
}: SuggestionButtonProps) {
  const categoryName =
    DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.name ?? categoryId;

  const handleClick = async () => {
    const activities = await db.activities
      .where('categoryId')
      .equals(categoryId)
      .toArray();
    if (activities.length === 0) {
      onSuggest(null);
      return;
    }
    const random = activities[Math.floor(Math.random() * activities.length)];
    onSuggest(random);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={styles.btn}
      title={`Suggest an activity for ${categoryName}`}
    >
      Suggest {categoryName}
    </button>
  );
}
