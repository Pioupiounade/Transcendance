/** Pin de la marque (maquette), décoratif. */
export function Brandmark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 36" width="31" height="35" aria-hidden="true" focusable="false">
      <path fill="var(--brand)" d="M3 17a13 13 0 1 1 26 0c0 9-13 18-13 18S3 26 3 17Z" />
      <circle cx="13" cy="13" r="2" fill="var(--ground)" />
      <path d="m20 13 7 3-7 3" fill="#EAB96E" />
    </svg>
  );
}
