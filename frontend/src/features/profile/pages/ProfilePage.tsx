import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { isApiError } from '@/shared/api';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, Icon, Steps } from '@/shared/ui';
import {
  createProfile,
  deactivateAccount,
  getMyInterests,
  getProfile,
  getProfileActivity,
  removeInterest,
  selectInterest,
  updateProfile,
} from '../api/profileApi';
import { ProfileForm } from '../components/ProfileForm';
import { ProfileSettingsPanel } from '../components/ProfileSettingsPanel';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { ProfileTabs } from '../components/ProfileTabs';
import { ProfileUnavailable } from '../components/ProfileUnavailable';
import { ProfileView } from '../components/ProfileView';
import { toProfileErrorMessage } from '../errors';
import { PROFILE_LABELS } from '../labels';
import { PROFILE_TABS, profilePanelId, profileTabId, type ProfileTabId } from '../profileTabIds';
import type { InterestCategory, UserProfile } from '../types';
import styles from './ProfilePage.module.css';

type ProfilePageProps = {
  /** Fiches liées depuis l'activité ; `app/` connaît les chemins, la feature non. */
  organizationPath: (id: string) => string;
  actionPath: (id: string) => string;
  /** Destination après la désactivation du compte. */
  homePath: string;
};

type Mode = 'view' | 'edit' | 'create';

const text = PROFILE_LABELS;

