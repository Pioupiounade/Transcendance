import { Chip } from '@/shared/ui';
import { ACTIONS_LABELS, CATEGORY_ICONS, CATEGORY_LABELS } from '../labels';
import { CATEGORY, type Category } from '../types';
import styles from './CategoryFilter.module.css';

type CategoryFilterProps = {
  /** `null` = toutes les catégories. */
  value: Category | null;
  onChange: (value: Category | null) => void;
};

const text = ACTIONS_LABELS.map;

export function CategoryFilter({ value, onChange }: CategoryFilterProps) {
  return (
    <div className={styles.filters} role="group" aria-label={text.filters}>
      <Chip pressed={value === null} onClick={() => onChange(null)}>
        {text.filterAll}
      </Chip>
      {Object.values(CATEGORY).map((category) => (
        <Chip
          key={category}
          pressed={value === category}
          icon={CATEGORY_ICONS[category]}
          onClick={() => onChange(category)}
        >
          {CATEGORY_LABELS[category]}
        </Chip>
      ))}
    </div>
  );
}
