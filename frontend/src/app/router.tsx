import { createBrowserRouter, RouterProvider } from 'react-router';
import { RequireAuth } from '@/features/auth';
import { APP_LABELS } from './labels';
import { PageShell } from './layout/PageShell';
import { HomePage } from './pages/HomePage';
import { LegalPage } from './pages/LegalPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ROUTES } from './routes';
import { ActionDetailPage } from '@/features/actions';

// Routes en données. Une page = une ligne ; les pages de feature arriveront via
// `lazyPage(() => import('@/features/x'), 'XPage')` quand elles existeront.
const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <PageShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.actions, element: <PlaceholderPage title={APP_LABELS.nav.actions} /> },
      { path: ROUTES.map, element: <PlaceholderPage title={APP_LABELS.nav.map} /> },
      { path: ROUTES.friends, element: <PlaceholderPage title={APP_LABELS.nav.friends} /> },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.terms, element: <LegalPage title={APP_LABELS.pages.terms.title} /> },
      { path: ROUTES.privacy, element: <LegalPage title={APP_LABELS.pages.privacy.title} /> },
      { path: ROUTES.actionDetail, element: <ActionDetailPage /> },
      {
        // Routes protégées : RequireAuth redirige vers /login (avec `state.from`) si anonyme.
        element: <RequireAuth />,
        children: [{ path: ROUTES.profile, element: <PlaceholderPage title={APP_LABELS.nav.profile} /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
