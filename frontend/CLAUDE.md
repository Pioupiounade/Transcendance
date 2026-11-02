# frontend/ — Pioupiounades (ft_transcendence, 42)

Périmètre de Claude Code : **`frontend/` uniquement**. Tout ce que Claude produit (code, docs, notes, fichiers générés)
vit ici : jamais à la racine du dépôt, ni dans `backend/` (coéquipiers, lecture seule), ni dans `Docs/` (documentation
d'équipe, lecture seule). Si l'API ne couvre pas un besoin, le signaler par un ticket au lieu de contourner.
Contrat d'API réel : `docs/api_contract.md`. Design : `../Docs/DESIGN.md`, `../Docs/_reference.html`, `../mockup/`.
Ce fichier est chargé automatiquement quand la session démarre dans `frontend/`, ou dès que Claude touche un fichier de ce dossier.

## Projet
- Plateforme web de quartier : actions citoyennes, organisations, participations, amis. Équipe de 4, Tech Lead : @Quentin.
- Sujet officiel : `../Docs/en.subject.pdf` (v21.1). Démo finale le 28/09/2026 (`../Docs/sprint_schedule.md`).
- Backend (`../backend/`, hors périmètre) : NestJS 11, Prisma 7, PostgreSQL 17, JWT (passport), argon2. API REST sans
  préfixe ni version, ids `BigInt` renvoyés en string, JWT (`JwtAuthGuard`) sur toute route agissant au nom de
  l'utilisateur, CORS non activé (23/09/2026).
- `../docker/docker-compose.yml` : postgres :5432, backend :3000, frontend :5173, sources montées (hot reload).
  Nginx/HTTPS pas encore branché.

## Commandes
- Ici : `npm run dev` (Vite sur :5173), `npm run build` (`tsc -b` puis `vite build` : une erreur de type casse le build),
  `npm run lint`, `npm run preview`. Node ≥ 20.19 requis (Vite 8) ; le conteneur est en node:24. Sur un Node 18,
  seuls `npx tsc -b` et `npx eslint -f json .` fonctionnent (le formateur par défaut d'ESLint 10 plante).
- Makefile à la racine du dépôt (= `docker compose -f docker/docker-compose.yml`) : `make up` / `make uplogs` (détaché /
  avec logs), `make down`, `make logs`, `make backend-shell`, `make re` (down -v, rebuild, up, puis `make db-update` :
  `prisma generate` + `prisma migrate deploy` dans le conteneur backend ; aussi après chaque pull du backend), `make clean` (supprime aussi les volumes : base perdue).
- Docker : le conteneur frontend exécute `npm run dev -- --host 0.0.0.0`, le dossier est monté, `node_modules` est un
  volume nommé. Après un ajout de dépendance : `make re` ou `docker compose -f docker/docker-compose.yml build frontend`.

## Règles d'équipe (workflow GitHub)
1. Ticket : passer la carte en "In Progress" dès le début du travail.
2. Branche depuis `main` à jour : `feature/<issue#>-short_description` (ex. `feature/2-docker-setup`). 1 ticket = 1 branche.
3. Travail testé et commité → ouvrir la PR, la lier au ticket (`Closes #<issue#>`), carte en "In Review", reviewer @Quentin.
4. @Quentin relit, approuve et merge dans `main` ; la fermeture de la PR passe la carte en "Done".
5. Daily chaque jour travaillé (au début ou avant de partir) : `Daily — [Date]` / 1. What did I work on? /
   2. What will I do next? / 3. Any blockers?
- Commits clairs et significatifs (exigence du sujet), format `type(scope): description`, sujet en anglais.

## Règles pour Claude Code (git)
- Seul espace de travail : la branche `claude/*` du worktree, créée depuis la branche d'issue de l'utilisateur.
  Commiter uniquement dessus, en petits commits atomiques `type(scope): description`.
- Jamais : `git push`, création de PR, merge, rebase, changement de branche, modification de `main` ou de la branche
  d'issue. L'utilisateur intègre lui-même par `merge --squash` après relecture.
- Fin de tâche : ne rien pousser ; donner la liste des fichiers créés et modifiés, les points à relire en priorité et une
  proposition de message pour le commit squash.

## Documentation d'équipe (`../Docs/`, lecture seule) — lire avant d'agir, ne pas dupliquer
- `vision.md`, `personas.md`, `user_stories.md` (tableau MVP en fin de fichier), `backlog.md` (épics 1 à 9) : le produit.
- `modules.md` : modules ft_transcendence choisis et points. `sprint_schedule.md` : sprints de septembre 2026.
- `architecture.md` : stack cible, couches, RBAC (§10.1). `database.md` : schéma cible, partiellement obsolète
  (la vérité est `../backend/prisma/schema.prisma`). `prisma_rules.md` : règles métier par entité. `todo.md` : reste à faire.
- `DESIGN.md` : palette, typo, composants React à construire (§9). `_reference.html` : maquette navigable.
- `en.subject.pdf` : sujet officiel (bloquant : HTTPS, `.env` ignoré + `.env.example`, pages CGU et confidentialité,
  README complet en anglais).
- `docs/api_contract.md` (ici, dans `frontend/`) : routes réelles du backend, régénéré le 24/09/2026 et resondé le 01/10/2026 (photos, avatar, commentaires d'organisation) ;
  à régénérer quand le backend change (`make db-update` après chaque pull backend, sinon la base de dev est en retard).
- `docs/data_model.md` (ici) : plan des données côté frontend, entités → modules deep et leurs interfaces, état de
  chaque feature (Epics 1-9), dettes de données ; écrit le 24/09/2026, à tenir à jour à chaque feature branchée.

## Outillage
- React 19.2, Vite 8, TypeScript 6. `tsconfig.app.json` : cible ES2023, `jsx: react-jsx`, `noUnusedLocals`,
  `noUnusedParameters`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- ESLint (flat config) : `@eslint/js` recommended, `typescript-eslint` recommended, `react-hooks` recommended,
  `react-refresh` (Vite). `npm run lint` doit être vierge avant une PR ; ne pas désactiver une règle, corriger le code.
- Installé : React Router 7 en mode data (`createBrowserRouter`, ticket #8) ; Leaflet 1.9 + react-leaflet 5 (ticket #12,
  tuiles OpenStreetMap, pins en `divIcon` CSS : jamais les PNG de Leaflet, cassés sous Vite). Prévu par
  `../Docs/architecture.md` mais **pas installé** : TanStack Query, framework CSS (TBD), Jest + React Testing Library.
  Chaque ajout passe par un ticket. Aucun test runner pour l'instant (Vitest s'intègre nativement à Vite : à trancher en équipe avant d'installer).
- CSS : CSS Modules (`X.module.css` à côté du composant) sur les variables de `styles/tokens.css`.

## Architecture des modules

### Vocabulaire d'architecture (à utiliser tel quel)

- Module : unité avec une interface et une implémentation. Ici : un dossier de feature, un hook, le client API.
- Interface : tout ce que l'appelant doit savoir (signatures, erreurs, ordre d'appel). Doit tenir en quelques lignes.
- Deep : petite interface, beaucoup de comportement caché. C'est l'objectif.
- Shallow : interface aussi complexe que l'implémentation. À éviter.
- Seam : endroit où l'on peut substituer une implémentation (ex. client API réel / mock en test).

### Règles

1. Chaque feature expose son interface via son `index.ts`. Rien d'autre n'est public.
2. Import entre features uniquement par l'`index.ts`. Jamais de chemin interne (`features/x/components/...`).
3. Pour utiliser un module, lis son `index.ts`. N'ouvre son implémentation que si la tâche la modifie.
4. Avant de créer un module, applique le test de suppression : si le supprimer ne renvoie aucune complexité chez les appelants, ne le crée pas.
5. Pas d'abstraction pour une seule implémentation. Un seam n'est réel qu'à partir de deux adaptateurs.
6. Les tests passent par l'interface, pas par les détails internes.

## TypeScript
- `verbatimModuleSyntax` : importer les types avec `import type { X } from '...'` (ou `import { type X }`).
- `erasableSyntaxOnly` : **pas d'`enum`**, pas de `namespace`, pas de propriétés de paramètre dans les constructeurs.
  Pour les enums de l'API, objet `as const` + type union :
  `export const CATEGORY = { SOCIAL: 'SOCIAL', ENVIRONMENT: 'ENVIRONMENT', CULTURAL: 'CULTURAL' } as const;`
  `export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];`
- Pas de `any` (utiliser `unknown` puis affiner). Typer les réponses API d'après `docs/api_contract.md` §3 :
  les ids sont des `string`, les dates des `string` ISO, `location` est `[lat, lng]`.
- Exports nommés uniquement (lisibilité, refactoring, compatibilité `react-refresh`) ; export default seulement si un
  outil l'exige (ex. `React.lazy`).

## React
- Composants fonction uniquement, hooks pour la logique, jamais de classe. Respecter `rules-of-hooks` et
  `exhaustive-deps` : une dépendance manquante se corrige, elle ne se commente pas.
- Nommage : composants et leurs fichiers en PascalCase (`ActionCard.tsx`), hooks en camelCase préfixés `use`
  (`useActions.ts`), utilitaires en camelCase, un composant par fichier.
- Un fichier de composant (`.tsx`) n'exporte que des composants : la règle `react-refresh/only-export-components`
  (sévérité error via `configs.vite`) n'analyse que les `.jsx`/`.tsx`. Constantes, types et helpers partagés vivent
  dans des fichiers séparés. L'`index.ts` d'une feature (Règle 1) n'est pas analysé : il réexporte composants, hooks,
  types et constantes sans avertissement. Le nommer `index.ts`, jamais `index.tsx`.
- Props : `type XProps = { ... }` explicite, pas de `React.FC`, `children` typé `ReactNode` (import type).
- État : local d'abord (`useState`, `useReducer`) ; un contexte pour l'utilisateur connecté ; pas de store global tant
  que le besoin n'est pas démontré. Les données serveur passeront par TanStack Query une fois installé.
- Effets : réservés à la synchronisation avec l'extérieur (fetch, abonnements, DOM). Pas d'effet pour dériver un état
  d'un autre : calculer pendant le rendu ou utiliser `useMemo`.
- Formulaires : composants contrôlés, validation côté client miroir des DTO backend (e-mail valide, mot de passe ≥ 8
  caractères, `location` = 2 nombres, champs obligatoires listés dans `docs/api_contract.md`). Le sujet impose la
  validation des deux côtés. Auth, plus strict que le DTO depuis le 28/10/2026 (`features/auth/validation.ts`) : mot de
  passe 8 à 64 caractères ASCII imprimables (ni espace, ni accent, ni emoji), e-mail sans espace, 254 au plus et 64
  avant le `@` (limites de `@IsEmail()`, sinon 400 = erreur console) ; `maxLength` posé sur les champs. Depuis le
  29/10/2026 la forme de l'e-mail reproduit validator.js (`@IsEmail()` par défaut) : un seul `@`, partie locale sans
  point en bord ni doublé, étiquettes de domaine de 63 au plus sans tiret en bord ni `_`, extension en lettres seules
  (2 au moins) ou punycode ; `v1@v1.v1` est refusé avant l'envoi (message « must end with letters »). Vérifié contre
  validator.js sur 54 adresses ; seul écart voulu : la partie locale entre guillemets, acceptée côté backend.
- Accessibilité (`../Docs/DESIGN.md` §5 et sujet) : label visible pour chaque champ, erreur reliée par `aria-describedby`,
  focus visible, `prefers-reduced-motion` respecté, la couleur ne porte jamais seule une information (icône + libellé).
- Chaque écran gère explicitement ses états : chargement, vide, erreur (les 404 de listes vides compris).
- Titre d'onglet : chaque page pose `<title>{pageTitle(nom)}</title>` (`shared/lib/pageTitle`) avec le nom court de la page
  (eyebrow ou entrée de nav : « My Actions », « Organizations »), jamais la phrase d'accroche du `<h1>`.

## Appels API
- URL de base dans `import.meta.env.VITE_API_URL` : `frontend/.env` (ignoré par `frontend/.gitignore`) +
  `frontend/.env.example` documenté (exigence du sujet). Déclarer les variables dans `ImportMetaEnv` (`vite-env.d.ts`),
  les lire uniquement via `shared/config/env.ts` (valide au démarrage).
- Un seul client HTTP (wrapper `fetch`) : JSON, header `Authorization: Bearer <access_token>`, erreurs normalisées
  depuis `{ statusCode, message, error }` (`message` peut être un tableau), 401 → un essai de `POST /auth/refresh`
  puis rejeu, sinon déconnexion. Seuls `/auth/login`, `/auth/register` et `/auth/refresh` sont exempts ; sans access
  token en mémoire (rechargement), ou à moins de 30 s de son expiration (`exp - iat` du JWT), le client rafraîchit
  **avant** l'appel (un 401 serait une erreur console).
- L'identité vient du JWT : jamais d'id utilisateur dans une query ou un body pour dire « qui je suis »
  (`creator_id` n'existe plus dans les DTO ; l'envoyer provoque un 400).
- Les listes filtrées renvoient 404 quand elles sont vides (`GET /actions?…`, `GET /organizations?creator_id=`) :
  le client traduit ce 404 en tableau vide.
- CORS non activé côté backend (20/09/2026) : en dev, `VITE_API_URL=/api` et `server.proxy` (`vite.config.ts`) réécrit
  `/api/*` vers `VITE_DEV_PROXY_TARGET` (`http://localhost:3000` en local, `http://backend:3000` en Docker : à passer
  par `environment:` dans le compose, ticket). Pas de contournement navigateur.
- Tokens : `access_token` (15 min) en mémoire ; `refresh_token` (7 jours) persisté côté client car le backend l'attend
  dans le body de `/auth/refresh` ; à revoir si le backend passe aux cookies httpOnly.
  Le backend fait tourner le refresh token à chaque refresh : un seul refresh à la fois dans le navigateur (verrou
  Web Locks `pioupiounades.refresh`, relecture du storage avant l'envoi) et écoute de l'événement `storage` (token
  qui a tourné dans un autre onglet → repris ; session effacée ailleurs → l'onglet se déconnecte aussi).
- Libellés UI des enums (maquette, à traduire en anglais) : `ENVIRONMENT` → « Environment », `SOCIAL` → « Mutual aid »,
  `CULTURAL` → « Culture & sharing ». Un seul endroit pour ce mapping, jamais de chaîne d'enum en dur dans le JSX.

## Style et design
- Source de vérité : `../Docs/DESIGN.md` (tokens `--brand`, `--terra`, `--surface`…, rayons, espacements, breakpoints
  760 / 1100 / 1500 px) et le CSS de `../mockup/styles.css`, à découper en composants. Composants cibles : `DESIGN.md` §9.
- Framework CSS non choisi (`architecture.md` : TBD). En attendant : CSS Modules ou CSS plain avec les variables de
  `DESIGN.md` ; aucune bibliothèque de composants sans ticket.
- Langue de l'UI : **anglais** (décision du 21/09/2026, la maquette est en français : traduire ses libellés).
  Identifiants de code en anglais. Textes UI centralisés (`app/labels.ts`, `features/<x>/labels.ts`).
- Pages obligatoires (sujet, sous peine de rejet) : Politique de confidentialité et Conditions d'utilisation, accessibles
  depuis le footer, avec un contenu réel.
- Thème : `styles/tokens.css` porte le thème clair (`:root`) et le thème noir de l'espace admin
  (`:root[data-theme='admin']`, depuis le 30/10/2026 : fond noir comme les boutons du site, pilules d'action inversées
  en blanc, citron pour l'attention et le focus, contrastes vérifiés ≥ 4.5:1). Un composant ne code jamais
  une couleur en dur : il lit un token (`--on-brand`, `--ground-hover`, `--field-bg`, `--disabled-*`…), sinon il casse
  dans le thème sombre.
- Texte : `overflow-wrap: anywhere` est posé sur `body` (`global.css`, hérité) pour qu'un mot sans espace (URL,
  description collée) se coupe au lieu d'élargir la page ; les composants gardent leurs `line-clamp`. Ne pas le
  redéclarer localement.
- Zéro erreur ni warning dans la console navigateur (exigence du sujet). Cible : dernière version stable de Chrome,
  responsive du mobile au desktop.

## Tests
- Aucun runner installé. Quand il le sera : tests à côté du code (`ActionCard.test.tsx`), orientés utilisateur
  (rôles, labels, comportements), jamais sur les détails d'implémentation.

## Structure des dossiers

Inspirée de bulletproof-react et feature-sliced, réduite à ce que le projet justifie. `src/` :

```
app/            composition root : seul endroit qui connaît tout
  main.tsx, App.tsx, router.tsx (AppRouter), routes.ts (ROUTES), labels.ts, lazyPage.ts
  layout/       PageShell (Suspense des pages paresseuses), AppHeader, BottomNav (mobile), AppFooter, navItems.ts
                (en-tête : Home, My Actions (libellé #60), Map, Organizations, Friends ; barre mobile : 5 cases, Friends
                `desktopOnly` ; depuis le 27/10/2026 la case Profile est un bouton (BottomNavMenu, motif disclosure) qui
                déplie Profile et Friends au-dessus de la pilule ; même jour, sur téléphone l'avatar de l'en-tête est HeaderMenu et
                déplie Messages, Admin et Sign out : plus de pastilles Messages / admin / déconnexion sous 761 px)
  pages/        pages sans domaine : Legal (CGU, confidentialité), NotFound, Placeholder ;
                home/ (#65) : HomePage bascule selon la session → Landing (visiteur : hero StreetScene + promesse,
                « How it works », carte vivante des actions ouvertes + 3 prochaines, catégories, bandeau
                d'inscription) ou Dashboard (connecté :
                carte compacte via NeighborhoodMap, MyActionsPanel = actions que j'organise + participations
                ouvertes par date (4 lignes, « +n more » → `/actions`), NearbyActions = actions ouvertes des autres triées par distance depuis
                `profiles/me.location` sinon Saint-Cyprien). app compose les features par leurs index.
features/       1 domaine métier = 1 module ; interface = index.ts
  auth/         session, RequireAuth, LoginPage, RegisterPage (#50), LoginForm (le formulaire seul, `{ onSignedIn? }`,
                réutilisé là où un visiteur doit se connecter sur place : « My Actions » #107) ; validation.ts miroir des DTO, errors.ts
                traduit les ApiError en messages ; les formulaires utilisent shared/hooks/useForm
  profile/      users + profiles + interests (api_contract §6-8)
  actions/      actions + carte + filtres ; owner des enums Category/ActionStatus et de leurs libellés.
                Existant (#12) : MapPage, NeighborhoodMap, ActionCard, CategoryFilter, useActions, mapConfig.ts.
                Depuis le 25/09/2026 (écart assumé avec la maquette) : carte pleine largeur, cartes en grille
                dessous ; ActionCard a un fond très léger par catégorie (`--card-*-bg` dans tokens.css).
                « My Actions » `/actions` connecté (ActionsListPage) : créées par moi ou rejointes, triées comme l'agenda de
                l'accueil (ouvertes par date, puis terminées / annulées les plus récentes d'abord : `GET /actions` arrive sans
                ordre), 6 par page, filtres catégorie / statut / texte.
                « My Actions » `/actions` pour un visiteur (#107, décision d'équipe : onboarding + connexion sur place) :
                MyActionsSignIn reprend la grammaire de l'accueil : hero (accroche, gages de confiance, StreetScene), « How it
                works » sur `Steps`, puis la carte de connexion centrée (LoginForm) ; la liste apparaît au changement de statut ;
                pendant la restauration de session, message d'attente au lieu d'une liste vide.
                Création depuis la carte (Epic 7) : NeighborhoodMap accepte `draft` / `onDraftChange` / `draftContent`
                (pin brouillon déplaçable, popup ; sans `draftContent` = simple sélecteur de lieu), `home` = quartier de
                l'utilisateur (`profiles/me.location`). Vue (29/10/2026) : le brouillon s'il y en a un, sinon `home`, sinon
                `DEFAULT_CENTER` = l'école 42 Paris (mapConfig.ts ; répété dans NeighbourhoodPicker), au zoom quartier ; les
                pins ne recadrent jamais la carte, le bouton « recentrer » les cadre tous. MapPage garde le
                lieu dans l'URL (`?at=lat,lng`, draftParam.ts), CreateActionDialog = Dialog + ActionForm, validation.ts,
                errors.ts, api/useCreateAction.
                Créer / modifier / annuler (#33, Epic 2) : ActionForm (deep : `{ location | null, action?, onSaved,
                onCancel }`, création ou modification selon `action` ; « Max participants » = champ texte
                `inputMode="numeric"` filtré aux chiffres (`toDigits`) : un `type="number"` laissait passer e + - . et valait ""
                sur saisie invalide, donc validé comme vide), ActionEditor (carte sélecteur + formulaire),
                CreateActionPage `/actions/new` (`?at=` pré-place le pin), EditActionPage `/actions/:id/edit`
                (permissions.ts : créateur ou ADMIN, PENDING/APPROVED ; CancelActionDialog = « suppression », l'API
                n'a que `cancel`), api/useAction, useUpdateAction, useCancelAction. Les pages reçoivent les chemins
                (`mapPath`, `createPath`, `editPath`) en props : la feature n'importe pas `app/`. Retour sur la carte
                par `/map?focus=<id>` (mapConfig.ts) + `state.notice`. L'index exporte aussi les briques du tableau
                de bord : NeighborhoodMap (hauteur surchargeable par `--map-min-height*`, et suit la taille de son conteneur :
                ResizeObserver → `invalidateSize`, la rangée de la landing lui donne la hauteur des cartes voisines), ActionCard (pied :
                voisins inscrits, places ; `distance` remplace le statut), useActions, geo.ts (distanceMeters,
                formatDistance), DEFAULT_CENTER, FOCUS_PARAM.
                Discussion (#70, Epic 4) : ActionComments `{ actionId }` sous la fiche (`GET`/`POST /actions/:id/comments`,
                api/useActionComments + usePostComment, validateComment ≤ 1024, toCommentErrorMessage) ; monté par
                ActionDetailPage pour le créateur et les participants seulement (`canComment` : le backend répond 403 aux autres
                et 429 sous 15 s ; délai local en sessionStorage, #114).
                Fiche réelle (#60, coéquipiers, 07/10/2026) : ActionDetailPage `{ editPath }` charge action + participants
                (`features/participations`) + profil du créateur + organisation, rejoindre / quitter / approuver / terminer ;
                ActionDetailsView = code coéquipier (React.FC, CSS global). `api/actionOrganizations.ts` porte les deux lectures
                d'organisation de la feature (fiche, choix d'organisation dans ActionForm) : `features/organizations` importe déjà
                `features/actions`, un import dans l'autre sens ferait un cycle ; seuls ses types viennent de son index. Carte (#60) :
                seules les actions `PENDING` des autres non rejointes, clic sur un pin → fiche, plus de CTA « créer » (la dialog reste).
  profile/      mon profil `/profile` (ProfilePage `{ organizationPath, actionPath, homePath }`) et profil public
                `/profiles/:userId` (PublicProfilePage `{ ownProfilePath, messagePath }`), refaits le 26/10/2026 dans la
                grammaire de la refonte : ProfileHero (bandeau = plan du quartier 42, `NeighbourhoodPlan` de shared/ui, avatar,
                pseudo, quartier, visibilité, présence, tuiles de chiffres), ProfileView = hero + AboutPanel +
                InterestsPanel + ActivityPanel (ProfilePanels.module.css = grammaire commune), ProfileTabs (pilules),
                ProfileForm (FloatingField, cartes radio de visibilité, InterestTag à bascule, NeighbourhoodPicker =
                carte OSM propre à la feature : `actions` importe déjà `profile`, donc pas de `NeighborhoodMap` ici),
                ProfileSettingsPanel (interrupteurs de notifications, désactivation via ConfirmDialog ; le droit de
                désactiver vient de `ownsActiveOrganization`, sans importer `organizations`), ProfileUnavailable
                `{ reason }`, ProfileSkeleton, RequireProfile `{ profilePath }` (garde : connecté sans profil →
                `/profile`). Données via useResource ; ce qu'on vient d'enregistrer prime sur le chargement (pas de
                rechargement après un envoi). Libellés dans labels.ts, familles d'intérêts dans interestLabels.ts
                (libellés de catégorie répétés pour éviter le cycle). api/myProfile.ts (`useMyProfile` sur useResource,
                404 → null, visiteur : aucun appel ; relit sur l'événement fenêtre `profile:updated` filtré sur mon id) sert au
                tableau de bord, aux cartes (`home` de NeighborhoodMap) et à l'avatar de l'en-tête (photo de profil sinon initiales).
  participations/ useMyParticipations (sur useResource ; visiteur : liste vide sans appel), fetchActionParticipants /
                joinAction / leaveAction (#60), type MyParticipation
  messages/     messagerie entre amis (backend #155, api_contract §18), discrète : pas d'entrée de nav, une pastille
                MessagesButton `{ to, profilePath }` : hors téléphone seulement (sur téléphone, entrée « Messages » du menu du
                compte HeaderMenu de app/, sur `useUnreadMessages` exporté par l'index) ; dès 761 px
                (`useMediaQuery`, même seuil que son CSS) bulle noire flottante en bas à droite qui ouvre MessagesDock, volet de
                380 px en portail (liste des amis → fil avec retour, Échap ferme, lien vers la page) ; rien sur `/messages` ;
                AppFooter lui réserve 104 px à droite (point citron = notifications `NEW_MESSAGE` non lues, relues toutes les
                30 s et après l'événement fenêtre `messages:read`). MessagesPage `/messages[/:friendId]` `{ listPath, threadPath,
                friendsPath, profilePath }` : ConversationList = mes amis actifs (`friendsApi.getMyFriends`, le backend ne liste
                pas les fils), ThreadPane = bandeau + MessageThread (bulles par jour, défilement au dernier message) +
                MessageComposer (Entrée envoie, 280 max, compteur dès 200) ; api/useThread = `GET /direct-messages/:friendId`
                toutes les 5 s onglet visible, relu après `POST` ; errors.ts (403 = plus amis). Ouvrir un fil ou recevoir un
                message marque lues les notifications de message (le backend ne dit pas de qui elles viennent). Sur téléphone
                un volet à la fois (`data-view`).
  organizations/  #61 : OrganizationsPage `/organizations` (liste) et OrganizationPage `/organizations/:id` (fiche
                publique + membres actifs) ; enums OrganizationStatus / RoleOrg / MemberStatus et libellés ; chemins
                reçus en props (`organizationPath`, `listPath`).
                Annuaire (#63) : `GET /organizations` renvoie tout, le reste est côté client (directory.ts, pur) :
                recherche sans accents ni casse sur titre + adresse + description (chaque mot doit s'y trouver ;
                `GET /organizations/search`, 15 max et titre seul, n'est plus appelée), tri Nearest (défaut, depuis
                `profiles/me.location` sinon DEFAULT_CENTER) / Name / Newest, « All / Mine » pour un connecté
                (api/useMyMemberships = `GET /organization-members/user/:id/organizations`, mon rôle par
                organisation), fermées et suspendues masquées sauf case « Show closed or suspended (n) », 12 cartes
                puis « Show n more ». La vue vit dans l'URL (`?q=&sort=&scope=&closed=1`, défauts omis, `replace`) :
                le retour du navigateur depuis une fiche retrouve la liste. DirectoryToolbar = barre sans état ;
                OrganizationCard porte la distance et mon rôle ; la constellation reçoit la liste filtrée.
                Constellation (25/09/2026) : OrganizationConstellation (SVG, `aria-hidden`, la liste reste l'accès
                clavier) = graphe orienté par la force, utilisateur au centre (`profiles/me` si connecté, sinon nœud
                générique et DEFAULT_CENTER), fils dont la longueur suit le rang de distance, fils secondaires entre
                voisines < 1,5 km, clic = fiche, glisser = épingler. forceSimulation.ts (pur, sans d3),
                hooks/useForceLayout (rAF, drag par pointer capture, reduced-motion = disposition immédiate).
                Discussion (#71, Epic 4) : OrganizationComments `{ organizationId, creatorId }` sur la fiche, sous
                « About » (`GET`/`POST /organizations/:id/comments`, body `{ comment }` ; `DELETE
                /organizations/comments/:id` par l'auteur ou le créateur, confirmé par DeleteCommentDialog) ;
                api/useOrganizationComments (`prepend`, `remove`), validation.ts, errors.ts.
                Fiche complète (#64) : en-tête avec MembershipStatus (mon rôle si je suis dans la liste publique des
                membres actifs, sinon « Join » = `POST /organization-members/organization/:id/join` ; anonyme →
                `/login` avec `state.from` ; pas de « Join » sur une organisation inactive). Le backend ne laisse pas
                un demandeur lire sa demande : après rechargement le bouton revient, et `toJoinFailure` traduit le
                409 / 403 du second clic (en attente, refusée, déjà membre, banni). OrganizationActions = actions à
                venir (lien vers la carte, `upcomingActionPath` fourni par `app/`) puis terminées (sans lien tant
                que la fiche d'action est un mock, #60), filtrées côté client sur `useActions` : la route filtrée
                répond 404 quand elle est vide, donc une erreur console. Panneau « Where » = `PlaceMap` de la
                feature actions (mini-carte à un pin, hauteur par `--map-min-height*`). Pas de « Leave » (décision
                du 02/10/2026).
                Gestion (#62) : OrganizationManagePage `/organizations/:id/manage` (sous `RequireAuth`), ouverte par
                le bouton « Manage » de la fiche pour les MANAGER, OWNER et ADMIN. Le droit d'entrer se lit dans la
                liste publique des membres avant d'appeler `GET …/memberships` (403 = erreur console). Onglets
                (ManageTabs, motif ARIA, `?tab=`) : Requests (approuver, refuser avec confirmation ; refusées en
                lecture seule), Members (MemberActionDialog = choix d'une action, puis ConfirmDialog : promouvoir,
                rétrograder, céder la propriété, retirer, bannir ; bannis en lecture seule), Settings (nom,
                description, adresse ; fermer / rouvrir). permissions.ts = miroir des règles du backend (jamais
                sur soi ni sur le owner, un manager n'agit que sur des MEMBER, rôles réservés au owner / ADMIN).
                Les réponses du backend sont rejouées localement (pas de rechargement de liste). Organisation
                inactive : demandes et membres en lecture seule. Manques backend : pas de débannissement ; pas
                d'« ajouter un membre » côté UI (non demandé).
                Création (#106) : CreateOrganizationPage `/organizations/new` (sous `RequireAuth` ; bouton « Create an
                organization » dans l'en-tête de l'annuaire, connectés seulement) = NeighborhoodMap en simple sélecteur
                de lieu (pin déplaçable, sans popup) + OrganizationForm (nom ≤ 80, description ≤ 500, adresse ≤ 200 ; validation.ts,
                lieu réclamé à l'envoi comme ActionForm) → `POST /organizations` (api/organizationsApi
                `createOrganization`). Le backend crée le membre `OWNER` depuis #135 (09/10/2026) : la fiche de la
                nouvelle organisation affiche « You own this organization » et « Manage » dès l'arrivée, sans message.
  admin/          Epic 8, réservé au rôle ADMIN. AdminLayout (route parente `/admin/*`) pose le thème noir
                `data-theme="admin"` sur <html> le temps de la visite et porte la barre d'onglets Accounts / Actions /
                Organizations : des NavLink (une URL par section, `aria-current`), chemins reçus en props. Trois pages
                sœurs sur le même squelette : AdminPage.module.css, hooks/useAdminList (lignes remplacées par la
                réponse du backend sans rechargement, recherche, filtre par statut avec compteurs, 20 par 20),
                tableaux sur AdminTable.module.css (cartes sous 760 px, statut = icône + libellé + couleur, dont
                `--pending`), confirmation par ConfirmDialog de shared/ui, erreurs traduites par errors.ts.
                #22 AdminUsersPage `/admin/users` : tous les comptes via `GET /users`, bloquer / débloquer =
                `suspend` / `reactivate` (jamais sur soi ni sur un `DEACTIVATED` ; `blockUser` relit le compte, la
                réponse de `suspend` porte les points d'avant la pénalité de 50). #196 (30/10/2026) : en bout de ligne,
                le geste de modération puis RowMenu « More » (motif disclosure sur useDisclosure : View profile, Edit
                profile, Make admin / Make user, Delete account ; une entrée indisponible reste visible avec sa raison) ;
                AdminAccountCreator (Dialog : e-mail + mot de passe initial, mêmes règles que l'inscription via `validateEmail` /
                `validatePassword` exportés par l'index de `features/auth`, sinon 400 ; `POST /users`) et AdminProfileEditor
                (Dialog : pseudo, description, visibilité en puces radio, `GET /profiles/admin/:id` puis
                `PATCH /profiles/:id`) sur AdminForm.module.css ; chemins des fiches (`profilePath`, `ownProfilePath`)
                en props ; AdminTable sans `overflow: hidden` (les menus dépassent du panneau), arrondis portés par les
                cellules d'angle. #23 AdminActionsPage
                `/admin/actions` : toutes les actions (`useActions`), « Approve » = `approve`, proposé seulement dès
                `min_participants` inscrits (sinon le texte « n of 3 needed to approve » : le backend refuserait),
                « Hide » = `cancel` (l'API n'a ni rejet ni suppression, irréversible) ; AdminOrganizationsPage
                `/admin/organizations` : « Suspend » (ADMIN seulement), « Close », « Reactivate » / « Reopen » =
                `reactivate`. Les titres mènent aux fiches publiques : pas de fiche admin. Accès : `RequireAuth` >
                `RequireRole` (feature auth), un non-admin voit la page 404 ; entrée « Admin » dans l'en-tête pour
                les seuls admins (icône seule sur mobile, la barre basse garde cinq entrées). Catégories / rôles
                (#24), rejet d'action, suppression de commentaire ou de photo par un admin :
                pages sœurs à venir, backend incomplet.
  friends/        coéquipier (LeNy, #66 / #68, PR #104) : FriendsPage `/friends` (protégée), api/friendsApi, useSocialManagement
  <feature>/
    api/        fonctions fetch typées + hooks useX : seuls appelants de shared/api
    components/ privés au domaine
    pages/      écrans routés (XPage.tsx)
    hooks/      logique React privée
    types.ts    d'après api_contract.md §3
    labels.ts   textes UI du domaine
    index.ts    l'interface, 10 à 20 lignes max
shared/         zéro connaissance métier, réutilisable ailleurs
  api/          client HTTP (deep), index.ts
  ui/           kit DESIGN.md §9 (Button, FloatingField, CategoryChip, Dialog, Spinner, ErrorMessage…), index.ts.
                Existant : Button, ButtonLink, Avatar, Icon (+ iconMarkup pour les hôtes HTML), Chip, FloatingField
                (label flottant, aide/erreur reliées, bascule mot de passe, types text/email/password/number/
                datetime-local), FloatingTextarea (même habillage, privé : FieldShell + fieldA11y), Checkbox (libellé
                riche), Dialog (`<dialog>` natif : `{ open, onClose, title, closeLabel }`, enfants montés si ouvert),
                StreetScene (illustration de rue de la maquette, décorative ; l'hôte fixe la hauteur : auth, landing),
                NeighbourhoodPlan (plan OSM du quartier de 42 Paris, `neighbourhood42.ts` généré par
                docs/refonte/osm/gen_neighbourhood.py ; `focusHeight` = bande centrée sur l'école : fond des pages
                d'auth, bandeau du profil),
                Steps (trois étapes numérotées sur cartes teintées `{ steps: Step[] }` : « How it works » de la landing et de
                la page My Actions visiteur),
                CommentThread (fil à plat `{ comments: ThreadComment[], mineLabel, deletion? }` : bouton de
                suppression sur les commentaires `canDelete`, la confirmation reste chez l'appelant) et CommentComposer (zone de texte +
                compteur + bouton : `{ label, maxLength, submitLabel, submittingLabel, validate, onSubmit, describeError }`)
  hooks/        hooks React sans métier, pas de barrel : useForm (valeurs, erreurs après blur/soumission, erreur
                serveur via un mapper fourni, focus du 1er champ invalide dont l'`id` = son nom) ; useDisclosure (bouton qui déplie
                un panneau : Échap, tap dehors, focus de retour ; menus de la barre basse et de l'en-tête) ; useResource
                (`load` stable → `{ data, loading, error, reload }`, annulation, utilisé par organizations, profile,
                participations, messages, admin ; candidat pour remplacer les hooks maison de actions). Aucun hook de
                shared n'écoute un événement fenêtre métier (`user:*`, `organization:*`, `action:*`) : c'est la feature
                qui écoute et appelle `reload` (OrganizationPage, useOrganizations, useMyMemberships,
                useMyParticipations, messages/useFriendsList, profile/useMyProfile), filtrée par id quand l'événement en porte un
  lib/          fonctions pures, pas de barrel (test de suppression négatif) : pageTitle, formatDate, prefersReducedMotion
  config/       env.ts : lit et valide VITE_API_URL
styles/         tokens.css (DESIGN.md), reset.css, global.css
assets/
```

### Dépendances
- Une seule direction : `app → features → shared`. Jamais l'inverse.
- Feature → feature par l'`index.ts` uniquement, sans cycle. Un cycle = fusionner les deux features ou remonter le
  morceau dans `shared`.
- Vérifié par ESLint `no-restricted-imports` (règle core) : chemins internes `**/features/*/*` interdits, `@/app/*`
  interdit depuis `features` et `shared`, `@/features/*` interdit depuis `shared`.
- Alias `@/` = `src/` : `paths` dans `tsconfig.app.json` + `resolve.alias` dans `vite.config.ts`.

### Feature ou module partagé ?
- Feature : possède des routes de `docs/api_contract.md` et/ou des écrans. Test : si le backend supprime le domaine,
  le dossier disparaît entier.
- Partagé : ne connaît aucun type métier. `shared/api` et `shared/ui` ont un `index.ts` (plusieurs appelants) ;
  `shared/lib` et `shared/hooks` n'en ont pas, import direct du fichier.
- Libellés d'enum : dans la feature propriétaire de l'enum (`features/actions/labels.ts`, réexporté par son index).
  Pas de dossier `constants` global.
- `NeighborhoodMap` reste dans `features/actions` ; passe en `shared/ui` seulement quand un 2e domaine l'utilise.

### Modules deep de référence
- `shared/api` : interface = `http.get/post/patch/delete/list(path, body?, { query, signal })`, `ApiError { status,
  messages, isNetwork }`, `session.set/clear/onExpire/userId`. Caché : base URL, Bearer, refresh anticipé (30 s avant
  `exp`) ou sur 401 (dédupliqué, verrou Web Locks entre onglets, synchro `storage`) → rejeu, `http.list` traduit le 404
  en `[]`, `message` tableau normalisé, réseau → `status 0`.
  Les tokens vivent ici ; `features/auth` appelle seulement `session.set(tokens, userId)`.
- `features/auth` : interface = `AuthProvider`, `useAuth() → { status, user, signIn, signUp, signOut }`, `RequireAuth`,
  `LoginPage`, `RegisterPage` (reçoit les chemins des pages légales en props : une feature n'importe pas `app/`).
  Après connexion, la page redirige vers `state.from` (posé par `RequireAuth`, query comprise) sinon `/`.
- `features/x/api/` : seule couche qui appelle `http`. Pages et composants ne voient que des hooks, ce qui rend
  TanStack Query branchable sans toucher aux composants.

### Chargement paresseux
Exports nommés partout, barrels compris. Un seul helper, `app/lazyPage.ts` :
```ts
export const lazyPage = <P extends object>(load: () => Promise<ComponentType<P>>) =>
  lazy(() => load().then((page) => ({ default: page })));
// router.tsx : lazyPage(() => import('@/features/actions').then((m) => m.MapPage)) ; les props de la page sont conservées
```
Un chunk = une feature. Jamais d'export default dans un barrel.

### Tests (complète la Règle 6)
- Colocalisés (`ActionsPage.test.tsx`) mais importent l'interface : `from '..'` (index de la feature) ou `from '.'`
  (composant `shared/ui`).
- Un composant privé n'a pas de test direct : le besoin d'en tester un signale qu'il doit devenir un module
  (`shared/ui`) ou être couvert via sa page.
- Doubles au niveau réseau (`vi.stubGlobal('fetch', …)` ou équivalent). Aucun seam ajouté dans le code (Règle 5) :
  le seam réel est `fetch`.

### Écarts assumés avec `../Docs/architecture.md` §4
Pas de `pages/`, `services/`, `hooks/`, `contexts/`, `types/` à plat : chaque chose vit dans la feature propriétaire,
sinon les interfaces deviennent shallow et les imports se croisent. `router.tsx` est le seul fichier qui changera à
l'arrivée de React Router.

## Plans et questions ouvertes
- À la fin de chaque plan : liste des questions non résolues auxquelles répondre, s'il y en a.
- Questions très concises ; sacrifier la grammaire pour la précision.
