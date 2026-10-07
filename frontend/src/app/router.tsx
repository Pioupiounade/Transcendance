import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import { LoginPage, RegisterPage, RequireAuth, RequireRole, ROLE_APP } from '@/features/auth';
import { APP_LABELS } from './labels';
import { lazyPage } from './lazyPage';
import { PageShell } from './layout/PageShell';
import { HomePage } from './pages/home/HomePage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { ActionsListPage } from '@/features/actions';
import { ROUTES, editActionPath, mapFocusPath, organizationManagePath, organizationPath } from './routes';
import { ProfilePage, PublicProfilePage } from '../features/profile';
import { PlaceholderPage } from './pages/PlaceholderPage';


// Routes en données. Une page = une ligne ; les pages de feature sont chargées
// paresseusement (un chunk par feature), `PageShell` fournit le Suspense.
const MapPage = lazyPage(() => import('@/features/actions').then((m) => m.MapPage));
const CreateActionPage = lazyPage(() => import('@/features/actions').then((m) => m.CreateActionPage));
const EditActionPage = lazyPage(() => import('@/features/actions').then((m) => m.EditActionPage));
const ActionDetailPage = lazyPage(() => import('@/features/actions').then((m) => m.ActionDetailPage));
const OrganizationsPage = lazyPage(() => import('@/features/organizations').then((m) => m.OrganizationsPage));
const OrganizationPage = lazyPage(() => import('@/features/organizations').then((m) => m.OrganizationPage));
const OrganizationManagePage = lazyPage(() =>
  import('@/features/organizations').then((m) => m.OrganizationManagePage),
);
const AdminLayout = lazyPage(() => import('@/features/admin').then((m) => m.AdminLayout));
const AdminUsersPage = lazyPage(() => import('@/features/admin').then((m) => m.AdminUsersPage));
const FriendsPage = lazyPage(() => import('@/features/friends').then((m) => m.FriendsPage));

const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <PageShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.actions, element: <ActionsListPage /> },
      { path: ROUTES.map, element: <MapPage createPath={ROUTES.createAction} editPath={editActionPath} /> },
      { path: ROUTES.organizations, element: <OrganizationsPage organizationPath={organizationPath} /> },
      {
        path: ROUTES.organization,
        element: (
          <OrganizationPage
            listPath={ROUTES.organizations}
            upcomingActionPath={mapFocusPath}
            managePath={organizationManagePath}
          />
        ),
      },
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.register, element: <RegisterPage termsPath={ROUTES.terms} privacyPath={ROUTES.privacy} /> },
      { path: ROUTES.terms, element: <LegalPage title={APP_LABELS.pages.terms.title} /> },
      { path: ROUTES.privacy, element: <LegalPage title={APP_LABELS.pages.privacy.title} /> },
      { path: ROUTES.actionDetail, element: <ActionDetailPage /> },
      { path: ROUTES.profileDetail, element: <ProfilePage /> },
      { path: ROUTES.publicProfile, element: <PublicProfilePage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.friends, element: <FriendsPage /> },
          { path: ROUTES.createAction, element: <CreateActionPage mapPath={ROUTES.map} /> },
          { path: ROUTES.editAction, element: <EditActionPage mapPath={ROUTES.map} /> },
          {
            path: ROUTES.organizationManage,
            element: <OrganizationManagePage organizationPath={organizationPath} />,
          },
          {
            // Espace d'administration : un non-admin voit la page 404, l'espace n'est pas annoncé.
            element: <RequireRole role={ROLE_APP.ADMIN} denied={<NotFoundPage />} />,
            children: [
              {
                path: ROUTES.admin,
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to={ROUTES.adminUsers} replace /> },
                  { path: ROUTES.adminUsers, element: <AdminUsersPage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}