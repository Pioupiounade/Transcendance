/**
 * Marque « pioupiounades » : le pin forêt, son fanion terracotta et son point crème.
 * Géométrie de `public/pioupiounades-mark.svg` (source des favicons), inlinée pour suivre les tokens
 * et éviter une requête. Décorative : le nom de la marque est écrit à côté.
 */
export function Brandmark({ className, size = 34 }: { className?: string; size?: number }) {
  return (
    <svg
      className={className}
      viewBox="-136.92 -105.8 301.6 301.6"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="var(--accent)" d="M73.29 -47.93L131.65 2.8A8 8 0 0 1 130.76 15.55L65.9 57.66Z" />
      <path fill="var(--brand)" d="M85.03 52.63L6.8 179.01A8 8 0 0 1 -6.8 179.01L-85.03 52.63A100 100 0 1 1 85.03 52.63Z" />
      <path fill="var(--ground)" d="M7 -20a25 25 0 1 0 50 0a25 25 0 1 0 -50 0Z" />
    </svg>
  );
}