/** `GET /profiles/me` : pas encore de profil = `null` (200 vide ou 404 selon la version du backend). */
const loadProfile = async (signal: AbortSignal): Promise<UserProfile | null> => {
  try {
    return await getProfile(signal);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
};
const loadInterests = (signal: AbortSignal) => getMyInterests(signal);
const loadActivity = (signal: AbortSignal) => getProfileActivity(signal);

const USERNAME_TAKEN = 'Username is already taken';

/** Enregistre la différence d'intérêts puis relit la liste : le serveur a le dernier mot. */
const syncInterests = async (current: readonly InterestCategory[], selected: readonly InterestCategory[]) => {
  await Promise.allSettled([
    ...selected.filter((interest) => !current.includes(interest)).map(selectInterest),
    ...current.filter((interest) => !selected.includes(interest)).map(removeInterest),
  ]);
  return getMyInterests();
};

/**
 * `/profile` : mon profil. Sans profil, l'accueil en trois étapes puis le formulaire ; sinon la fiche
 * (onglet Overview) ou les réglages (onglet Settings), et l'édition en place.
 */
export function ProfilePage({ organizationPath, actionPath, homePath }: ProfilePageProps) {
  const { signOut, user } = useAuth();
  const loaded = useResource(loadProfile);
  const loadedInterests = useResource(loadInterests);
  const activity = useResource(loadActivity);

  // Ce que je viens d'enregistrer prime sur ce qui a été chargé : pas de rechargement ni de silhouette après un envoi.
  const [saved, setSaved] = useState<{ profile: UserProfile; interests: InterestCategory[] } | null>(null);
  const [tab, setTab] = useState<ProfileTabId>('overview');
  const [mode, setMode] = useState<Mode>('view');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  useEffect(() => {
  const handleProfileUpdated = (event: Event) => {
    const { userId } = (
      event as CustomEvent<{ userId: string }>
    ).detail;

    if (userId !== user?.user_id) return;

    // Retirer la copie locale pour afficher les données relues.
    setSaved(null);
    loaded.reload();
    loadedInterests.reload();
  };

  window.addEventListener('profile:updated', handleProfileUpdated);

  return () => {
    window.removeEventListener('profile:updated', handleProfileUpdated);
  };

}, [user?.user_id, loaded.reload, loadedInterests.reload]);
  const profile = saved?.profile ?? loaded.data;
  const interests = saved?.interests ?? loadedInterests.data;
  const interestsLoading = !saved && loadedInterests.loading;
  const interestsError = !saved && loadedInterests.error ? text.interests.error : null;

  const save = async (values: UserProfile, selected: InterestCategory[], avatar: File | null) => {
    if (saving) return;
    if (interests === null) {
      setFormError(text.form.interestsUnavailable);
      return;
    }
    const creating = mode === 'create';
    setSaving(true);
    setFormError(null);
    try {
      const nextProfile = creating ? await createProfile(values, avatar) : await updateProfile(values, avatar);
      try {
        setSaved({ profile: nextProfile, interests: await syncInterests(interests, selected) });
      } catch {
        setSaved({ profile: nextProfile, interests });
        setFormError(text.form.interestsReloadFailed);
        return;
      }
      setMode('view');
      if (creating) activity.reload();
    } catch (failure) {
      const taken = isApiError(failure) && failure.messages.includes(USERNAME_TAKEN);
      setFormError(
        taken ? text.form.usernameTaken : toProfileErrorMessage(failure, creating ? text.form.createFailed : text.form.saveFailed),
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async () => {
    await deactivateAccount();
    try {
      await signOut();
    } catch {
      // Session déjà révoquée côté backend : on repart propre quand même.
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.assign(homePath);
    }
  };

  const cancelEdit = () => {
    setFormError(null);
    setMode('view');
  };

  let content;
  if (loaded.loading) {
    content = <ProfileSkeleton />;
  } else if (loaded.error) {
    content = <ProfileUnavailable reason="ERROR" onRetry={loaded.reload} />;
  } else if (!profile) {
    content =
      mode === 'create' ? (
        <>
          <header className={styles.intro}>
            <p className={styles.eyebrow}>{text.form.createEyebrow}</p>
            <h1>{text.form.createTitle}</h1>
          </header>
          <ProfileForm
            initialInterests={interests ?? []}
            onSave={save}
            onCancel={cancelEdit}
            isSaving={saving}
            error={formError}
          />
        </>
      ) : (
        <section className={styles.onboarding} aria-labelledby="profile-onboarding-title">
          <header className={styles.intro}>
            <p className={styles.eyebrow}>{text.onboarding.eyebrow}</p>
            <h1 id="profile-onboarding-title">{text.onboarding.title}</h1>
            <p className={styles.lead}>{text.onboarding.lead}</p>
          </header>
          <Steps steps={text.onboarding.steps} />
          <Button size="lg" className={styles.cta} onClick={() => setMode('create')} disabled={interestsLoading}>
            {text.onboarding.cta}
            <Icon name="arrow" size={18} />
          </Button>
        </section>
      );
  } else if (mode === 'edit') {
    content = (
      <>
        <header className={styles.intro}>
          <p className={styles.eyebrow}>{text.form.editEyebrow}</p>
          <h1>{text.form.editTitle}</h1>
        </header>
        <ProfileForm
          initialData={profile}
          initialInterests={interests ?? []}
          onSave={save}
          onCancel={cancelEdit}
          isSaving={saving}
          error={formError}
        />
      </>
    );
  } else {
    content = (
      <>
        <div className={styles.tabsRow}>
          <ProfileTabs tabs={PROFILE_TABS} value={tab} onChange={setTab} />
        </div>
        {tab === 'overview' && (
          <div
            role="tabpanel"
            id={profilePanelId('overview')}
            aria-labelledby={profileTabId('overview')}
            className={styles.tabpanel}
          >
            <ProfileView
              profile={profile}
              eyebrow={text.eyebrow}
              own
              interests={{ data: interests, loading: interestsLoading, error: interestsError }}
              activity={{
                data: activity.data,
                loading: activity.loading,
                error: activity.error ? text.activity.error : null,
                organizationPath,
                actionPath,
              }}
              actions={
                <Button variant="secondary" onClick={() => setMode('edit')} disabled={interests === null}>
                  <Icon name="user" size={16} />
                  {text.hero.edit}
                </Button>
              }
            />
          </div>
        )}
        {tab === 'settings' && (
          <div
            role="tabpanel"
            id={profilePanelId('settings')}
            aria-labelledby={profileTabId('settings')}
            className={styles.tabpanel}
          >
            <header className={styles.intro}>
              <p className={styles.eyebrow}>{text.eyebrow}</p>
              <h1>{text.tabs.settings}</h1>
            </header>
            <ProfileSettingsPanel onDeactivateAccount={deactivate} />
          </div>
        )}
      </>
    );
  }

  return (
    <section className={styles.page}>
      <title>{pageTitle(text.eyebrow)}</title>
      {content}
    </section>
  );
}
