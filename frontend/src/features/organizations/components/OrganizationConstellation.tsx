import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react';
import { Link } from 'react-router';
import { distanceMeters, formatDistance, type LatLng } from '@/features/actions';
import { Avatar, Icon } from '@/shared/ui';
import { useForceLayout, type LayoutLink, type LayoutNode } from '../hooks/useForceLayout';
import { ORGANIZATIONS_LABELS } from '../labels';
import { ORGANIZATION_STATUS, type Organization } from '../types';
import styles from './OrganizationConstellation.module.css';

type OrganizationConstellationProps = {
  organizations: Organization[];
  /** Point de référence de l'utilisateur (`profiles/me.location` sinon le centre du quartier). */
  center: LatLng;
  /** Utilisateur connecté avec profil ; `null` = visiteur ou sans profil (nœud générique). */
  you: { name: string; picture: string | null } | null;
  organizationPath: (id: string) => string;
};

type Frame = { width: number; height: number; padding: number };

const text = ORGANIZATIONS_LABELS.constellation;

const YOU_ID = 'you';
const YOU_RADIUS = 52;
const NODE_RADIUS = 22;
/** Deux organisations à moins de cette distance sont reliées entre elles (fil secondaire). */
const NEIGHBOUR_METERS = 1500;
/** Anneaux décoratifs, en fraction de la longueur maximale. */
const RINGS = [0.45, 0.9];
const GOLDEN_ANGLE = 2.399963;
const MAX_LABEL_CHARS = { wide: 26, compact: 18 };
/** Largeur moyenne d'un caractère de l'étiquette (13 px, gras) : sert au rayon de collision. */
const LABEL_CHAR_PX = 6.6;

const truncate = (title: string, max: number): string =>
  title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title;

