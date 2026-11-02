import { useState, type FormEvent } from 'react';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, validateEmail, validatePassword } from '@/features/auth';
import { Button, Dialog, FloatingField } from '@/shared/ui';
import { createAdminAccount } from '../api/adminUsersApi';
import { toAccountErrorMessage } from '../errors';
import { ADMIN_LABELS } from '../labels';
import styles from './AdminForm.module.css';

type AdminAccountCreatorProps = {
  open: boolean;
  onCreated: (email: string) => void;
  onClose: () => void;
};

const text = ADMIN_LABELS.createAccount;

/** Boîte « Create account » : e-mail + mot de passe initial, rôle User. Repart vide à chaque ouverture (Dialog). */
export function AdminAccountCreator({ open, onCreated, onClose }: AdminAccountCreatorProps) {
  return (
    <Dialog open={open} onClose={onClose} title={text.title} closeLabel={ADMIN_LABELS.dialog.close}>
      <CreateForm onCreated={onCreated} onClose={onClose} />
    </Dialog>
  );
}

function CreateForm({ onCreated, onClose }: Omit<AdminAccountCreatorProps, 'open'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    // Mêmes règles que l'inscription (`@IsEmail()`, mot de passe 8 à 64 caractères) : un refus ici évite un 400.
    const cleanEmail = email.trim();
    const emailProblem = cleanEmail === '' ? text.emailRequired : validateEmail(cleanEmail);
    const passwordProblem = password === '' ? text.passwordRequired : validatePassword(password);
    setEmailError(emailProblem);
    setPasswordError(passwordProblem);
    setError(null);
    if (emailProblem || passwordProblem) return;

    setSaving(true);
    try {
      const result = await createAdminAccount(cleanEmail, password);
      if (!result.success) {
        setEmailError(text.emailTaken);
        return;
      }
      onCreated(result.user.email);
    } catch (failure) {
      setError(toAccountErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={saving} noValidate>
      <p className={styles.lead}>{text.lead}</p>
      <FloatingField
        id="admin-create-email"
        name="email"
        type="email"
        label={text.email}
        value={email}
        error={emailError}
        maxLength={EMAIL_MAX_LENGTH}
        autoComplete="off"
        disabled={saving}
        onChange={(event) => {
          setEmail(event.target.value);
          setEmailError(null);
        }}
      />
      <FloatingField
        id="admin-create-password"
        name="password"
        type="password"
        label={text.password}
        help={text.passwordHelp}
        revealLabels={text.reveal}
        value={password}
        error={passwordError}
        maxLength={PASSWORD_MAX_LENGTH}
        autoComplete="new-password"
        disabled={saving}
        onChange={(event) => {
          setPassword(event.target.value);
          setPasswordError(null);
        }}
      />
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          {text.cancel}
        </Button>
        <Button type="submit" loading={saving} loadingLabel={text.submitting}>
          {text.submit}
        </Button>
      </div>
    </form>
  );
}
