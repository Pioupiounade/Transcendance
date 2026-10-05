import type { ReactNode } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import type { RoleApp } from '../types';

type RequireRoleProps = {
  role: RoleApp;
  /** Rendu à la place des pages quand le rôle manque (ex. la page 404 : l'espace n'est pas annoncé). */
  denied: ReactNode;
};

/**
 * Route garde par rôle : à placer sous `RequireAuth` (qui gère le chargement et l'anonyme), comme route
 * parente sans `path`. Confort d'interface seulement : le backend revérifie le rôle à chaque appel.
 */
export function RequireRole({ role, denied }: RequireRoleProps) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : denied;
}
