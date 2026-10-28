import { useCallback, useState, type FormEvent } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import { Button, FloatingField, FloatingTextarea } from '@/shared/ui';
import type { ProfileVisibility, UserProfile } from '@/features/profile/types';
import { fetchAdminProfile, updateAdminProfile } from '../api/adminUsersApi';

type Props = {
  userId: string;
  email: string;
  onClose: () => void;
};

export function AdminProfileEditor({ userId, email, onClose }: Props) {
  const load = useCallback(
    (signal: AbortSignal) => fetchAdminProfile(userId, signal),
    [userId],
  );
  const { data, loading, error } = useResource(load);

  return (
    <section aria-label={`Edit profile: ${email}`}>
      <h2>Edit profile: {email}</h2>

      {loading && <p role="status">Loading profile…</p>}
      {error && <p role="alert">Unable to load this profile.</p>}
      {!loading && !error && !data && (
        <p>This account has not created a profile yet.</p>
      )}

      {!loading && !error && data ? (
        <EditorForm
          userId={userId}
          initialData={data}
          onClose={onClose}
        />
      ) : (
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      )}
    </section>
  );
}

function EditorForm({
  userId,
  initialData,
  onClose,
}: Omit<Props, 'email'> & { initialData: UserProfile }) {
  const [username, setUsername] = useState(initialData.username);
  const [description, setDescription] = useState(initialData.description ?? '');
  const [visibility, setVisibility] = useState<ProfileVisibility>(
    initialData.visibility,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    setError(null);
    setSaved(false);

    if (!/^[a-z0-9_]{4,15}$/.test(username)) {
      setError('Username: 4–15 lowercase letters, digits or underscores.');
      return;
    }

    setSaving(true);
    try {
      await updateAdminProfile(userId, {
        username,
        description,
        visibility,
      });
      setSaved(true);
    } catch {
      setError(
        'Unable to save. Check that the username is available and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} aria-busy={saving}>
      <FloatingField
        id="admin-profile-username"
        label="Username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        disabled={saving}
      />

      <FloatingTextarea
        id="admin-profile-description"
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={300}
        rows={4}
        disabled={saving}
      />

      <label htmlFor="admin-profile-visibility">Profile visibility</label>
      <select
        id="admin-profile-visibility"
        value={visibility}
        onChange={(event) =>
          setVisibility(event.target.value as ProfileVisibility)
        }
        disabled={saving}
      >
        <option value="PUBLIC">Public</option>
        <option value="FRIENDS_ONLY">Friends only</option>
        <option value="PRIVATE">Private</option>
      </select>

      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Profile updated.</p>}

      <Button variant="secondary" onClick={onClose} disabled={saving}>
        Close
      </Button>
      <Button type="submit" loading={saving} loadingLabel="Saving…">
        Save
      </Button>
    </form>
  );
}