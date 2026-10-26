import type { ReactNode } from 'react';
import { PROFILE_LABELS } from '../labels';
import type { InterestCategory, ProfileActivity, UserProfile } from '../types';
import { AboutPanel } from './AboutPanel';
import { ActivityPanel } from './ActivityPanel';
import { InterestsPanel } from './InterestsPanel';
import { ProfileHero, type ProfileStat } from './ProfileHero';
import styles from './ProfileView.module.css';

const STAT_LABELS = PROFILE_LABELS.stats;

type Loadable<T> = { data: T | null; loading: boolean; error: string | null };

type ProfileViewProps = {
  profile: UserProfile;
  eyebrow: string;
  /** Mon profil : visibilité affichée, textes d'invitation, chiffres et activité. */
  own: boolean;
  interests: Loadable<readonly InterestCategory[]>;
  /** Mon profil seulement : l'API ne donne pas l'activité des autres. */
  activity?: Loadable<ProfileActivity> & { organizationPath: (id: string) => string; actionPath: (id: string) => string };
  /** Profil d'un voisin : présence en ligne. */
  online?: boolean;
  actions?: ReactNode;
};

/** La fiche : en-tête, puis « About » et intérêts à gauche, activité à droite (ou côte à côte sans activité). */
export function ProfileView({ profile, eyebrow, own, interests, activity, online, actions }: ProfileViewProps) {
  const stats: readonly ProfileStat[] | undefined = activity
    ? [
        { label: STAT_LABELS.points, value: activity.data?.points ?? null },
        { label: STAT_LABELS.organizations, value: activity.data?.organizations.length ?? null },
        { label: STAT_LABELS.actions, value: activity.data?.participations.length ?? null },
      ]
    : undefined;

  return (
    <>
      <ProfileHero
        username={profile.username}
        avatarUrl={profile.profilePicture}
        commune={profile.commune}
        eyebrow={eyebrow}
        visibility={own ? profile.visibility : undefined}
        online={online}
        actions={actions}
        stats={stats}
      />
      <div className={activity ? styles.body : styles.bodySolo}>
        <div className={styles.column}>
          <AboutPanel description={profile.description} own={own} />
          <InterestsPanel interests={interests.data} loading={interests.loading} error={interests.error} own={own} />
        </div>
        {activity && (
          <ActivityPanel
            activity={activity.data}
            loading={activity.loading}
            error={activity.error}
            organizationPath={activity.organizationPath}
            actionPath={activity.actionPath}
          />
        )}
      </div>
    </>
  );
}
