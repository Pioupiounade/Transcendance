import { lazy, type ComponentType } from 'react';

/**
 * Chargement paresseux d'une page exportée nommément par l'index d'une feature :
 * `lazyPage(() => import('@/features/actions'), 'MapPage')`. Un chunk = une feature.
 */
export const lazyPage = <T extends Record<K, ComponentType>, K extends keyof T>(load: () => Promise<T>, name: K) =>
  lazy(() => load().then((module) => ({ default: module[name] })));
