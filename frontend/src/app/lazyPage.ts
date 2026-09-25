import { lazy, type ComponentType } from 'react';

/**
 * Chargement paresseux d'une page exportée nommément par l'index d'une feature :
 * `lazyPage(() => import('@/features/actions').then((m) => m.MapPage))`. Un chunk = une feature ;
 * le composant paresseux garde les props de la page.
 */
export const lazyPage = <P extends object>(load: () => Promise<ComponentType<P>>) =>
  lazy(() => load().then((page) => ({ default: page })));
