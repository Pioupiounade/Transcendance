import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router';

export function AccountSuspendedPage() {

  const { status, user, signOut } = useAuth();

  if (status === 'loading') {
    return <p role="status">Loading...</p>;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  if (
    status === 'authenticated' &&
    user?.account_status !== 'SUSPENDED'
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h2>Account suspended</h2>
      <p>
        Your account has been suspended. Please contact the administrator
        for assistance.
      </p>

      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}