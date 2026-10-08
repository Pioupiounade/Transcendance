import { Navigate, useNavigate } from 'react-router';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { useReturnPath } from '../hooks/useReturnPath';
import { AUTH_LABELS } from '../labels';
import { AUTH_ROUTES } from '../routes';

const text = AUTH_LABELS.login;

export function LoginPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const returnTo = useReturnPath();

  // Déjà connecté (ou connexion réussie) : le changement de statut fait la redirection.
  if (status === 'authenticated') return <Navigate to={returnTo} replace />;
  return (
    <AuthLayout
      pageName={text.submit}
      title={text.title}
      lead={text.lead}
      reassure={text.reassure}
      switchText={text.switchText}
      switchLink={text.switchLink}
      switchTo={AUTH_ROUTES.register}
    >
      <LoginForm onSignedIn={() => navigate(returnTo, { replace: true })} />
    </AuthLayout>
  );
}
