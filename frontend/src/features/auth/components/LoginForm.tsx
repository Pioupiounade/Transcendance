import { useForm } from '@/shared/hooks/useForm';
import { Button, FloatingField } from '@/shared/ui';
import { toAuthErrorMessage } from '../errors';
import { useAuth } from '../hooks/useAuth';
import { AUTH_LABELS } from '../labels';
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, validateEmail, validatePassword } from '../validation';
import styles from './AuthForm.module.css';

const fields = AUTH_LABELS.fields;
const text = AUTH_LABELS.login;

type LoginFormProps = {
  /** Après une connexion réussie. Facultatif : l'hôte peut simplement réagir au statut de `useAuth`. */
  onSignedIn?: () => void;
};

/**
 * Formulaire de connexion (validation miroir du DTO, erreur serveur traduite). Utilisé par la page `/login` et par
 * les encarts qui accueillent un visiteur là où le contenu demande une session (« My Actions », #107).
 */
export function LoginForm({ onSignedIn }: LoginFormProps) {
  const { signIn } = useAuth();
  const form = useForm(
    { email: '', password: '' },
    { email: validateEmail, password: validatePassword },
    async (values) => {
      await signIn({ email: values.email.trim(), password: values.password });
      onSignedIn?.();
    },
    toAuthErrorMessage,
  );

  return (
    <form className={styles.form} noValidate onSubmit={form.handleSubmit}>
      <FloatingField
        id="email"
        type="email"
        label={fields.email}
        autoComplete="email"
        inputMode="email"
        maxLength={EMAIL_MAX_LENGTH}
        value={form.values.email}
        onChange={(event) => form.setValue('email', event.target.value)}
        onBlur={() => form.touch('email')}
        error={form.errorOf('email')}
      />
      <FloatingField
        id="password"
        type="password"
        label={fields.password}
        autoComplete="current-password"
        maxLength={PASSWORD_MAX_LENGTH}
        revealLabels={{ show: fields.show, hide: fields.hide }}
        value={form.values.password}
        onChange={(event) => form.setValue('password', event.target.value)}
        onBlur={() => form.touch('password')}
        error={form.errorOf('password')}
      />
      {form.serverError && (
        <p className={styles.serverError} role="alert">
          {form.serverError}
        </p>
      )}
      <Button type="submit" size="lg" block className={styles.submit} loading={form.submitting} loadingLabel={text.submitting}>
        {text.submit}
      </Button>
    </form>
  );
}
