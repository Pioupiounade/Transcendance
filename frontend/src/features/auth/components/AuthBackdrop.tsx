import styles from './AuthLayout.module.css';

/**
 * Fond des pages d'auth (refonte, 20/10/2026) : un plan de quartier réduit à l'essentiel, en pastels très clairs.
 * Sept rues (une grande courbe qui passe sous la carte, deux rues latérales qui descendent jusqu'au bas de la
 * page, quatre rues secondaires plus fines) et un bassin. Pas d'îlots, pas d'arbres, pas de passages piétons, pas de pins. Décoratif ; la carte d'auth occupe le
 * centre (x 475–965 sur 1440). Le viewBox descend à 1000 pour que les rues sortent toujours par le bas.
 */

const ROAD = { fill: 'none', stroke: 'var(--sage-soft)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function AuthBackdrop() {
  return (
    <svg className={styles.backdropScene} viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <path d="M-40 520C300 490 480 330 760 300S1200 200 1500 150" strokeWidth={24} {...ROAD} />
      <path d="M232-20C244 240 184 520 212 1040" strokeWidth={14} {...ROAD} />
      <path d="M1186-20C1166 240 1244 520 1206 1040" strokeWidth={14} {...ROAD} />
      {/* Rues secondaires, plus fines : une basse qui traverse, deux petites à gauche, une à droite. */}
      <path d="M-40 860C400 820 700 900 1500 760" strokeWidth={16} {...ROAD} />
      <path d="M-40 300C100 310 180 290 232 300" strokeWidth={11} {...ROAD} />
      <path d="M206 700C400 690 600 720 760 700" strokeWidth={11} {...ROAD} />
      <path d="M1222 420C1300 430 1400 400 1500 410" strokeWidth={11} {...ROAD} />

      {/* Le bassin. */}
      <ellipse cx={1330} cy={560} rx={64} ry={38} fill="var(--ice-soft)" />
    </svg>
  );
}
