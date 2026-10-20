import styles from './AuthLayout.module.css';

/**
 * Fond des pages d'auth (refonte, 20/10/2026) : un petit plan de quartier très simple, rubans de rues en sauge,
 * îlots au trait, un square et un bassin, un passage piéton. Pastels de la palette, aucune pin. Décoratif.
 * La carte d'auth occupe le centre (x 475–965 sur 1440) : les rues passent dessous, les îlots restent sur les côtés.
 */

const ROAD = { fill: 'none', stroke: 'var(--sage-soft)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const BLOCK = { fill: 'none', stroke: 'var(--line)', strokeWidth: 1.5, rx: 12 } as const;

// Îlots : [x, y, largeur, hauteur], hors des rubans et hors de la carte centrale.
const BLOCKS: ReadonlyArray<readonly [number, number, number, number]> = [
  [52, 60, 128, 96],
  [52, 190, 128, 70],
  [290, 40, 118, 118],
  [290, 200, 118, 76],
  [1030, 70, 96, 110],
  [1030, 215, 96, 60],
  [1300, 420, 110, 90],
  [1300, 540, 110, 70],
  [1000, 420, 150, 88],
];

export function AuthBackdrop() {
  return (
    <svg className={styles.backdropScene} viewBox="0 0 1440 700" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      {/* Rues : une grande courbe qui traverse sous la carte, deux rues latérales, une rue basse à droite. */}
      <path d="M-40 520C300 490 480 330 760 300S1200 200 1500 150" strokeWidth={28} {...ROAD} />
      <path d="M232-20C244 200 184 420 212 720" strokeWidth={18} {...ROAD} />
      <path d="M1186-20C1166 220 1244 420 1206 720" strokeWidth={18} {...ROAD} />
      <path d="M980 620L1500 590" strokeWidth={18} {...ROAD} />

      {/* Passage piéton sur la grande courbe, en haut à droite (la courbe y passe à (1335, 182), pente -12°). */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={1314 + i * 14} y={167} width={7} height={30} rx={2} fill="var(--ground)" transform="rotate(-12 1338 182)" />
      ))}

      {/* Îlots au trait. */}
      {BLOCKS.map(([x, y, w, h]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} {...BLOCK} />
      ))}

      {/* Le square : pistache, trois arbres, entre les îlots de droite. */}
      <circle cx={1092} cy={348} r={56} fill="#e6f0d9" />
      <circle cx={1074} cy={338} r={9} fill="#cfe3c6" />
      <circle cx={1108} cy={364} r={11} fill="#cfe3c6" />
      <circle cx={1098} cy={318} r={7} fill="#cfe3c6" />

      {/* Le bassin. */}
      <ellipse cx={1330} cy={300} rx={72} ry={44} fill="var(--ice-soft)" />
    </svg>
  );
}
