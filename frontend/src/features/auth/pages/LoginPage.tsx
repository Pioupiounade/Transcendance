import { Navigate } from 'react-router';
import { useForm } from '@/shared/hooks/useForm';
import { Button, FloatingField } from '@/shared/ui';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { toAuthErrorMessage } from '../errors';
import { AUTH_LABELS } from '../labels';
import { AUTH_ROUTES } from '../routes';
import { validateEmail, validatePassword } from '../validation';
import styles from './AuthForm.module.css';

const fields = AUTH_LABELS.fields;
const text = AUTH_LABELS.login;

export function LoginPage() {
  const { status, signIn } = useAuth();
    const form = useForm(
    { email: '', password: '' },
    { email: validateEmail, password: validatePassword },
    (values) => signIn({ email: values.email.trim(), password: values.password }),
    toAuthErrorMessage,
  );

  // Déjà connecté (ou connexion réussie) : le changement de statut fait la redirection.
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return (
    <AuthLayout
      pageName={text.submit}
      title={text.title}
      lead={text.lead}q
      reassure={text.reassure}
      switchText={text.switchText}
      switchLink={text.switchLink}
      switchTo={AUTH_ROUTES.register}
    >
      <form className={styles.form} noValidate onSubmit={form.handleSubmit}>
        <FloatingField
          id="email"
          type="email"
          label={fields.email}
          autoComplete="email"
          inputMode="email"
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
        <Button
          type="submit"
          size="lg"
          block
          className={styles.submit}
          loading={form.submitting}
          loadingLabel={text.submitting}
        >
          {text.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}
