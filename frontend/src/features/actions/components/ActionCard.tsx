import { formatDateTime } from '@/shared/lib/formatDate';
import { Icon } from '@/shared/ui';
import { ACTION_STATUS_LABELS, CATEGORY_ICONS, CATEGORY_LABELS } from '../labels';
import type { Action } from '../types';
import styles from './ActionCard.module.css';

type ActionCardProps = {
  action: Action;
  selected: boolean;
  onSelect: (id: string) => void;
};

/** Carte de la liste (DESIGN.md §6 « Action card ») : un bouton à bascule, miroir du pin sur la carte. */
export function ActionCard({ action, selected, onSelect }: ActionCardProps) {
  const category = action.category;
  return (
    <button
      type="button"
      className={[styles.card, selected && styles.selected].filter(Boolean).join(' ')}
      aria-pressed={selected}
      onClick={() => onSelect(action.action_id)}
    >
      <span className={styles.top}>
        <span className={[styles.tag, styles[category.toLowerCase()]].join(' ')}>
          <Icon name={CATEGORY_ICONS[category]} size={14} />
          {CATEGORY_LABELS[category]}
        </span>
        <span className={styles.status}>{ACTION_STATUS_LABELS[action.status]}</span>
      </span>
      <span className={styles.title}>{action.title}</span>
      <span className={styles.meta}>{formatDateTime(action.scheduled_at)}</span>
      <span className={styles.description}>{action.description}</span>
    </button>
  );
}
