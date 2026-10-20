import styles from './AuthLayout.module.css';

/**
 * Fond des pages d'auth (refonte, 20/10/2026) : un plan de quartier réduit à l'essentiel, en pastels très clairs.
 * Trois rues (une grande courbe qui passe sous la carte, deux rues latérales qui descendent jusqu'au bas de la
 * page), un bassin, deux passages piétons. Pas d'îlots, pas d'arbres, pas de pins. Décoratif ; la carte d'auth occupe le
 * centre (x 475–965 sur 1440). Le viewBox descend à 1000 pour que les rues sortent toujours par le bas.
 */

const ROAD = { fill: 'none', stroke: 'var(--sage-soft)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function AuthBackdrop() {
  return (
    <svg className={styles.backdropScene} viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <path d="M-40 520C300 490 480 330 760 300S1200 200 1500 150" strokeWidth={24} {...ROAD} />
      <path d="M232-20C244 240 184 520 212 1040" strokeWidth={14} {...ROAD} />
      <path d="M1186-20C1166 240 1244 520 1206 1040" strokeWidth={14} {...ROAD} />

      {/* Passage piéton sur la grande courbe, en haut à droite (la courbe y passe à (1335, 182), pente -12°). */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1314 + i * 14} y={169} width={7} height={26} rx={2} fill="var(--ground)" transform="rotate(-12 1338 182)" />
      ))}

      {/* Second passage piéton, sur la rue de gauche (quasi verticale à (213, 463)), visible sans défiler. */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={200} y={442 + i * 14} width={26} height={7} rx={2} fill="var(--ground)" transform="rotate(3 213 463)" />
      ))}

      {/* Le bassin. */}
      <ellipse cx={1330} cy={560} rx={64} ry={38} fill="var(--ice-soft)" />
    </svg>
  );
}
