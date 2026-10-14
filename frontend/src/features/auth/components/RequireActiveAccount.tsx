import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';

export function RequireActiveAccount() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <p role="status">Loading...</p>;
  }

  if (status !== 'authenticated' || !user) {
    return <Outlet />;
  }

  if (user.account_status === 'SUSPENDED') {
    return <Navigate to="/account-suspended" replace />;
  }

  return <Outlet />;
}