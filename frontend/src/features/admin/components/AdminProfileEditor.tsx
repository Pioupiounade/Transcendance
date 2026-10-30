import { useCallback, useState, type FormEvent } from 'react';
import type { AuthUser } from '@/features/auth';
import type { ProfileVisibility, UserProfile } from '@/features/profile';
import { useResource } from '@/shared/hooks/useResource';
import { Button, Dialog, FloatingField, FloatingTextarea, Icon } from '@/shared/ui';
import { fetchAdminProfile, updateAdminProfile } from '../api/adminUsersApi';
import { ADMIN_LABELS } from '../labels';
import styles from './AdminForm.module.css';

type AdminProfileEditorProps = {
  /** Compte dont on modifie le profil ; `null` = boîte fermée. */
  user: AuthUser | null;
  onClose: () => void;
};

const text = ADMIN_LABELS.editProfile;
const VISIBILITIES: readonly ProfileVisibility[] = ['PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'];
const USERNAME_RULE = /^[a-z0-9_]{4,15}$/;
const DESCRIPTION_MAX = 300;

/** Boîte « Edit profile » d'un compte : pseudo, description, visibilité (`PATCH /profiles/:userId`, admin). */
export function AdminProfileEditor({ user, onClose }: AdminProfileEditorProps) {
  return (
    <Dialog open={user !== null} onClose={onClose} title={text.title} closeLabel={ADMIN_LABELS.dialog.close}>
      {user && <ProfileLoader key={user.user_id} user={user} onClose={onClose} />}
    </Dialog>
  );
}

type ProfileLoaderProps = { user: AuthUser; onClose: () => void };

function ProfileLoader({ user, onClose }: ProfileLoaderProps) {
  const load = useCallback((signal: AbortSignal) => fetchAdminProfile(user.user_id, signal), [user.user_id]);
  const { data, loading, error } = useResource(load);
  const ready = !loading && !error;

  return (
    <>
      <p className={styles.lead}>{user.email}</p>
      {loading && (
        <p className={styles.state} role="status">
          {text.loading}
        </p>
      )}
      {error && (
        <p className={styles.state} role="alert">
          {text.loadError}
        </p>
      )}
      {ready && data === null && <p className={styles.state}>{text.noProfile}</p>}
      {ready && data ? (
        <EditorForm userId={user.user_id} initialData={data} onClose={onClose} />
      ) : (
        !loading && (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose}>
              {text.close}
            </Button>
          </div>
        )
      )}
    </>
  );
}

type EditorFormProps = { userId: string; initialData: UserProfile; onClose: () => void };

function EditorForm({ userId, initialData, onClose }: EditorFormProps) {
  const [username, setUsername] = useState(initialData.username);
  const [description, setDescription] = useState(initialData.description ?? '');
  const [visibility, setVisibility] = useState<ProfileVisibility>(initialData.visibility);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setError(null);
    setSaved(false);
    if (!USERNAME_RULE.test(username)) {
      setUsernameError(text.usernameInvalid);
      return;
    }

    setSaving(true);
    try {
      await updateAdminProfile(userId, { username, description, visibility });
      setSaved(true);
    } catch {
      setError(text.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={saving} noValidate>
      <FloatingField
        id="admin-profile-username"
        label={text.username}
        help={text.usernameHelp}
        value={username}
        error={usernameError}
        maxLength={15}
        autoComplete="off"
        disabled={saving}
        onChange={(event) => {
          setUsername(event.target.value);
          setUsernameError(null);
          setSaved(false);
        }}
      />
      <FloatingTextarea
        id="admin-profile-description"
        label={text.description}
        value={description}
        maxLength={DESCRIPTION_MAX}
        rows={4}
        disabled={saving}
        onChange={(event) => {
          setDescription(event.target.value);
          setSaved(false);
        }}
      />
      <fieldset className={styles.group}>
        <legend className={styles.legend}>{text.visibility}</legend>
        <div className={styles.options}>
          {VISIBILITIES.map((value) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name="admin-profile-visibility"
                value={value}
                checked={visibility === value}
                disabled={saving}
                onChange={() => {
                  setVisibility(value);
                  setSaved(false);
                }}
              />
              {text.visibilities[value]}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className={styles.status} role="status">
          <Icon name="check" size={16} strokeWidth={2.4} />
          {text.saved}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {text.close}
        </Button>
        <Button type="submit" loading={saving} loadingLabel={text.saving}>
          {text.save}
        </Button>
      </div>
    </form>
  );
}
