// Interface de la feature auth : session, garde de route, pages de connexion et d'inscription.
export { AuthProvider } from './components/AuthProvider';
export { RequireAuth } from './components/RequireAuth';
export { RequireRole } from './components/RequireRole';
export { LoginPage } from './pages/LoginPage';
export { LoginForm } from './components/LoginForm';
export { RegisterPage } from './pages/RegisterPage';
export { useAuth } from './hooks/useAuth';
export { AUTH_ROUTES } from './routes';
export { ROLE_APP, ACCOUNT_STATUS } from './types';
export type { AuthUser, AuthStatus, RoleApp, AccountStatus } from './types';
export { AccountSuspendedPage } from './pages/AccountSuspendedPage';
export { RequireActiveAccount } from './components/RequireActiveAccount';