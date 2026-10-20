import { AUTH_NEIGHBOURHOOD } from './authNeighbourhood';
import styles from './AuthLayout.module.css';

/**
 * Fond des pages d'auth (refonte, 20/10/2026) : le plan réel du quartier de l'école 42 (données OpenStreetMap,
 * voir `authNeighbourhood.ts`), en pastels très clairs : rues en sauge, voies ferrées en lavande pointillée,
 * parcs pistache, eau glace, l'école en point citron. Décoratif ; la carte d'auth occupe le centre
 * (x 475–965 sur 1440), l'école est placée à gauche, hors de la carte.
 */

const ROAD = { fill: 'none', stroke: 'var(--sage-soft)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const { roads, rails, parks, water, school } = AUTH_NEIGHBOURHOOD;

export function AuthBackdrop() {
  return (
    <svg className={styles.backdropScene} viewBox="0 0 1440 1000" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      {parks && <path d={parks} fill="#e9f1de" fillRule="evenodd" />}
      {water && <path d={water} fill="var(--ice-soft)" fillRule="evenodd" />}
      {roads.map((road) => (
        <path key={road.w} d={road.d} strokeWidth={road.w} {...ROAD} />
      ))}
      {rails && <path d={rails} fill="none" stroke="var(--lavender)" strokeWidth={3} strokeDasharray="10 8" strokeLinecap="round" />}
      <circle cx={school.x} cy={school.y} r={9} fill="var(--accent)" stroke="var(--ground)" strokeWidth={3} />
    </svg>
  );
}
