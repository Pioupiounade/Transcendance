import { createBrowserRouter, RouterProvider } from 'react-router';
import { LoginPage, RegisterPage, RequireAuth } from '@/features/auth';
import { APP_LABELS } from './labels';
import { lazyPage } from './lazyPage';
import { PageShell } from './layout/PageShell';
import { HomePage } from './pages/home/HomePage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { ROUTES, editActionPath } from './routes';
import { ProfilePage } from '../features/profile';

// Routes en données. Une page = une ligne ; les pages de feature sont chargées
// paresseusement (un chunk par feature), `PageShell` fournit le Suspense.
const MapPage = lazyPage(() => import('@/features/actions').then((m) => m.MapPage));
const CreateActionPage = lazyPage(() => import('@/features/actions').then((m) => m.CreateActionPage));
const EditActionPage = lazyPage(() => import('@/features/actions').then((m) => m.EditActionPage));
const ActionDetailPage = lazyPage(() => import('@/features/actions').then((m) => m.ActionDetailPage));

const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <PageShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.actions, element: <PlaceholderPage title={APP_LABELS.nav.actions} /> },
      { path: ROUTES.map, element: <MapPage createPath={ROUTES.createAction} editPath={editActionPath} /> },
      { path: ROUTES.friends, element: <PlaceholderPage title={APP_LABELS.nav.friends} /> },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage termsPath={ROUTES.terms} privacyPath={ROUTES.privacy} /> },
      { path: ROUTES.terms, element: <LegalPage title={APP_LABELS.pages.terms.title} /> },
      { path: ROUTES.privacy, element: <LegalPage title={APP_LABELS.pages.privacy.title} /> },
      { path: ROUTES.actionDetail, element: <ActionDetailPage /> },
      {
        // Routes protégées : RequireAuth redirige vers /login avec state.from.
        element: <RequireAuth />,
        children: [
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.createAction, element: <CreateActionPage mapPath={ROUTES.map} /> },
          { path: ROUTES.editAction, element: <EditActionPage mapPath={ROUTES.map} /> },
        ],
      },
      // Contournement local pour tester le mockup sans authentification :
      // { path: ROUTES.profile, element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}