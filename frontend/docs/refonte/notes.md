# Refonte UX/UI — notes de la première passe (2026-10-20)

Branche `explore/refonte-ux`. Direction : `refs/brief.md` (style « RentEase SaaS ») appliquée à l'identité
Pioupiounades (nom, pin, structure des pages). L'espace admin garde son thème sombre.

## Ce qui change

- **Tokens** (`src/styles/tokens.css`) : mêmes noms, nouvelles valeurs. `--brand` = noir (boutons), `--accent` = citron
  (surfaces d'attention, jamais sous un texte blanc), pastels `--sage*`, `--lavender*`, `--ice*` (fond plein, fond léger,
  encre ≥ 7:1), `--hatch` pour l'attente. `--muted` = #6b6b6b (5:1, lisible) ; le gris du brief (#9e9e9e) devient
  `--muted-soft`, décoratif seulement.
- **Police** : Plus Jakarta Sans variable, auto-hébergée (`@fontsource-variable/plus-jakarta-sans`, importée dans
  `app/main.tsx`). Titres en graisse 300/400, `--title-w`.
- **Kit** : boutons pilules (noir / blanc / `accent` citron), puces blanches enfoncées = noires, avatar sur sauge,
  icônes `arrow` et `bell`. Marque : pin noir, fanion citron.
- **Coquille** : en-tête sans trait, nav dans une pilule blanche (entrée courante noire), barre mobile flottante (rond
  noir pour l'entrée courante, libellés lus par les lecteurs d'écran), pied de page sans trait.
- **Cartes d'action** : blanches, bandeau pastel teinté par la catégorie en guise de photo (sauge = Environment,
  lavande = Mutual aid, citron pâle = Culture), catégorie et statut/distance en pilules, rond flèche noir. Action
  `PENDING` : bandeau et pilule hachurés.
- **Accueil connecté** : « Hello {name}! » en grand, jauge (actions de mon agenda / actions ouvertes autour) avec
  « + » citron vers la création, puces de catégorie qui filtrent carte et « Near you ».
- **Landing** : hero centré sans l'illustration de rue, tuiles pastel (`Steps`), bandeau final noir + bouton citron.
- **Carte** : tuiles OSM pastel sous un voile sauge (filtre CSS + matrice SVG inline, pas de clé API ; le gris
  de la première passe était jugé sombre et froid), pins pastel à icône noire.
- **Illustration de rue** (`StreetScene`) : recolorée (gris, pastels, citron) pour les pages d'auth et My Actions visiteur.

## Non traité (à décider ensemble)

- Pages coéquipiers (friends, profile, fiche d'action `ActionDetailsView`) : héritent des tokens, pas de la grammaire.
- `Docs/DESIGN.md` et `frontend/CLAUDE.md` décrivent encore forêt + terracotta : à réécrire si la direction est adoptée.
- Photos d'action (#148, LeNy) : le bandeau pastel est prévu pour accueillir la photo quand elle existe.
- Recherche globale (`app/components/GlobalSearch.tsx`, Marie, 200 px en styles inline) : sur mobile elle prend la
  place du nom de la marque (le pin reste).
