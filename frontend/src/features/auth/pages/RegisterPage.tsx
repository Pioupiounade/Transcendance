import { Link, Navigate } from 'react-router';
import { useForm } from '@/shared/hooks/useForm';
import { Button, Checkbox, FloatingField } from '@/shared/ui';
import { AuthLayout } from '../components/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { useReturnPath } from '../hooks/useReturnPath';
import { toAuthErrorMessage } from '../errors';
import { AUTH_LABELS } from '../labels';
import { AUTH_ROUTES } from '../routes';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateConsent,
  validateEmail,
  validateNewPassword,
} from '../validation';
import styles from '../components/AuthForm.module.css';

type RegisterPageProps = {
  /** Pages légales du sujet, liées depuis la case de consentement ; `app/` connaît leurs chemins. */
  termsPath: string;
  privacyPath: string;
};

type RegisterValues = { email: string; password: string; consent: boolean };

const fields = AUTH_LABELS.fields;
const text = AUTH_LABELS.register;

export function RegisterPage({ termsPath, privacyPath }: RegisterPageProps) {
  const { status, signUp } = useAuth();
  const returnTo = useReturnPath();
  const form = useForm<RegisterValues>(
    { email: '', password: '', consent: false },
    { email: validateEmail, password: validateNewPassword, consent: validateConsent },
    (values) => signUp({ email: values.email.trim(), password: values.password }),
    toAuthErrorMessage,
  );

  if (status === 'authenticated') return <Navigate to={returnTo} replace />;

  return (
    <AuthLayout
      pageName={text.submit}
      title={text.title}
      lead={text.lead}
      reassure={text.reassure}
      switchText={text.switchText}
      switchLink={text.switchLink}
      switchTo={AUTH_ROUTES.login}
    >
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
          help={fields.passwordHelp(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          revealLabels={{ show: fields.show, hide: fields.hide }}
          value={form.values.password}
          onChange={(event) => form.setValue('password', event.target.value)}
          onBlur={() => form.touch('password')}
          error={form.errorOf('password')}
        />
        <div className={styles.consent}>
          <Checkbox
            id="consent"
            checked={form.values.consent}
            onChange={(event) => form.setValue('consent', event.target.checked)}
            onBlur={() => form.touch('consent')}
            error={form.errorOf('consent')}
          >
            {text.consent.before}
            <Link to={termsPath}>{text.consent.terms}</Link>
            {text.consent.and}
            <Link to={privacyPath}>{text.consent.privacy}</Link>
            {text.consent.after}
          </Checkbox>
        </div>
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
