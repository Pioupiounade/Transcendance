import { ButtonLink, Icon } from '@/shared/ui';
import { formatDateTime } from '@/shared/lib/formatDate';
import { ACTIONS_LABELS, ACTION_STATUS_LABELS, CATEGORY_ICONS, CATEGORY_LABELS } from '../labels';
import { ACTION_STATUS, type Action } from '../types';
import styles from './ActionCard.module.css';

type ActionCardProps = {
  action: Action;
  selected: boolean;
  onSelect: (id: string) => void;
  /** Distance déjà formatée (« 350 m ») : remplace le statut en haut à droite. */
  distance?: string;
  /** Chemin de la page de modification : présent = l'utilisateur peut gérer cette action. */
  editTo?: string;
};

const text = ACTIONS_LABELS.card;

const seatsLabel = (action: Action): string => {
  if (action.remaining_seats === null) return text.openToAll;
  if (action.remaining_seats === 0) return text.full;
  return text.seatsLeft(action.remaining_seats);
};

/**
 * Carte de la liste (refonte) : un bandeau pastel teinté par la catégorie tient lieu de photo, la catégorie et le
 * statut (ou la distance) en pilules dessus, puis titre, date, description et le pied. Un bouton à bascule, miroir
 * du pin sur la carte. Une action en attente de modération le dit sur sa pilule de statut (hachurée).
 */
export function ActionCard({ action, selected, onSelect, distance, editTo }: ActionCardProps) {
  const category = action.category;
  const pending = action.status === ACTION_STATUS.PENDING;
  return (
    <article className={[styles.card, selected && styles.selected].filter(Boolean).join(' ')}>
      <button type="button" className={styles.body} aria-pressed={selected} onClick={() => onSelect(action.action_id)}>
        <span className={[styles.cover, styles[category.toLowerCase()]].join(' ')}>
          <span className={styles.tag}>
            <Icon name={CATEGORY_ICONS[category]} size={14} />
            {CATEGORY_LABELS[category]}
          </span>
          <span className={[styles.status, pending && !distance && styles.pendingStatus].filter(Boolean).join(' ')}>
            {distance ?? ACTION_STATUS_LABELS[action.status]}
          </span>
          <Icon name={CATEGORY_ICONS[category]} size={64} strokeWidth={1.1} className={styles.coverIcon} />
        </span>
        <span className={styles.content}>
          <span className={styles.title}>{action.title}</span>
          <span className={styles.meta}>
            <Icon name="calendar" size={14} />
            {formatDateTime(action.scheduled_at)}
          </span>
          <span className={styles.description}>{action.description}</span>
          <span className={styles.bottom}>
            <span className={styles.people}>
              <Icon name="users" size={15} />
              {text.neighbours(action.participant_count)}
            </span>
            <span className={[styles.seats, action.remaining_seats === 0 && styles.seatsFull].filter(Boolean).join(' ')}>
              {seatsLabel(action)}
            </span>
            <span className={styles.go} aria-hidden="true">
              <Icon name="arrow" size={16} strokeWidth={2.2} />
            </span>
          </span>
        </span>
      </button>
      {editTo && (
        <ButtonLink to={editTo} variant="secondary" className={styles.edit} aria-label={`${ACTIONS_LABELS.edit.link}: ${action.title}`}>
          {ACTIONS_LABELS.edit.link}
        </ButtonLink>
      )}
    </article>
  );
}
