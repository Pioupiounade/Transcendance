import type { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { Avatar, Icon, type IconName } from '@/shared/ui';
import { INTEREST_FAMILY_ICONS, type InterestFamily } from '../interestLabels';
import { PROFILE_LABELS } from '../labels';
import type { ProfileVisibility } from '../types';
import styles from './ProfileHero.module.css';

export type ProfileStat = { label: string; value: number | null };

type ProfileHeroProps = {
  username: string;
  avatarUrl?: string | null;
  commune?: string | null;
  eyebrow: string;
  /** Teinte du bandeau : la famille d'intérêts dominante. */
  family: InterestFamily;
  /** Mon profil : la visibilité choisie, en pastille. */
  visibility?: ProfileVisibility;
  /** Profil d'un voisin : présence en ligne (socket #164). */
  online?: boolean;
  /** Boutons à droite (modifier, amitié, message). */
  actions?: ReactNode;
  /** Mon profil : points, organisations, actions. */
  stats?: readonly ProfileStat[];
};

const VISIBILITY_ICONS: Record<ProfileVisibility, IconName> = {
  PUBLIC: 'users',
  FRIENDS_ONLY: 'heart',
  PRIVATE: 'lock',
};

const text = PROFILE_LABELS.hero;

/** En-tête du profil : bandeau pastel, avatar à cheval, pseudo en grand, quartier et présence, actions, chiffres. */
export function ProfileHero({
  username,
  avatarUrl,
  commune,
  eyebrow,
  family,
  visibility,
  online,
  actions,
  stats,
}: ProfileHeroProps) {
  const phone = useMediaQuery('(max-width: 760px)');

  return (
    <header className={[styles.hero, styles[family]].join(' ')}>
      <div className={styles.cover} aria-hidden="true">
        <Icon name={INTEREST_FAMILY_ICONS[family]} size={170} strokeWidth={1.1} className={styles.watermark} />
      </div>

      <div className={styles.identity}>
        <Avatar name={username} src={avatarUrl} size={phone ? 88 : 112} className={styles.avatar} />
        <div className={styles.headText}>
          <p className={styles.eyebrow}>
            {eyebrow}
            {visibility && (
              <span className={styles.visibility}>
                <Icon name={VISIBILITY_ICONS[visibility]} size={13} strokeWidth={2.2} />
                {PROFILE_LABELS.visibility[visibility].label}
              </span>
            )}
          </p>
          <h1 className={styles.name}>@{username}</h1>
          <p className={styles.meta}>
            <span className={styles.place}>
              <Icon name="pin" size={16} />
              {commune || text.noCommune}
            </span>
            {online !== undefined && (
              <span className={[styles.presence, online && styles.online].filter(Boolean).join(' ')}>
                <span className={styles.dot} />
                {online ? text.online : text.offline}
              </span>
            )}
          </p>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      {stats && (
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt>{stat.label}</dt>
              <dd>{stat.value ?? '–'}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
