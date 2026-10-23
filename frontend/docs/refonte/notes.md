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
- **Coquille** : en-tête sans trait, nav dans une pilule blanche (entrée courante noire), barre basse flottante (rond
  noir pour l'entrée courante, libellés lus par les lecteurs d'écran), pied de page sans trait. Trois modes mesurés
  sur la largeur réelle des blocs : ≥ 1320 px la nav est dans l'en-tête et n'est jamais comprimée ; de 761 à 1319 px
  elle descend dans la barre basse (bornée à 480 px, centrée) et l'en-tête garde le nom complet ; ≤ 760 px déconnexion
  en pastille icône, recherche rétractable, avatar masqué.
- **Cartes d'action** : blanches, bandeau en guise de photo teinté par la catégorie, pastels chauds en dégradé
  (`--cover-*` : pistache = Environment, rose-lavande = Mutual aid, citron-abricot = Culture), catégorie et
  statut/distance en pilules, rond flèche noir. Action `PENDING` : seule la pilule de statut est hachurée (les
  hachures sur le bandeau ont été retirées le 20/10/2026).
- **Accueil connecté** : « Hello {name}! » en grand, jauge (actions de mon agenda / actions ouvertes autour) avec
  « + » citron vers la création, puces de catégorie qui filtrent carte et « Near you ».
- **Landing** : hero centré sans l'illustration de rue, tuiles pastel (`Steps`), bandeau final noir + bouton citron.
- **Carte** : tuiles OSM dans leurs couleurs d'origine (choix de l'utilisateur, `refs/Screenshot from
  2026-10-20 12-02-42.png` ; le gris puis le voile sauge ont été essayés et écartés), pins pastel à icône noire.
- **Pages d'auth** (login, register) : photo de rue (`refs/login.jpg` → `src/assets/login.jpg`, bande 2:1) à la
  place du dessin, fondue vers le fond en bas ; derrière la carte, le plan réel du quartier de l'école 42 (`AuthBackdrop` +
  `authNeighbourhood.ts`, opacité 0.45) remplace les pins : rues en sauge par largeur, voies ferrées en lavande
  pointillée, parcs pistache, eau glace, l'école en point citron à gauche de la carte. Données
  © OpenStreetMap contributors (ODbL), extrait Overpass `osm/paris42.json` autour du 96 bd Bessières (42 Paris),
  générées par `osm/gen_neighbourhood.py` (projection 1 px ≈ 1 m, viewBox 1440 × 1000). Pour un autre campus :
  refaire l'extrait Overpass autour de son adresse et relancer le script avec ses coordonnées. My Actions visiteur : photo de marché (`refs/actions.png` →
  `src/assets/actions.jpg`, 490 × 579) en carte à côté de la promesse. Le dessin `StreetScene` n'est plus monté
  nulle part (toujours dans `shared/ui`).

## Non traité (à décider ensemble)

- Pages coéquipiers (friends, profile, fiche d'action `ActionDetailsView`) : héritent des tokens, pas de la grammaire.
- `Docs/DESIGN.md` et `frontend/CLAUDE.md` décrivent encore forêt + terracotta : à réécrire si la direction est adoptée.
- Photos d'action (#148, LeNy) : le bandeau pastel est prévu pour accueillir la photo quand elle existe.
- Recherche globale (`app/components/GlobalSearch.tsx`, Marie, 200 px) : elle garde ses 200 px jusqu'à 760 px ; sur
  téléphone elle se rétracte (120 px min.) et prend la place du nom de la marque sous 520 px (570 px pour un admin,
  qui a une pastille de plus), le pin reste.
- Messagerie (`features/messages`, backend #155) : pastille à côté de la cloche (point citron = message non lu), page
  `/messages` en un panneau blanc, amis à gauche, bulles noires / grises à droite, un volet à la fois sur téléphone.
  Sondage toutes les 5 s sur le fil ouvert, 30 s pour la pastille (pas de temps réel : la branche socket.io du
  coéquipier, #128, n'est pas fusionnée).

## Voir la branche

```
git fetch origin
git switch explore/refonte-ux
docker compose -f docker/docker-compose.yml exec frontend npm install   # la police (pas de make re : la base reste)
```
Puis `http://localhost:5173`. Comptes de démo : `demo.seed.alice@example.test` / `DemoPass123!` (membre),
`demo.seed.grace@example.test` (admin). Comparer avec `git switch main`.

Captures (`captures/`, 1440 px, 20/10/2026) : 01 accueil visiteur, 02 tableau de bord, 03 My Actions, 04 carte,
05 annuaire des organisations, 06 fiche d'organisation, 07 login, 08 My Actions visiteur, 09 admin (sombre, inchangé),
10 et 11 mobile.
