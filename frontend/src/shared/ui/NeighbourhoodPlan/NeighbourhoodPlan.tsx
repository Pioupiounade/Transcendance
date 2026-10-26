import { NEIGHBOURHOOD_42 } from './neighbourhood42';
import styles from './NeighbourhoodPlan.module.css';

type NeighbourhoodPlanProps = {
  className?: string;
  /**
   * Bandeau : ne montre qu'une bande de cette hauteur (en unités du plan, 1 ≈ 1 m) à la hauteur de l'école, calée
   * sur le bord gauche du relevé et recadrée pour couvrir l'hôte. Le relevé a l'école à gauche et le quartier dense à
   * droite : centrer sur l'école laisserait la moitié gauche vide. Sans lui, le plan entier est ancré en haut (fond
   * des pages d'auth).
   */
  focusHeight?: number;
};

const ROAD = { fill: 'none', stroke: 'var(--sage-soft)', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const { roads, rails, parks, water, school } = NEIGHBOURHOOD_42;
const WIDTH = 1440;

/**
 * Plan réel du quartier de l'école 42 (OpenStreetMap, voir `neighbourhood42.ts`) en pastels très clairs : rues en
 * sauge, voies ferrées en lavande pointillée, parcs pistache, eau glace, l'école en point citron. Décoratif
 * (`aria-hidden`) ; l'hôte fixe la taille. Partagé par les pages d'auth et l'en-tête du profil.
 */
export function NeighbourhoodPlan({ className, focusHeight }: NeighbourhoodPlanProps) {
  const viewBox = focusHeight ? `0 ${school.y - focusHeight / 2} ${WIDTH} ${focusHeight}` : `0 0 ${WIDTH} 1000`;

  return (
    <svg
      className={[styles.plan, className].filter(Boolean).join(' ')}
      viewBox={viewBox}
      preserveAspectRatio={focusHeight ? 'xMinYMid slice' : 'xMidYMin slice'}
      aria-hidden="true"
      focusable="false"
    >
      {parks && <path d={parks} fill="#e9f1de" fillRule="evenodd" />}
      {water && <path d={water} fill="var(--ice-soft)" fillRule="evenodd" />}
      {roads.map((road) => (
        <path key={road.w} d={road.d} strokeWidth={road.w} {...ROAD} />
      ))}
      {rails && (
        <path d={rails} fill="none" stroke="var(--lavender)" strokeWidth={3} strokeDasharray="10 8" strokeLinecap="round" />
      )}
      <circle cx={school.x} cy={school.y} r={9} fill="var(--accent)" stroke="var(--ground)" strokeWidth={3} />
    </svg>
  );
}
