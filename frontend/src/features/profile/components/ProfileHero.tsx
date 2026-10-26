import type { ReactNode } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { Avatar, Icon, NeighbourhoodPlan, type IconName } from '@/shared/ui';
import { PROFILE_LABELS } from '../labels';
import type { ProfileVisibility } from '../types';
import styles from './ProfileHero.module.css';

export type ProfileStat = { label: string; value: number | null };

type ProfileHeroProps = {
  username: string;
  avatarUrl?: string | null;
  commune?: string | null;
  eyebrow: string;
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

/* Bande du plan montrée dans le bandeau, en unités du plan (≈ mètres), centrée sur l'école 42. */
const COVER_BAND = 240;

/** En-tête du profil : plan du quartier en bandeau, avatar à cheval, pseudo en grand, quartier, présence, actions, chiffres. */
export function ProfileHero({
  username,
  avatarUrl,
  commune,
  eyebrow,
  visibility,
  online,
  actions,
  stats,
}: ProfileHeroProps) {
  const phone = useMediaQuery('(max-width: 760px)');

  return (
    <header className={styles.hero}>
      <div className={styles.cover} aria-hidden="true">
        <NeighbourhoodPlan focusHeight={COVER_BAND} />
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
