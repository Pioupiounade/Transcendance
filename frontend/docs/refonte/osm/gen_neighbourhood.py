"""Génère frontend/src/shared/ui/NeighbourhoodPlan/neighbourhood42.ts à partir d'une extraction Overpass.
Usage : python3 -I gen_neighbourhood.py <overpass.json> <school_lat> <school_lon> <school_svg_x> <school_svg_y> <out.ts>
Projection équirectangulaire centrée sur l'école, 1 px ≈ 1 m, viewBox 1440 × 1000 (y vers le sud)."""
import json, math, sys

src, lat0, lon0, sx, sy, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), sys.argv[6]
M_PER_PX = 1.0
k_lat = 111320 / M_PER_PX
k_lon = 111320 * math.cos(math.radians(lat0)) / M_PER_PX

def project(lat, lon):
    return (sx + (lon - lon0) * k_lon, sy - (lat - lat0) * k_lat)

def simplify(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        px, py = pts[i]
        d = abs(dy * px - dx * py + x2 * y1 - y2 * x1) / norm
        if d > best:
            best, idx = d, i
    if best > tol:
        return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)
    return [pts[0], pts[-1]]

def path(pts):
    return 'M' + 'L'.join(f'{round(x)} {round(y)}' for x, y in pts)

WIDTHS = {'motorway': 22, 'motorway_link': 10, 'trunk': 22, 'trunk_link': 10, 'primary': 16, 'secondary': 13,
          'tertiary': 10, 'residential': 6, 'living_street': 6, 'unclassified': 6, 'pedestrian': 6}
roads, rails, parks, water = {}, [], [], []
inside = lambda pts: any(-80 <= x <= 1520 and -80 <= y <= 1080 for x, y in pts)
for e in json.load(open(src))['elements']:
    t = e.get('tags', {})
    pts = [project(p['lat'], p['lon']) for p in e.get('geometry', [])]
    if len(pts) < 2 or not inside(pts):
        continue
    if t.get('highway') in WIDTHS:
        roads.setdefault(WIDTHS[t['highway']], []).append(path(simplify(pts, 1.5)))
    elif t.get('railway') == 'rail' and t.get('service') is None:
        rails.append(path(simplify(pts, 2)))
    elif t.get('leisure') in ('park', 'garden') and pts[0] == pts[-1]:
        parks.append(path(simplify(pts, 2)) + 'Z')
    elif (t.get('natural') == 'water' or t.get('waterway') in ('riverbank',)) and pts[0] == pts[-1]:
        water.append(path(simplify(pts, 2)) + 'Z')

ts = ["// Plan du quartier de l'école 42 (données © OpenStreetMap contributors, ODbL), généré par",
      "// docs/refonte/osm/gen_neighbourhood.py : rues par largeur, voies ferrées, parcs et plans d'eau, projection",
      "// équirectangulaire 1 px ≈ 1 m, l'école placée en (%d, %d) d'un viewBox 1440 × 1000. Ne pas éditer à la main." % (sx, sy),
      "export const NEIGHBOURHOOD_42 = {",
      "  roads: [" ]
for w in sorted(roads, reverse=True):
    ts.append("    { w: %d, d: '%s' }," % (w, ''.join(roads[w])))
ts += ["  ],",
       "  rails: '%s'," % ''.join(rails),
       "  parks: '%s'," % ''.join(parks),
       "  water: '%s'," % ''.join(water),
       "  school: { x: %d, y: %d }," % (sx, sy),
       "} as const;", ""]
open(out, 'w').write('\n'.join(ts))
import os
print('roads', {w: len(v) for w, v in roads.items()}, 'rails', len(rails), 'parks', len(parks), 'water', len(water), '→', os.path.getsize(out) // 1024, 'KB')
