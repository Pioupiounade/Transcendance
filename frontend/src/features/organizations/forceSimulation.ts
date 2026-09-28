// Simulation « force-directed » minimale (pas de d3 : chaque dépendance passe par un ticket).
// Quatre forces : ressorts des liens, répulsion entre nœuds, anti-chevauchement, bord du cadre.
// Pure et synchrone : l'animation (rAF) et le rendu sont l'affaire du hook appelant.

export type SimNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Rayon de collision (nœud + étiquette). */
  r: number;
  /** Un nœud fixe ne bouge pas (centre, ou nœud en cours de glissement). */
  fixed: boolean;
};

export type SimLink = {
  /** Index dans le tableau des nœuds. */
  source: number;
  target: number;
  /** Longueur de repos en px. */
  length: number;
  /** 0 → 1 : rigidité du ressort. */
  strength: number;
};

export type SimBounds = { width: number; height: number; padding: number };

const REPULSION = 42_000;
const MIN_DISTANCE = 24;
const VELOCITY_DECAY = 0.55;
/** Facteur appliqué à `alpha` à chaque pas : ~120 pas pour s'éteindre. */
export const ALPHA_DECAY = 0.965;
export const ALPHA_MIN = 0.006;

/** Un pas de simulation ; `alpha` (0 → 1) module toutes les forces. */
export const tick = (nodes: SimNode[], links: SimLink[], alpha: number, bounds: SimBounds): void => {
  for (const link of links) {
    const a = nodes[link.source];
    const b = nodes[link.target];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const delta = ((d - link.length) / d) * link.strength * alpha;
    const share = a.fixed || b.fixed ? 1 : 0.5;
    if (!b.fixed) {
      b.vx -= dx * delta * share;
      b.vy -= dy * delta * share;
    }
    if (!a.fixed) {
      a.vx += dx * delta * share;
      a.vy += dy * delta * share;
    }
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      if (dx === 0 && dy === 0) {
        // Deux nœuds confondus : on les sépare dans une direction déterministe.
        dx = 0.5 + (i % 3) * 0.25;
        dy = -0.5 + (j % 3) * 0.25;
      }
      const d = Math.max(MIN_DISTANCE, Math.hypot(dx, dy));
      const force = (REPULSION * alpha) / (d * d);
      const fx = (dx / d) * force;
      const fy = (dy / d) * force;
      // Chevauchement des disques de collision : poussée ferme, indépendante de la distance.
      const overlap = a.r + b.r - d;
      const push = overlap > 0 ? (overlap / d) * 0.5 : 0;
      if (!a.fixed) {
        a.vx -= fx + dx * push;
        a.vy -= fy + dy * push;
      }
      if (!b.fixed) {
        b.vx += fx + dx * push;
        b.vy += fy + dy * push;
      }
    }
  }

  const { width, height, padding } = bounds;
  for (const node of nodes) {
    if (node.fixed) continue;
    node.vx *= VELOCITY_DECAY;
    node.vy *= VELOCITY_DECAY;
    node.x = clamp(node.x + node.vx, padding + node.r, width - padding - node.r);
    node.y = clamp(node.y + node.vy, padding + node.r, height - padding - node.r);
  }
};

/** Fait tourner la simulation jusqu'à extinction ; pour `prefers-reduced-motion` ou une position initiale posée. */
export const settle = (nodes: SimNode[], links: SimLink[], bounds: SimBounds, alpha = 1): void => {
  let a = alpha;
  while (a > ALPHA_MIN) {
    tick(nodes, links, a, bounds);
    a *= ALPHA_DECAY;
  }
};

const clamp = (value: number, min: number, max: number): number => (min > max ? (min + max) / 2 : Math.min(max, Math.max(min, value)));
