import { useState, type FormEvent } from 'react';
import { Button, FloatingField } from '@/shared/ui';
import { createAdminAccount } from '../api/adminUsersApi';
import { toAccountErrorMessage } from '../errors';

type Props = {
  onCreated: (email: string) => void;
  onClose: () => void;
};

export function AdminAccountCreator({
  onCreated,
  onClose,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setError(null);

    if (password.length < 8) {
      setError('The password must contain at least 8 characters.');
      return;
    }

    setSaving(true);

    try {
      const result = await createAdminAccount(
        email.trim(),
        password,
      );

      if (!result.success) {
        setError('This email address is already used.');
        return;
      }

      setPassword('');
      onCreated(result.user.email);
    } catch (failure) {
      setError(toAccountErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="admin-create-account-title">
      <h2 id="admin-create-account-title">Create account</h2>

      <p>
        The account will have the User role. Its owner will create
        their profile when they first sign in.
      </p>

      <form onSubmit={submit} aria-busy={saving}>
        <FloatingField
          id="admin-create-email"
          name="email"
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="off"
          required
          disabled={saving}
        />

        <FloatingField
          id="admin-create-password"
          name="password"
          type="password"
          label="Initial password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          disabled={saving}
        />

        {error && <p role="alert">{error}</p>}

        <Button
          variant="secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={saving}
          loadingLabel="Creating…"
        >
          Create account
        </Button>
      </form>
    </section>
  );
}