import { Icon } from '@/shared/ui';
import { INTEREST_FAMILY, INTEREST_FAMILY_ICONS, INTEREST_LABELS } from '../interestLabels';
import type { InterestCategory } from '../types';
import styles from './InterestTag.module.css';

type InterestTagProps = {
  interest: InterestCategory;
  /** Avec `onToggle`, l'étiquette est un bouton à bascule (formulaire) ; sans, une simple étiquette (fiche). */
  onToggle?: (interest: InterestCategory) => void;
  pressed?: boolean;
  disabled?: boolean;
};

/** Étiquette d'intérêt teintée par sa famille (sauge, lavande, citron), comme les tags de catégorie des actions. */
export function InterestTag({ interest, onToggle, pressed = false, disabled = false }: InterestTagProps) {
  const family = INTEREST_FAMILY[interest];
  const className = [styles.tag, styles[family]].join(' ');
  const content = (
    <>
      <Icon name={INTEREST_FAMILY_ICONS[family]} size={16} />
      {INTEREST_LABELS[interest]}
    </>
  );

  if (!onToggle) return <span className={className}>{content}</span>;

  return (
    <button
      type="button"
      className={className}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={() => onToggle(interest)}
    >
      {content}
      {pressed && <Icon name="check" size={14} strokeWidth={2.4} className={styles.check} />}
    </button>
  );
}
