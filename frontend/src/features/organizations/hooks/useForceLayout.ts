import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { prefersReducedMotion } from '@/shared/lib/prefersReducedMotion';
import { ALPHA_DECAY, ALPHA_MIN, settle, tick, type SimBounds, type SimLink, type SimNode } from '../forceSimulation';

export type LayoutNode = {
  id: string;
  /** Rayon de collision. */
  r: number;
  /** Position de départ ; reprise de la position courante si le nœud existait déjà. */
  start: { x: number; y: number };
  /** Nœud épinglé (le centre) : jamais déplacé par les forces ni par la souris. */
  pinned?: boolean;
};

export type LayoutLink = { source: string; target: string; length: number; strength: number };
export type Point = { x: number; y: number };

type Simulation = { nodes: SimNode[]; links: SimLink[]; alpha: number; frame: number };
type Drag = { id: string; moved: boolean; originX: number; originY: number };

const DRAG_THRESHOLD_PX = 4;
const REHEAT = 0.35;

/**
 * Anime un graphe orienté par la force dans `bounds` (le repère = le rectangle de `frameRef`) et rend les positions.
 * `nodes` et `links` doivent être mémoïsés : une nouvelle référence relance la simulation (positions conservées
 * pour les ids déjà présents). Sous `prefers-reduced-motion`, la disposition est calculée d'un coup, sans animation.
 * `dragProps(id)` rend un nœud déplaçable à la souris ou au doigt (il reste épinglé là où on le dépose) ;
 * `consumeDrag()` dit si le dernier geste était un glissement (pour ne pas le compter comme un clic).
 */
export function useForceLayout(
  nodes: LayoutNode[],
  links: LayoutLink[],
  bounds: SimBounds | null,
  frameRef: RefObject<HTMLElement | null>,
) {
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const simRef = useRef<Simulation | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const lastDragMovedRef = useRef(false);
  const pinnedRef = useRef<Set<string>>(new Set());

  const publish = useCallback((sim: Simulation) => {
    const next: Record<string, Point> = {};
    for (const node of sim.nodes) next[node.id] = { x: node.x, y: node.y };
    setPositions(next);
  }, []);

  const run = useCallback(
    (sim: Simulation, simBounds: SimBounds) => {
      if (sim.frame !== 0) return;
      const step = () => {
        tick(sim.nodes, sim.links, sim.alpha, simBounds);
        sim.alpha *= ALPHA_DECAY;
        publish(sim);
        sim.frame = sim.alpha > ALPHA_MIN || dragRef.current !== null ? requestAnimationFrame(step) : 0;
      };
      sim.frame = requestAnimationFrame(step);
    },
    [publish],
  );

  useEffect(() => {
    if (bounds === null) return;
    const previous = simRef.current;
    const known = new Map(previous?.nodes.map((node) => [node.id, node]) ?? []);
    pinnedRef.current = new Set(nodes.filter((node) => node.pinned).map((node) => node.id));

    const simNodes: SimNode[] = nodes.map((node) => {
      const kept = node.pinned ? undefined : known.get(node.id);
      return {
        id: node.id,
        x: kept?.x ?? node.start.x,
        y: kept?.y ?? node.start.y,
        vx: 0,
        vy: 0,
        r: node.r,
        fixed: node.pinned === true,
      };
    });
    const index = new Map(simNodes.map((node, i) => [node.id, i]));
    const simLinks: SimLink[] = links.flatMap((link) => {
      const source = index.get(link.source);
      const target = index.get(link.target);
      return source === undefined || target === undefined ? [] : [{ ...link, source, target }];
    });

    const sim: Simulation = { nodes: simNodes, links: simLinks, alpha: known.size > 0 ? 0.6 : 1, frame: 0 };
    simRef.current = sim;
    dragRef.current = null;

    if (prefersReducedMotion()) {
      settle(sim.nodes, sim.links, bounds, sim.alpha);
      sim.alpha = 0;
      publish(sim);
    } else {
      run(sim, bounds);
    }
    return () => {
      cancelAnimationFrame(sim.frame);
      sim.frame = 0;
    };
  }, [nodes, links, bounds, publish, run]);

  const pointInFrame = useCallback(
    (event: PointerEvent): Point => {
      const rect = frameRef.current?.getBoundingClientRect();
      return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
    },
    [frameRef],
  );

  const release = useCallback(
    (event: PointerEvent, id: string) => {
      const sim = simRef.current;
      const drag = dragRef.current;
      if (!sim || !drag || drag.id !== id) return;
      // Un nœud déposé reste où on l'a mis (épinglé) ; un simple clic le laisse libre.
      const node = sim.nodes.find((candidate) => candidate.id === id);
      if (node) node.fixed = drag.moved;
      lastDragMovedRef.current = drag.moved;
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (drag.moved && bounds !== null && !prefersReducedMotion()) {
        sim.alpha = Math.max(sim.alpha, REHEAT);
        run(sim, bounds);
      }
    },
    [bounds, run],
  );

  const dragProps = useCallback(
    (id: string) => ({
      onPointerDown: (event: PointerEvent) => {
        const sim = simRef.current;
        const node = sim?.nodes.find((candidate) => candidate.id === id);
        if (!sim || !node || pinnedRef.current.has(id) || event.button !== 0) return;
        const point = pointInFrame(event);
        dragRef.current = { id, moved: false, originX: point.x, originY: point.y };
        lastDragMovedRef.current = false;
        node.fixed = true;
        node.vx = 0;
        node.vy = 0;
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event: PointerEvent) => {
        const sim = simRef.current;
        const drag = dragRef.current;
        if (!sim || !drag || drag.id !== id || bounds === null) return;
        const point = pointInFrame(event);
        if (!drag.moved && Math.hypot(point.x - drag.originX, point.y - drag.originY) > DRAG_THRESHOLD_PX) {
          drag.moved = true;
        }
        if (!drag.moved) return;
        const node = sim.nodes.find((candidate) => candidate.id === id);
        if (!node) return;
        node.x = Math.min(bounds.width - node.r, Math.max(node.r, point.x));
        node.y = Math.min(bounds.height - node.r, Math.max(node.r, point.y));
        if (prefersReducedMotion()) {
          publish(sim);
        } else {
          sim.alpha = Math.max(sim.alpha, REHEAT);
          run(sim, bounds);
        }
      },
      onPointerUp: (event: PointerEvent) => release(event, id),
      onPointerCancel: (event: PointerEvent) => release(event, id),
    }),
    [bounds, pointInFrame, publish, release, run],
  );

  const consumeDrag = useCallback((): boolean => {
    const moved = lastDragMovedRef.current;
    lastDragMovedRef.current = false;
    return moved;
  }, []);

  return { positions, dragProps, consumeDrag };
}