/** Mesure le cadre : la simulation travaille en pixels CSS, le SVG a le même repère (`viewBox` = taille). */
const useFrame = (ref: RefObject<HTMLDivElement | null>): Frame | null => {
  const [frame, setFrame] = useState<Frame | null>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setFrame((current) =>
        current && current.width === Math.round(width) && current.height === Math.round(height)
          ? current
          : { width: Math.round(width), height: Math.round(height), padding: 22 },
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return frame;
};

/**
 * Graphe orienté par la force : l'utilisateur au centre, les organisations autour, reliées à lui par un fil dont
 * la longueur suit la distance réelle, et entre elles quand elles sont voisines. Décoratif et souris/doigt :
 * la liste de la page reste l'accès clavier et lecteur d'écran (`aria-hidden`).
 */
export function OrganizationConstellation({ organizations, center, you, organizationPath }: OrganizationConstellationProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const frame = useFrame(frameRef);
  const patternId = useId();
  const [hovered, setHovered] = useState<string | null>(null);

  const geometry = useMemo(() => {
    if (frame === null) return null;
    const cx = frame.width / 2;
    const cy = frame.height / 2;
    const compact = frame.width < 760;
    const minLength = compact ? 90 : 130;
    // Le cadre est plus large que haut : les fils les plus longs dépassent la demi-hauteur et les nœuds glissent
    // vers les côtés sous la répulsion, ce qui remplit le cadre au lieu d'un cercle serré.
    const maxLength = Math.max(minLength + 40, Math.min(frame.width / 2 - 110, frame.height / 2 + (compact ? 0 : 60)));
    return { cx, cy, minLength, maxLength, compact };
  }, [frame]);

  const { nodes, links, distances } = useMemo(() => {
    const distances = new Map(
      organizations.map((organization) => [organization.organization_id, distanceMeters(center, organization.location)]),
    );
    if (geometry === null) return { nodes: [] as LayoutNode[], links: [] as LayoutLink[], distances };
    const { cx, cy, minLength, maxLength, compact } = geometry;
    const maxChars = compact ? MAX_LABEL_CHARS.compact : MAX_LABEL_CHARS.wide;
    // Longueur du fil par rang de distance (la plus proche au plus court) : lisible quel que soit l'étalement réel.
    const byDistance = [...organizations].sort(
      (a, b) => (distances.get(a.organization_id) ?? 0) - (distances.get(b.organization_id) ?? 0),
    );
    const lengths = new Map(
      byDistance.map((organization, rank) => [
        organization.organization_id,
        minLength + (maxLength - minLength) * (byDistance.length > 1 ? rank / (byDistance.length - 1) : 0.5),
      ]),
    );
    const lengthFor = (id: string) => lengths.get(id) ?? minLength;

    const nodes: LayoutNode[] = [
      { id: YOU_ID, r: YOU_RADIUS, start: { x: cx, y: cy }, pinned: true },
      ...organizations.map((organization, i) => {
        const length = lengthFor(organization.organization_id);
        const angle = i * GOLDEN_ANGLE + 0.9;
        // Disque de collision : le nœud plus son étiquette (titre et distance en dessous).
        const labelHalf = (Math.min(organization.title.length, maxChars) * LABEL_CHAR_PX) / 2;
        return {
          id: organization.organization_id,
          r: Math.max(NODE_RADIUS + 26, labelHalf * 0.95),
          start: { x: cx + Math.cos(angle) * length, y: cy + Math.sin(angle) * length },
        };
      }),
    ];

    const links: LayoutLink[] = organizations.map((organization) => ({
      source: YOU_ID,
      target: organization.organization_id,
      length: lengthFor(organization.organization_id),
      strength: 0.5,
    }));
    // Fil secondaire : chaque organisation vers sa plus proche voisine, si elle est à portée.
    const seen = new Set<string>();
    for (const organization of organizations) {
      let nearest: { id: string; meters: number } | null = null;
      for (const other of organizations) {
        if (other === organization) continue;
        const meters = distanceMeters(organization.location, other.location);
        if (meters <= NEIGHBOUR_METERS && (nearest === null || meters < nearest.meters)) {
          nearest = { id: other.organization_id, meters };
        }
      }
      if (nearest === null) continue;
      const key = [organization.organization_id, nearest.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        source: organization.organization_id,
        target: nearest.id,
        length: Math.max(NODE_RADIUS * 4, minLength * 0.8),
        strength: 0.08,
      });
    }
    return { nodes, links, distances };
  }, [organizations, center, geometry]);

  const { positions, dragProps, consumeDrag } = useForceLayout(nodes, links, frame, frameRef);

  const point = (id: string) => positions[id] ?? (geometry ? { x: geometry.cx, y: geometry.cy } : { x: 0, y: 0 });

  const onNodeClick = (event: MouseEvent) => {
    if (consumeDrag()) event.preventDefault();
  };

  return (
    <div className={styles.constellation} aria-hidden="true">
      <div ref={frameRef} className={styles.frame}>
        {frame && geometry && (
          <svg className={styles.canvas} width={frame.width} height={frame.height} viewBox={`0 0 ${frame.width} ${frame.height}`}>
            <defs>
              <pattern id={`${patternId}-stars`} width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="4" cy="6" r="1" className={styles.star} />
                <circle cx="19" cy="20" r="0.8" className={styles.star} />
              </pattern>
              <radialGradient id={`${patternId}-halo`}>
                <stop offset="0" className={styles.haloIn} />
                <stop offset="1" className={styles.haloOut} />
              </radialGradient>
            </defs>
            <rect width="100%" height="100%" fill={`url(#${patternId}-stars)`} />
            <circle cx={geometry.cx} cy={geometry.cy} r={geometry.maxLength + 40} fill={`url(#${patternId}-halo)`} />

            {RINGS.map((fraction) => (
              <circle key={fraction} className={styles.ring} cx={geometry.cx} cy={geometry.cy} r={geometry.maxLength * fraction} />
            ))}

            <g>
              {links.map((link) => {
                const a = point(link.source);
                const b = point(link.target);
                const star = link.source === YOU_ID;
                const active = hovered !== null && (link.source === hovered || link.target === hovered);
                return (
                  <line
                    key={`${link.source}-${link.target}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    className={[star ? styles.link : styles.neighbourLink, active && styles.linkActive]
                      .filter(Boolean)
                      .join(' ')}
                  />
                );
              })}
            </g>

            <g>
              {organizations.map((organization) => {
                const id = organization.organization_id;
                const { x, y } = point(id);
                const inactive = organization.organization_status !== ORGANIZATION_STATUS.ACTIVE;
                return (
                  <g key={id} transform={`translate(${x} ${y})`}>
                    <Link
                      to={organizationPath(id)}
                      className={[styles.node, inactive && styles.nodeInactive].filter(Boolean).join(' ')}
                      tabIndex={-1}
                      draggable={false}
                      onClick={onNodeClick}
                      onPointerEnter={() => setHovered(id)}
                      onPointerLeave={() => setHovered((current) => (current === id ? null : current))}
                      {...dragProps(id)}
                    >
                      <circle r={NODE_RADIUS + 9} className={styles.nodeGlow} />
                      <circle r={NODE_RADIUS} className={styles.nodeDisc} />
                      <Icon name="building" size={20} x={-10} y={-10} className={styles.nodeIcon} />
                      <text y={NODE_RADIUS + 17} className={styles.label}>
                        {truncate(organization.title, geometry.compact ? MAX_LABEL_CHARS.compact : MAX_LABEL_CHARS.wide)}
                      </text>
                      <text y={NODE_RADIUS + 31} className={styles.distance}>
                        {formatDistance(distances.get(id) ?? 0)}
                      </text>
                    </Link>
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {geometry && (
          <div className={styles.you} style={{ left: geometry.cx, top: geometry.cy }}>
            {you ? (
              <Avatar name={you.name} src={you.picture} size={geometry.compact ? 56 : 68} className={styles.youAvatar} />
            ) : (
              <span className={[styles.youDisc, geometry.compact && styles.youDiscCompact].filter(Boolean).join(' ')}>
                <Icon name="user" size={26} />
              </span>
            )}
            <span className={styles.youLabel}>{you?.name ?? text.you}</span>
          </div>
        )}

      </div>
      <p className={styles.legend}>{text.legend}</p>
      <p className={styles.hint}>{text.hint}</p>
    </div>
  );
}
