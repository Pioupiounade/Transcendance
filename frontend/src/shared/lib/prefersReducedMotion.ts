/** Lu à chaque appel : l'utilisateur peut changer le réglage pendant la session. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
