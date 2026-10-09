# Contrat d'API — backend NestJS (état réel du code)

Généré le 2026-09-24 par lecture de `backend/src/**/*.controller.ts`, `backend/src/**/dto/*.ts`,
`backend/src/**/*.service.ts`, `backend/src/auth/**`, `backend/src/main.ts` et `backend/prisma/schema.prisma`
(dernier commit backend : `5ff1c392`, 2026-09-24, PR #49), puis **vérifié par sondes HTTP** sur le backend de dev
(flux complet création → participations → `approve` → commentaires → `complete` → points ; amis ; organisation).
Ce fichier décrit ce que le code **fait**, pas ce que `Docs/prisma_rules.md` prévoit. À régénérer à chaque changement du backend.

**Relu et resondé le 2026-10-08** (backend `cc7168e0` : PR #102 fiche d'action, #109 notifications, #114 anti-spam des
commentaires) : modules `actions`, `participations`, `organizations`, `organization-members`, `friend-requests`, nouveau
module `notifications`, `app.module.ts`, `schema.prisma`. Auth, users, profiles, interests, friendships et points n'ont pas changé.

**Changements depuis la version du 2026-10-01** (vérifiés par sondes sauf mention) :
- **Notifications** (§17) : nouveau module `/notifications` (5 routes JWT : mes notifications, lue / toutes lues, préférences
  par type), tables `notifications` et `notification_preferences`, enum `NotificationType` (§2), forme `Notification` (§3).
  Émises par `participate` (minimum / plafond atteint), `approve`, `cancel`, `complete`, les commentaires d'action et
  d'organisation, les demandes d'adhésion et d'amitié. Pas de temps réel : le front interroge la liste.
- **Commentaires d'action** (§15) : réservés au **créateur et aux participants** (403 sinon) ; **15 s minimum entre deux
  commentaires d'un même compte**, toutes actions confondues (429) ; notification `ACTION_COMMENT` au créateur et aux participants.
- **Fichiers uploadés enfin servis** : `ServeStaticModule` monte `backend/uploads` sur **`/static`** (`/static/actions/<uuid>.webp`,
  `/static/avatars/<uuid>.webp`) ; 404 pour un fichier absent. Le défaut signalé le 01/10 est corrigé ; le proxy Vite relaie
  déjà `/static` vers le backend (§16).
- Dev : deux migrations (`add_notifications`, `add_action_status_notification`) → `make db-update` après le pull. Sans elles
  aucune 500 : `notifyUser` avale ses erreurs et les notifications sont simplement perdues.


Historique — **relu et resondé le 2026-10-01** pour tous les modules modifiés depuis (backend `39bc86e3`, PR #75 profils, #86 seed,
#88 photos, #89 commentaires d'organisation) : `actions`, `profiles`, `organizations`, `organization-members`, `main.ts`,
`schema.prisma`. Les autres modules (auth, users, interests, friend-requests, friendships, participations, points) n'ont
pas changé depuis le 24/09.

Changements de la version du 2026-10-01 par rapport au 2026-09-24 (tous vérifiés par sondes) :
- **Photos d'action** : `imagesList` disparaît (400 si envoyé), remplacé par **`images_before`** et **`images_after`** (§3, §15).
  Nouvelles routes d'upload `POST /actions/:id/photo-before` et `photo-after` (multipart, champ `file`, 3 photos max chacune).
- **Avatar** : `PATCH /profiles/me/avatar` (multipart, champ `file`, 5 Mo) (§7).
- **Les fichiers uploadés ne sont servis nulle part** : l'API renvoie des URLs `/static/actions/<uuid>.webp` et
  `/static/avatars/<uuid>.webp`, mais ni `main.ts` ni `app.module.ts` ne montent de dossier statique → 404 (§1, §16).
- **`PATCH /actions/:id` ne renvoie plus 500** : `title` seul ou `max_participants` seul → 200. Nouveau bug : les deux
  listes de photos absentes du body sont **remises à `[]`** (§15).
- **Profils** : champ `commune` (déduit de `location` par `geo.api.gouv.fr`, `null` hors France ou en cas d'échec) ;
  `GET /profiles/:userId` renvoie en plus `interests` et répond 404 (au lieu de 500) sur un id non numérique ; un profil
  `FRIENDS_ONLY` ou `PRIVATE` reste **404 pour tout le monde**, amis et propriétaire compris (§7).
- **Commentaires d'organisation** : `POST` / `GET /organizations/:id/comments`, `DELETE /organizations/comments/:commentId` (§12).
- Dev : `make seed` (comptes `demo.seed.<prénom>@example.test` / `DemoPass123!`, détail dans `tests/Seed_Details.md`),
  `make db-reset` (**efface la base**). #88 importe `sharp`, `uuid` et `@types/multer` absents de `backend/package.json` :
  tant que ce n'est pas corrigé, `npm install --no-save sharp uuid @types/multer` dans le conteneur backend, puis `make db-update`.


Historique — version du 2026-09-24, changements depuis le 2026-09-23 (commit `c22b7785`) — PR #43 amis, #44 actions, #45 participations, #49 commentaires :
- `GET /actions` et `GET /actions/:id` renvoient en plus **`participant_count`** et **`remaining_seats`** (§3, §15). Les mutations
  (`POST`, `PATCH`, `approve`, `cancel`, `complete`) renvoient l'action **sans** ces deux champs (`ActionRecord`).
- `POST /actions` accepte `max_participants` (entier **≥ 3**, sinon 400) ; `imagesList` est de nouveau persisté ; l'organisation
  est vérifiée (404 / 400 / 403). `min_participants` vaut 3 (défaut base, jamais saisi) ; `validated_at` est `null` jusqu'à `approve`.
- **`PATCH /actions/:id` est cassé** : sans `organization_id` dans le body → **500 après avoir appliqué la mise à jour** (§15).
- `approve` et `complete` exigent **≥ 3 participants hors créateur** : le cycle réel est « `PENDING` = inscriptions ouvertes →
  `APPROVED` = confirmée, inscriptions closes → `COMPLETED` » (§16). Le créateur ne peut pas participer à sa propre action.
- Commentaires : `POST` / `GET /actions/:id/comments` (§15), table `action_comments`.
- `PATCH /friend-requests/me/send` : `addressee_id` est désormais une **chaîne numérique** (`"12"`), un entier → 400.
  Une demande `REJECTED` n'empêche plus d'en renvoyer une. Formes des listes d'amis et de demandes confirmées (§3).
- Écritures concurrentes : transactions `Serializable` rejouées 3 fois (`participate`, `cancelParticipation`, `sendFriendRequest`,
  `PATCH /actions/:id`) ; au-delà → 400 « … please try again ».
- **Inchangés** depuis le 23/09 : auth, users, profiles, interests, organizations, organization-members, point-transactions, `main.ts`.
- Dev : après un `git pull` du backend, `make db-update` (`prisma generate` + `migrate deploy`) ; sinon 500 sur les commentaires
  (table absente) et `validated_at` renseigné dès la création.

Historique — version du 2026-09-23 (commit `c22b7785`, PR #40) : disparition de `?current_user_id=` au profit de `JwtAuthGuard`
(`creator_id` dans un body → 400) ; `refresh_token` retiré de `/users/*` ; `GET /users/me` ; `PATCH /users/me/...` ;
`suspend`/`reactivate` réservés à `ADMIN` ; routes `/organizations/:id` (update, suspend, deactivate, reactivate) ;
modules `/organization-members` (14 routes) et `/point-transactions` (1 route admin) ; barème de points automatique (§14).

## 1. Conventions globales

- **Base URL** : `http://localhost:3000` (port NestJS, exposé par `docker/docker-compose.yml`).
  Aucun préfixe `/api`, aucun versionnement, pas de Swagger.
- **CORS** : toujours **non activé** dans `backend/src/main.ts`. Proxy Vite obligatoire en dev (`frontend/CLAUDE.md`).
- **Format** : JSON en entrée (`Content-Type: application/json`) et en sortie. Dates en chaînes ISO 8601.
  Exception : les trois routes d'upload attendent du `multipart/form-data` avec un champ **`file`** (§7, §15).
- **Validation** : `ValidationPipe` global avec `whitelist`, `forbidNonWhitelisted`, `transform`.
  Tout champ absent du DTO → **400**. Les query params et path params ne sont **pas** validés (reçus en `string`),
  sauf dans `/organization-members` où un id non numérique → **400** « `<champ>` must be a valid integer ».
- **Identifiants** : `BigInt` en base. En **réponse**, tous les ids sont des **strings** (`"12"`) : soit par mapping
  explicite dans le service, soit par le patch global `BigInt.prototype.toJSON` de `main.ts` (routes qui renvoient
  l'objet Prisma brut : `POST /actions`, `/organization-members/*`, `/point-transactions/*`).
  En **entrée** : dans un body, un id est un **entier** (`organization_id: 12`) ; dans l'URL, une string.
  Hors `/organization-members` et `/actions/:id/comments` (400 « Validation failed (numeric string is expected) »),
  un id non numérique dans l'URL (`BigInt("abc")`) provoque un **500** (y compris les commentaires d'organisation) ;
  `GET /profiles/:userId` répond 404.
- **Localisation** : `location` = tableau `[latitude, longitude]` de 2 nombres (pas de PostGIS).
  Les recherches par rayon se font en mémoire (haversine, rayon en km).
- **Erreurs** : format NestJS `{ "statusCode": 400, "message": "Email is already used", "error": "Bad Request" }`.
  Pour une erreur de validation, `message` est un **tableau** de strings.
  Erreurs Prisma non interceptées (`update`/`delete` sur un id inexistant, enum invalide en query, clé étrangère
  inconnue) → **500**. Codes utilisés : 400, 401, 403, 404, **409** (nouveau, `/organization-members` et points), 500.
- **Codes de succès** : `POST` → 201 sauf `/auth/login`, `/auth/logout`, `/auth/refresh` → 200 ; `GET`/`PATCH`/`DELETE` → 200.
- **Authentification** : **JWT uniquement**. Header `Authorization: Bearer <access_token>` (durée 15 min).
  Refresh token (7 jours) envoyé dans le **body** de `POST /auth/refresh`. Payload : `{ id: string, email, role }` → `req.user`.
  Un guard `JwtAuthGuard` manquant/invalide/expiré → **401**. Le rôle du JWT n'est **pas** utilisé par les guards :
  les contrôles `ADMIN`/`OWNER`/`MANAGER` sont faits dans les services en relisant l'utilisateur en base.
- **Statut de compte** : la plupart des opérations exigent `account_status = ACTIVE` pour l'utilisateur courant
  (sinon **400**, parfois **403** dans `/organization-members`). Un compte `DEACTIVATED` garde un JWT valide mais
  se fait refuser presque partout.
- **Guards existants** : `JwtAuthGuard` (stratégie `jwt`, header Bearer) et `JwtRefreshGuard` (stratégie `jwt-refresh`,
  body `refresh_token`). Aucun guard de rôle : `RolesGuard` n'existe pas. `OptionalJwtAuthGuard` existe
  (`auth/guards/optional-jwt-auth-guard.ts`) mais **n'est branché sur aucune route**.
- **Fichiers** : upload par `multer` vers `backend/uploads/{avatars,actions}` (dossier ignoré par git), extension du nom
  de fichier `jpg`/`jpeg`/`png`/`webp` exigée, conversion en WebP par `sharp`, nom `<uuid>.webp`. L'URL enregistrée est
  `/static/<dossier>/<uuid>.webp`, **mais aucune route ne sert `/static`** (404 côté backend ; via le serveur Vite, la
  page `index.html`). Un upload refusé après conversion (403, 404, quota) laisse le fichier `.webp` orphelin sur le disque.
- **Concurrence** : `participate`, `cancelParticipation`, `sendFriendRequest` et `PATCH /actions/:id` tournent dans une
  transaction `Serializable` rejouée 3 fois ; au-delà → 400 « … please try again » (à proposer de réessayer).

## 2. Enums (`backend/prisma/schema.prisma`)

| Enum | Valeurs |
|---|---|
| RoleApp | `USER`, `ADMIN`, `MODERATOR` |
| AccountStatus | `ACTIVE`, `SUSPENDED`, `DEACTIVATED` |
| ProfileVisibility | `PUBLIC`, `PRIVATE`, `FRIENDS_ONLY` |
| Category (actions) | `SOCIAL`, `ENVIRONMENT`, `CULTURAL` |
| InterestCategory | `ENV_FLOWER_POWER`, `ENV_CLEAN`, `ENV_DO`, `SOCIAL_SHARE`, `SOCIAL_MEET`, `SOCIAL_DO`, `CULTURAL_LEARN`, `CULTURAL_CREATE`, `CULTURAL_DO` |
| ActionStatus | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |
| OrganizationStatus | `ACTIVE`, `SUSPENDED`, `CLOSED` |
| MemberStatus (organisation) | `PENDING`, `ACTIVE`, `REJECTED`, `BANNED` |
| RoleOrg | `MEMBER`, `MANAGER`, `OWNER` |
| FriendRequestStatus | `PENDING`, `ACCEPTED`, `REJECTED` |
| FriendshipStatus | `ACTIVE`, `BLOCKED` |
| PointReason | `ACTION_COMPLETED`, `ACTION_PARTICIPATED`, `ACTION_PARTICIPANTS`, `ORGANIZATION_MEMBER_JOINED`, `ORGANIZATION_MEMBER_LEFT`, `ORGANIZATION_MEMBER_REMOVED`, `ORGANIZATION_MEMBER_BANNED`, `USER_SUSPENDED`, `USER_BANNED_FROM_ORGANIZATION`, `ADMIN_ADJUSTMENT` |
| NotificationType | `ACTION_MIN_REACHED`, `ACTION_MAX_REACHED`, `ACTION_COMMENT`, `FRIEND_REQUEST`, `ORGANIZATION_JOIN_REQUEST`, `ORGANIZATION_COMMENT`, `ACTION_APPROVED`, `ACTION_STATUS_CHANGED`, `NEW_MESSAGE` (déclaré, jamais émis : pas de messagerie) |
| PiouPiouStatus | `PETIT_PIOUPIOU`, `GRAND_PIOUPIOU`, `PIOUPIOU_OR` (déclaré, utilisé par aucun modèle) |

## 3. Formes de réponse (types réutilisés ci-dessous)

```ts
// User : password_hash et refresh_token retirés partout.
type User = {
  user_id: string; email: string; role: RoleApp; account_status: AccountStatus; points: number;
  created_at: string; updated_at: string;
};
type Tokens = { access_token: string; refresh_token: string };

// Profile : location retirée partout sauf sur GET /profiles/me ; interests seulement sur GET /profiles/:userId.
type Profile = {
  user_id: string; username: string; description: string | null; profile_picture: string | null;
  commune: string | null;            // déduite de location à la création / modification, null hors France
  visibility: ProfileVisibility; location?: [number, number]; interests?: InterestCategory[];
};
type UserInterest = { user_id: string; interest: InterestCategory };
// username et profile_picture valent null quand l'utilisateur n'a pas encore de profil (cas normal après register).
type UserCard = { user_id: string; username: string | null; profile_picture: string | null };

type Organization = {
  organization_id: string; title: string; description: string; organization_status: OrganizationStatus;
  address: string; location: [number, number]; creator_id: string; created_at: string; updated_at: string;
};

// OrganizationMember : objet Prisma brut (ids → string par le patch toJSON).
type OrganizationMember = {
  organization_id: string; user_id: string; status: MemberStatus; role: RoleOrg;
  validated_by_org_man: boolean; validated_at: string | null; created_at: string; updated_at: string;
};
type MemberUser = {
  user_id: string; account_status: AccountStatus;
  profile: { username: string; description: string | null; profile_picture: string | null } | null;
};
type MemberWithUser = OrganizationMember & { user: MemberUser };
type MembershipWithOrganization = OrganizationMember & { organization: Organization };

// Action « brute » : réponse de POST /actions, PATCH /actions/:id, approve, cancel, complete, photo-before, photo-after.
type ActionRecord = {
  action_id: string; title: string; description: string; creator_id: string; organization_id: string | null;
  min_participants: number;          // 3 (défaut base), jamais saisi via l'API
  max_participants: number | null;   // null = pas de plafond
  location: [number, number]; status: ActionStatus; category: Category;
  images_before: string[]; images_after: string[];   // URLs `/static/actions/<uuid>.webp`, 3 max par upload (§15)
  validated_by_user_id: string | null;
  validated_at: string | null;       // null jusqu'à approve
  scheduled_at: string; created_at: string; updated_at: string;
};
// Action « enrichie » : GET /actions (avec ou sans filtre) et GET /actions/:id.
type Action = ActionRecord & {
  participant_count: number;         // tous les participants (le créateur ne peut pas s'inscrire)
  remaining_seats: number | null;    // max(max_participants − participant_count, 0) ; null sans plafond
};

// Commentaire : objet Prisma brut + auteur (profile null si l'auteur n'a pas de profil).
type ActionComment = {
  comment_id: string; content: string; created_at: string; updated_at: string; user_id: string; action_id: string;
  user: { user_id: string; profile: { username: string; profile_picture: string | null } | null };
};

// Commentaire d'organisation (01/10) : même forme que `ActionComment`, `organization_id` à la place de `action_id`.
type OrganizationComment = {
  comment_id: string; content: string; created_at: string; updated_at: string; user_id: string; organization_id: string;
  user: { user_id: string; profile: { username: string; profile_picture: string | null } | null };
};

type Participation = { action_id: string; user_id: string; created_at: string };
type Participant = UserCard & { created_at: string };
type MyParticipation = {
  action_id: string; title: string; description: string; status: ActionStatus; category: Category;
  scheduled_at: string; created_at: string; organization_id: string | null;
};

type FriendRequest = {
  friend_request_id: string; requester_id: string; addressee_id: string; status: FriendRequestStatus;
  created_at: string; responded_at: string | null;
};
type SentRequest = { friend_request_id: string; status: FriendRequestStatus; created_at: string; addressee: UserCard };
type ReceivedRequest = { friend_request_id: string; status: FriendRequestStatus; created_at: string; requester: UserCard };
type FriendSummary = UserCard & { status: FriendshipStatus; created_at: string };
type Friendship = {
  user1_id: string; user2_id: string; status: FriendshipStatus; blocked_by_user_id: string | null; created_at: string;
};

type PointTransaction = {
  point_transaction_id: string; user_id: string; points: number; reason: PointReason;
  event_key: string; created_at: string;
};

// Notifications (§17). `link` est un chemin du front, ou null (demande d'ami).
type Notification = {
  notification_id: string; user_id: string; type: NotificationType; title: string; message: string;
  link: string | null; read: boolean; created_at: string;
};
type NotificationPreference = { user_id: string; type: NotificationType; enabled: boolean }; // absente = activée
```

Dans les tableaux ci-dessous, **JWT** = `JwtAuthGuard` (401 si token absent/invalide/expiré), **aucun** = route publique.

## 4. Racine

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /` | aucun | — | `"Hello World!"` (texte) | — |

## 5. Auth — `/auth` (`auth.controller.ts`) — inchangé

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `POST /auth/register` | aucun | body `CreateUserDto` : `email` (format e-mail), `password` (string, ≥ 8) | 201 `{ user: User, access_token, refresh_token }` | 400 « Email is already used » ; e-mail mis en minuscules ; le refresh token est stocké hashé en base |
| `POST /auth/login` | aucun | body `LoginDto` : `email`, `password` (≥ 8) | 200 `{ user: User, access_token, refresh_token }` | 401 « Invalid credentials » (e-mail inconnu ou mot de passe faux) |
| `POST /auth/logout` | JWT | — (body ignoré) | 200 `{ message: "Logout successful" }` | 401 « Invalid token » ; efface le refresh token en base. Un access token expiré empêche le logout serveur |
| `POST /auth/refresh` | `JwtRefreshGuard` | body `{ refresh_token: string }` (préfixe `Bearer ` toléré ; pas de DTO, champs supplémentaires acceptés) | 200 `Tokens` (rotation : nouveau couple, l'ancien refresh devient invalide) | 401 token absent/invalide/expiré ; 401 « Access Denied » si le token ne correspond pas au hash en base (ex. après logout) |
| `GET /auth/me` | JWT | — | 200 `User` | 401 ; 404 « User not found » |

Script de test manuel : `tests/test_auth.sh` (curl + jq).

## 6. Users — `/users` (`users.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /users` | aucun | — | `User[]` (tous statuts, ordre non garanti) | **aucune garde** : e-mails, rôles et statuts de tous les comptes lisibles sans connexion (à signaler). Utilisée par `/admin/users` (#22) |
| `GET /users/me` | JWT | — | `User` | 404 « User not found ». Équivalent de `GET /auth/me` |
| `GET /users/:id` | aucun | — | `User` | 404 « User not found » |
| `POST /users` | aucun | body `CreateUserDto` (`email`, `password` ≥ 8) | 201 `User` | 400 « Email is already used ». Doublon de `/auth/register` sans tokens |
| `PATCH /users/me/email` | JWT | body `UpdateUserDto` : `email?` (format e-mail) | `User` | 400 « Email is already used » ; body vide = aucune modification |
| `PATCH /users/me/password` | JWT | body `UpdatePasswordDto` : `password` (≥ 8) | `User` | aucune vérification de l'ancien mot de passe |
| `PATCH /users/me/deactivate` | JWT | — | `User` (`DEACTIVATED`) | irréversible via l'API (voir `reactivate`) ; le JWT reste valide jusqu'à expiration |
| `PATCH /users/:id/suspend` | JWT, **ADMIN** | — | `User` (`SUSPENDED`) ; crée une transaction **−50** points (`USER_SUSPENDED`) ; **`points` de la réponse = solde d'avant la pénalité** (vérifié le 02/10/2026 : relire `GET /users/:id`) | 404 « User not found » (appelant), « User to suspend not found » ; 403 « Only an admin can suspend a user » ; 400 « User is already suspended » |
| `PATCH /users/:id/reactivate` | JWT, **ADMIN** | — | `User` (`ACTIVE`) | 404 ; 403 « Only an admin can reactivate a user » ; 400 « Only a suspended account can be reactivated » (un compte `DEACTIVATED` n'est **pas** réactivable) |

Pas de route de suppression de compte.

## 7. Profiles — `/profiles` (`profiles.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /profiles` | aucun | — | `Profile[]` (visibilité `PUBLIC` et compte `ACTIVE` uniquement, sans `location`, avec `commune`) | — |
| `GET /profiles/search?q=` | aucun | query `q` (sous-chaîne du `username`, insensible à la casse) | `Profile[]` (max 15, publics + actifs, sans `location`) | `q` absent → renvoie les 15 premiers profils publics |
| `GET /profiles/me` | JWT | — | `Profile` **avec** `location` (quelle que soit la visibilité) | 404 « Profile not found » (compte sans profil : cas normal juste après `register`) |
| `GET /profiles/:userId` | aucun | — | `Profile` sans `location`, **avec `interests`** (`InterestCategory[]`) | 404 « Profile not found » si inexistant, id non numérique, compte non `ACTIVE` ou visibilité ≠ `PUBLIC`. Le service sait ouvrir un profil `FRIENDS_ONLY` à un ami et un profil `PRIVATE` à son propriétaire (`viewerId`), **mais le contrôleur ne lui passe pas l'appelant** : vérifié le 01/10, 404 pour l'ami et pour le propriétaire, avec ou sans token |
| `POST /profiles` | JWT | body `CreateProfileDto` : `username` (string), `description?`, `profile_picture?` (string, URL/chemin), `location` (`[number, number]`), `visibility?` (`ProfileVisibility`) | 201 `Profile` sans `location` ; `commune` calculée (appel `geo.api.gouv.fr`, 3 s max, `null` si échec) | 404 « User not found » ; 400 « Only an active user can create a profile », « User already has a profile », « Username is already taken » |
| `PATCH /profiles/me` | JWT | body `UpdateProfileDto` : mêmes champs, tous optionnels | `Profile` sans `location` ; `commune` recalculée si `location` est envoyée | 404 « User not found », « Profile does not exist » ; 400 non actif / username pris |
| `PATCH /profiles/me/avatar` | JWT | `multipart/form-data`, champ **`file`** (extension jpg/jpeg/png/webp, 5 Mo max) | 200 `Profile` sans `location`, `profile_picture` = `/static/avatars/<uuid>.webp` | 401 ; 400 « File is required », « Only jpg, jpeg, png, and webp files are allowed », « Failed to process and compress image », « Unexpected field - x » ; 404 « Profile does not exist » (compte sans profil). L'ancien fichier n'est pas supprimé |

## 8. Interests — `/interests` (`interests.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `PATCH /interests/me/select` | JWT | body `SelectInterestDto` : `interest` (`InterestCategory`) | `UserInterest` créé | 404 user ; 400 non actif, « This interest is already selected » |
| `PATCH /interests/me/remove` | JWT | body `SelectInterestDto` | `UserInterest` supprimé | 404 user ; 400 non actif ; intérêt non sélectionné → 500 |
| `GET /interests/me` | JWT | — | `UserInterest[]` | 404 user ; 400 non actif |

## 9. Friend requests — `/friend-requests` (`friend-requests.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `PATCH /friend-requests/me/send` | JWT | body `SendFriendRequestDto` : `addressee_id` (**chaîne numérique** `"12"` ; un entier → 400 « addressee_id must be a number string ») | 200 `FriendRequest` (`PENDING`, `responded_at: null`) — un `PATCH` qui **crée** | 404 « User not found », « Receiver not found » ; 400 « User is not active », « Friend requests can only be sent to active users », « You can't send a request to yourself », « A pending friend request already exists between these users » (dans **les deux sens**), « Friendship already active », « Friendship blocked », « Friend request could not be created, please try again » (concurrence). Une demande `REJECTED` **n'empêche pas** d'en renvoyer une ; **notifie** le destinataire (`FRIEND_REQUEST`, sans `link`, §17) |
| `PATCH /friend-requests/:requestId/accept` | JWT | — | 200 `FriendRequest` (`ACCEPTED`, `responded_at`) ; crée une `Friendship` `ACTIVE` (`user1_id` = le plus petit id) | 404 « Friend request not found », « Requester not found » ; 400 « This friend request can no longer be accepted » (non `PENDING`), « Friend request requester is no longer active », « Friendship already exists between these users » ; 403 « Only the receiver can accept this friend request » ; id non numérique → 500 |
| `PATCH /friend-requests/:requestId/reject` | JWT | — | 200 `FriendRequest` (`REJECTED`, `responded_at`) | 404 « Friend request not found » ; 400 « This friend request can no longer be rejected » ; 403 « Only the receiver can reject this friend request » |
| `GET /friend-requests/sentRequests` | JWT | — | `SentRequest[]` (`PENDING` seulement) | 404 « User not found » ; 400 « User is not active » |
| `GET /friend-requests/receivedRequests` | JWT | — | `ReceivedRequest[]` (`PENDING` seulement) | 404 « User not found » ; 400 « User is not active » |

Pas d'annulation d'une demande envoyée. Scripts : `tests/test_friend_management_simple.sh`,
`tests/test_friend_management_with_persistent_friendships.sh`, `tests/test-friend-requests-concurrency.sh`.

## 10. Friendships — `/friendships` (`friendships.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /friendships/me` | JWT | — | `FriendSummary[]` (amitiés `ACTIVE`) | 404 « User not found » ; 400 « User is not active » |
| `GET /friendships/me/blocked` | JWT | — | `FriendSummary[]` (amitiés `BLOCKED` **bloquées par moi** ; l'utilisateur bloqué ne voit rien) | idem |
| `PATCH /friendships/:friendUserId/block` | JWT | — | 200 `Friendship` (`BLOCKED`, `blocked_by_user_id` = moi) | 404 « User not found », « Friendship not found » ; 400 « User is not active », « Only an active friendship can be blocked » (on ne bloque qu'un ami actuel) |
| `PATCH /friendships/:friendUserId/unblock` | JWT | — | 200 `Friendship` (`ACTIVE`, `blocked_by_user_id: null`) | 404 ; 400 « This friendship is not blocked » ; 403 « Only the user who blocked this friendship can unblock it » |
| `DELETE /friendships/:friendUserId` | JWT | — | 200 `Friendship` supprimée | 404 ; 400 « This friendship is not active » (débloquer avant de supprimer) |

## 11. Participations — `/participations` (`participations.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `POST /participations/:actionId` | JWT | — | 201 `Participation` | 404 « User not found », « Action not found » ; 400 « Only an active user can participate to an action », « The action creator cannot participate in their own action », « You can only join a pending action » (**`PENDING` seulement**, pas `APPROVED`), « User already participates to this action », « Maximum number of participants reached » (si `max_participants` défini), « Participation could not be created, please try again » (concurrence) ; **notifie le créateur** quand l'inscription fait atteindre `min_participants` (`ACTION_MIN_REACHED`) ou `max_participants` (`ACTION_MAX_REACHED`), `link` `/actions/:id` (§17) |
| `DELETE /participations/:actionId` | JWT | — | 200 `Participation` supprimée | 404 « User not found », « Action not found », « Participation not found » ; 400 « Only an active user can cancel a participation », « Participation can only be cancelled while the action is pending », « Participation could not be cancelled, please try again » |
| `GET /participations/action/:actionId` | aucun | — | `Participant[]` (y compris sur une action `COMPLETED`) | 404 « Action not found » ; 400 « Participants are not available for this action status » (`REJECTED`, `CANCELLED`) |
| `GET /participations/me` | JWT | — | `MyParticipation[]` (actions `PENDING`/`APPROVED`/`COMPLETED`, sans tri) | 404 « User not found » ; 400 « Only an active user can see own participations » |

Le service contient aussi `removeOpenParticipationsForInactiveUser`, non exposé par une route.
Script : `tests/test-participations-autonome.sh`.

## 12. Organizations — `/organizations` (`organizations.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /organizations` | aucun | query optionnelle : `creator_id` **ou** `lat` + `lng` + `radius` (km). Priorité : `creator_id` > rayon > tout | `Organization[]` (tous statuts, y compris `SUSPENDED`/`CLOSED`) | `creator_id` sans résultat → **404** « No organizations created by this user » ; rayon sans résultat → `[]` ; valeurs non numériques → `[]` |
| `GET /organizations/search?q=` | aucun | query `q` (sous-chaîne du `title`, insensible à la casse) | `Organization[]` (max 15) | `q` absent → 15 premières |
| `GET /organizations/:id` | aucun | — | `Organization` | 404 « Organization not found » |
| `POST /organizations` | JWT | body `CreateOrganizationDto` : `title`, `description`, `address` (strings), `location` (`[number, number]`). **Plus de `creator_id`** (400 si envoyé) | 201 `Organization` (`ACTIVE`, `creator_id` = moi) | 404 « Creator not found » ; 400 « Only an active user can create an organization ». **Ne crée aucun `OrganizationMember`** : le créateur n'est pas `OWNER` (voir §15) |
| `PATCH /organizations/:id` | JWT | body `UpdateOrganizationDto` : `title?`, `description?`, `address?`, `location?` | `Organization` | 404 « Organization not found », « User not found » ; 403 « You are not allowed to update this organization » sauf `ADMIN`, **créateur**, ou membre `ACTIVE` `MANAGER`/`OWNER`. Aucune vérification du statut de l'organisation ni du compte appelant |
| `PATCH /organizations/:id/suspend` | JWT, **ADMIN** | — | `Organization` (`SUSPENDED`) | 404 ; 403 « Only an admin can suspend an organization » ; 400 « Only an active organization can be suspended » |
| `PATCH /organizations/:id/deactivate` | JWT | — | `Organization` (`CLOSED`) | 404 ; 403 « You are not allowed to close this organization » (mêmes rôles que `update`) ; 400 « Organization is not active » |
| `PATCH /organizations/:id/reactivate` | JWT | — | `Organization` (`ACTIVE`) | 404 ; `SUSPENDED` → 403 « Only an admin can reactivate a suspended organization » ; `CLOSED` → 403 « You are not allowed to reactivate this organization » (mêmes rôles que `update`) ; 400 « Organization is already active » |
| `POST /organizations/:id/comments` | JWT | body `OrganizationCommentDto` : **`comment`** (string non vide, ≤ 1024 ; ≠ `content` des actions) | 201 `OrganizationComment` (champ `content`, avec `user`) | 401 « Invalid token » ; 400 « comment should not be empty », « Comment must not exceed 1024 characters », « property content should not exist » ; 404 « Organization not found » ; id non numérique → 500. **Accepte des espaces seuls** et une organisation `SUSPENDED` (aucune vérification de statut) ; **notifie** les `OWNER` / `MANAGER` actifs de l'organisation, sauf l'auteur (`ORGANIZATION_COMMENT`, §17) |
| `GET /organizations/:id/comments` | aucun | — | `OrganizationComment[]` (plus récent en premier, `[]` si vide) | 404 « Organization not found » ; id non numérique → 500 |
| `DELETE /organizations/comments/:commentId` | JWT | — | 200 `{ message: "Comment deleted successfully" }` | 404 « Comment not found » ; 403 « You are not allowed to delete this comment » (sauf **l'auteur** ou **le créateur de l'organisation** `creator_id` ; ni `ADMIN` ni `OWNER`/`MANAGER`) ; id non numérique → 500 |

## 13. Organization members — `/organization-members` (`organizationmembers.controller.ts`) — **nouveau**

Préfixe `organization-members` (avec tiret). Toutes les réponses sont des objets Prisma bruts (`OrganizationMember`,
ids sérialisés en string). Tout id de l'URL non numérique → 400 « `organizationId` must be a valid integer » (etc.).
`O` = `:organizationId`, `T` = `:targetUserId`.

Règles communes aux routes de **gestion** (`add`, `remove`, `ban`, `approve`, `deny`) — « **gestionnaire** » ci-dessous :
404 « Requester not found », « Organization not found » ; 403 « Requester is not active » (compte non `ACTIVE`) ;
400 « Organization is not active » ; puis, sauf `ADMIN` : 403 « Requester is not an active member of the organization »,
« You do not have permission to manage members » (rôle `MEMBER`). **Le créateur de l'organisation n'a aucun
privilège ici** s'il n'a pas de membership `MANAGER`/`OWNER`.

Routes de **rôles** (`promote`, `demote`, `transfer-ownership`) — « **propriétaire** » : mêmes 404/403/400 de contexte,
puis sauf `ADMIN` : 403 « Requester is not an active member of the organization », « Only the owner can manage organization roles ».

| Route | Guard | Réponse | Erreurs / règles |
|---|---|---|---|
| `GET /organization-members/organization/O/member/:username` | aucun | `MemberWithUser` (membre `ACTIVE`, compte `ACTIVE`, `username` exact) | 404 « Active member not found in this organization » |
| `GET /organization-members/organization/O/members` | aucun | `MemberWithUser[]` (membres `ACTIVE` dont le compte est `ACTIVE`) | 404 « Organization not found » ; liste vide → `[]` |
| `GET /organization-members/organization/O/memberships` | JWT | `MemberWithUser[]` (**tous** statuts : `PENDING`, `ACTIVE`, `REJECTED`, `BANNED`) | 404 « User not found » ; 400 « User is not active » ; sauf `ADMIN` : 403 « You are not a member of this organization », « Your membership is not active », « You do not have permission to view memberships » (`MEMBER`). Organisation inconnue → `[]` |
| `GET /organization-members/user/:userId/organizations` | aucun | `MembershipWithOrganization[]` (memberships `ACTIVE` de cet utilisateur, avec l'`organization` complète) | 404 « User not found » ; 400 « User is not active » |
| `POST /organization-members/organization/O/join` | JWT | 201 `OrganizationMember` (`PENDING`, `MEMBER`, `validated_at: null`) | 404 « User not found », « Organization not found » ; 403 « Only active users can join an organization », « You are banned from this organization » ; 400 « Organization is not active » ; **409** « A membership request is already pending », « You are already a member of this organization », « A previous membership request has already been rejected » (un refus est **définitif**) ; **notifie** les `OWNER` / `MANAGER` actifs (`ORGANIZATION_JOIN_REQUEST`, §17) |
| `DELETE /organization-members/organization/O/leave` | JWT | `OrganizationMember` supprimé ; **−5** points à l'`OWNER` | 404 « User not found », « Organization not found », « You are not a member of this organization » ; 403 « Only active users can leave an organization », « The owner must transfer ownership before leaving the organization » ; 400 « Organization is not active », « Membership is not active » ; **404 « Organization owner not found » si aucun `OWNER`** (§15) |
| `POST /organization-members/organization/O/member/T/add` | JWT, gestionnaire | 201 `OrganizationMember` (`ACTIVE`, `MEMBER`, validé) ; **+5** points à l'`OWNER` | 404 « User not found » ; 400 « User is not active » ; **409** « This user already has a pending membership request », « This user is already a member of the organization », « A membership request for this user has already been rejected » ; **404 « Organization owner not found » si aucun `OWNER`** (§15) |
| `PATCH /organization-members/organization/O/member/T/approve` | JWT, gestionnaire | `OrganizationMember` (`ACTIVE`, `MEMBER`, `validated_by_org_man: true`) ; **+5** points à l'`OWNER` | 404 « Membership request not found » ; 400 « Membership request is not pending », « Target user is not active » ; **404 « Organization owner not found » si aucun `OWNER`** (§15) |
| `PATCH /organization-members/organization/O/member/T/deny` | JWT, gestionnaire | `OrganizationMember` (`REJECTED`) | 404 « Membership request not found » ; 400 « Membership request is not pending » |
| `DELETE /organization-members/organization/O/member/T/remove` | JWT, gestionnaire | `OrganizationMember` supprimé ; **−5** points à l'`OWNER` | 400 « Use leaveOrganization to leave the organization » (T = moi), « Membership is not active », « Target user is not active » ; 404 « User is not a member of this organization » ; 403 « The owner cannot be removed. Transfer ownership first. », « A manager can only remove members » (un `MANAGER` ne retire pas un autre `MANAGER`) ; 404 owner absent (§15) |
| `PATCH /organization-members/organization/O/member/T/ban` | JWT, gestionnaire | `OrganizationMember` (`BANNED`) ; **−5** points à l'`OWNER`, **−15** au banni | 400 « You cannot ban yourself », « Only an active member can be banned », « Target user is not active » ; 404 « User is not a member of this organization » ; **409** « User is already banned from this organization » ; 403 « The owner cannot be banned. Transfer ownership first. », « A manager can only ban members » ; 404 owner absent (§15) |
| `PATCH /organization-members/organization/O/member/T/promote` | JWT, propriétaire | `OrganizationMember` (`MANAGER`) | 404 « User is not a member of this organization » ; 400 « Membership is not active », « Target user is not active », « Only a member can be promoted to manager » |
| `PATCH /organization-members/organization/O/member/T/demote` | JWT, propriétaire | `OrganizationMember` (`MEMBER`) | 404 ; 400 « Membership is not active », « Target user is not active », « Only a manager can be demoted to member » |
| `PATCH /organization-members/organization/O/transfer-ownership/:newOwnerId` | JWT, propriétaire | `[OrganizationMember, OrganizationMember]` (ancien owner → `MANAGER`, nouveau → `OWNER`) | 404 « New owner is not a member of this organization », « Current organization owner not found » ; 400 « New owner membership is not active », « New owner is not active » ; **409** « This user is already the owner » |

Pas de route pour **débannir**, ni pour annuler une demande `PENDING` côté demandeur.

## 14. Point transactions — `/point-transactions` (`pointtransaction.controller.ts`) — **nouveau**

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `POST /point-transactions/admin/users/:userId/points` | JWT, **ADMIN** | body `AdminAddPointsDto` : `points` (entier **≥ 1** : pas de retrait manuel malgré `Docs/prisma_rules.md`), `adjustmentKey` (string non vide, idempotence) | 201 `PointTransaction` (`ADMIN_ADJUSTMENT`) ; incrémente `User.points` | 404 « Admin not found », « User not found » ; 403 « Only an admin can manually add points », « Admin account is not active » ; 400 « Only active users can receive points », « Adjustment key is required » ; **409** « This point transaction has already been processed » (même `adjustmentKey` pour le même couple admin/cible) |

**Aucune route de lecture** : `getUserPoints` et `getUserPointTransactions` existent dans le service mais ne sont pas
exposés. Le solde se lit dans `User.points` (`GET /auth/me`, `GET /users/me`, `GET /users/:id`). Pas d'historique.

Barème appliqué automatiquement (chaque événement est dédupliqué par `event_key` unique ; un doublon → 409 qui
**annule la transaction appelante**) :

| Déclencheur | Reason | Points | Bénéficiaire |
|---|---|---|---|
| `PATCH /actions/:id/complete` | `ACTION_COMPLETED` | +20 | créateur de l'action |
| idem, par participant | `ACTION_PARTICIPATED` | +10 | chaque participant |
| idem, par participant | `ACTION_PARTICIPANTS` | +5 | créateur, par participant |
| `add` / `approve` membre | `ORGANIZATION_MEMBER_JOINED` | +5 | `OWNER` de l'organisation |
| `leave` / `remove` / `ban` | `ORGANIZATION_MEMBER_LEFT` / `_REMOVED` / `_BANNED` | −5 | `OWNER` |
| `ban` | `USER_BANNED_FROM_ORGANIZATION` | −15 | membre banni |
| `PATCH /users/:id/suspend` | `USER_SUSPENDED` | −50 | utilisateur suspendu |

Contraintes des récompenses : le bénéficiaire doit être `ACTIVE` (sinon 400 « Only active users can receive points »)
et l'organisation liée `ACTIVE` (sinon 400 « Organization is not active »). Ces vérifications sont faites **dans la
transaction** de la route appelante : leur échec fait échouer la route entière (voir §16 pour `complete`).

## 15. Actions — `/actions` (`actions.controller.ts`)

Toutes les lectures renvoient des `Action` **enrichies** (`participant_count`, `remaining_seats`) ; toutes les mutations
renvoient un `ActionRecord` (sans ces champs). Un id non numérique → 500, sauf sur les routes de commentaires (400).

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /actions` | aucun | query optionnelle, **un seul filtre appliqué**, priorité : `organization_id` > `category` > `creator_id` > `status` | `Action[]` (tous statuts, ordre non garanti) | filtre sans résultat → **404** (« No actions found for this organization / category / user / status ») ; sans filtre → `[]` possible ; `category` ou `status` hors enum → 500. Pas de filtre rayon (`findByRadius` existe dans le service, sans route) |
| `GET /actions/:id` | aucun | — | `Action` | 404 « Action not found » |
| `POST /actions` | JWT | body `CreateActionDto` : `title`, `description` (strings), `location` (`[number, number]`), `category` (`Category`), `scheduled_at` (date ISO), `organization_id?` (entier), `max_participants?` (entier), `images_before?`, `images_after?` (`string[]`, persistés tels quels ; `imagesList` → 400 « property imagesList should not exist »). **Plus de `creator_id`** (400 si envoyé) ; `min_participants` refusé | 201 `ActionRecord` (`PENDING`, `creator_id` = moi, `min_participants: 3`, `validated_at: null`) | 404 « Creator not found », « Organization not found » ; 400 « Only an active user can create an action », « Only an active organization can create an action », « Maximum participants cannot be lower than minimum participants » (`max_participants` < 3) ; 403 « You are not allowed to create an action for this organization » (sauf `ADMIN` ou membre `ACTIVE` `MANAGER`/`OWNER` ; **le créateur de l'organisation n'a pas ce droit sans membership**, voir §16) |
| `PATCH /actions/:id` | JWT | body `UpdateActionDto` : `title?`, `description?`, `organization_id?` (entier, ou `null` pour détacher l'organisation), `location?`, `category?`, `images_before?`, `images_after?`, `max_participants?`, `scheduled_at?` | 200 `ActionRecord` | 404 « Action not found », « User not found », « Organization not found » ; 400 « This action can no longer be modified » (`CANCELLED`, `COMPLETED`, `REJECTED`) ; 403 « You are not allowed to update this action » (sauf `ADMIN`, créateur, `MANAGER`/`OWNER` de l'organisation liée), « You are not allowed to assign this action to this organization » ; 400 « Only an active organization can be assigned to an action », « Maximum participants cannot be lower than minimum participants », « Maximum participants cannot be lower than current participants count », « Action capacity was modified concurrently, please try again ». Le 500 du 24/09 est corrigé (vérifié le 01/10 : `title` seul → 200, `max_participants` seul → appliqué). **Bug (vérifié) : `images_before` et `images_after` absents du body sont remis à `[]`** : toute modification efface les photos, sauf à les renvoyer dans le body |
| `PATCH /actions/:id/approve` | JWT | — | 200 `ActionRecord` (`APPROVED`, `validated_by_user_id` = moi, `validated_at`) | 404 « Action not found », « User not found », « Organization not found » ; 400 « This action can no longer be approved » (non `PENDING`), « Only an active organization can approve an action », **« An action needs at least 3 participants to be approved »** (participants hors créateur < `min_participants`) ; 403 « You are not allowed to approve this action » (sauf `ADMIN`, **le créateur lui-même**, `MANAGER`/`OWNER`). Le rôle `MODERATOR` n'est pas vérifié ; **notifie chaque participant** (`ACTION_APPROVED`, §17) |
| `PATCH /actions/:id/cancel` | JWT | — | 200 `ActionRecord` (`CANCELLED`) | 404 ; 400 « This action can no longer be cancelled » (ni `PENDING` ni `APPROVED`) ; 403 « You are not allowed to cancel this action » (mêmes rôles), « Only an admin can cancel an action from an inactive organization » ; **notifie** créateur et participants (`ACTION_STATUS_CHANGED`, « is now cancelled », §17) |
| `PATCH /actions/:id/complete` | JWT | — | 200 `ActionRecord` (`COMPLETED`) ; distribue les points (§14) dans la même transaction | 404 ; 400 « This action cannot be completed » (non `APPROVED`), « An action needs at least 3 participants to be completed » ; 403 « You are not allowed to complete this action », « Only an admin can complete an action from an inactive organization » ; 400 « Only active users can receive points » ou « Organization is not active » (récompense refusée → **rien n'est appliqué**, l'action reste `APPROVED`) ; **notifie** créateur et participants (`ACTION_STATUS_CHANGED`, « is now completed », §17) |
| `POST /actions/:id/photo-before` | JWT | `multipart/form-data`, champ **`file`** (extension jpg/jpeg/png/webp, 10 Mo max) | 201 `ActionRecord`, URL `/static/actions/<uuid>.webp` ajoutée à `images_before` (image convertie en WebP) | 401 ; 400 « File is required », « Only jpg, jpeg, png, and webp files are allowed » (extension du nom de fichier), « Failed to process and compress image » (contenu illisible), « Unexpected field - x » (champ ≠ `file`), « You can only upload up to 3 photos before the action » ; 403 « You are not allowed to upload photos for this action » (**créateur seulement**, pas d'`ADMIN`) ; 404 « Action not found ». Aucune vérification du statut de l'action ; pas de route pour retirer une photo |
| `POST /actions/:id/photo-after` | JWT | idem | 201 `ActionRecord`, URL ajoutée à `images_after` | mêmes erreurs ; 403 sauf **créateur ou participant** ; 400 « You can only upload up to 3 photos after the action ». Possible sur une action `PENDING` (aucune vérification de statut) |
| `POST /actions/:id/comments` | JWT | body `CreateCommentDto` : `content` (string non vide, ≤ 1024) | 201 `ActionComment` (avec `user`) | 400 « content should not be empty », « Comment must not exceed 1024 characters », « property x should not exist », « Validation failed (numeric string is expected) » (id non numérique) ; 404 « Action not found » ; **403 « Only the creator or participants of the action can comment »** (depuis le 07/10, vérifié) ; **429 « You can only post a comment every 15 seconds »** : compté depuis le **dernier commentaire d'action du compte, toutes actions confondues** (vérifié) ; **notifie** le créateur et les participants, sauf l'auteur (`ACTION_COMMENT`, §17). Toujours aucune vérification du statut du compte ni de l'action (un participant peut commenter une action `CANCELLED`) |
| `GET /actions/:id/comments` | aucun | — | `ActionComment[]` (plus récent en premier) | 400 id non numérique ; 404 « Action not found » |

Pas de route de **rejet** (`REJECTED` est inatteignable via l'API), pas de suppression d'action ni de photo, pas de
recherche par rayon, par date ni par mot-clé. Vérifié par sonde le 24/09 : `complete` avec 3 participants → créateur +35 (20 + 3 × 5),
chaque participant +10. Scripts : `tests/test_action_management.sh`, `tests/test_comments.sh`.

## 16. Points d'attention pour le frontend

- **Auth partout** : le client HTTP n'ajoute rien en query ; un 401 sur une route métier = token expiré → refresh.
- **Cycle de vie réel d'une action** : `PENDING` = publiée et **ouverte aux inscriptions** (join/leave possibles, `approve`
  refusé tant qu'il y a moins de 3 participants hors créateur) → `APPROVED` = **confirmée, inscriptions closes** → `COMPLETED`
  (points). `CANCELLED` depuis `PENDING` ou `APPROVED`. `REJECTED` inatteignable. Conséquences UI : bouton « Join » sur
  `PENDING` seulement, libellés « Upcoming » / « Confirmed », pas d'écran de modération à prévoir tant que le backend ne
  vérifie pas `MODERATOR`. Cela contredit `Docs/user_stories.md` (validation par un modérateur avant publication) : à trancher en équipe.
- **`PATCH /actions/:id`** : le 500 est corrigé, l'édition est branchée (#33). Mais il **efface les photos** quand le body ne
  les contient pas (§15) : tant que le backend n'est pas corrigé, un formulaire d'édition doit renvoyer `images_before` et
  `images_after` tels qu'il les a reçus.
- **Photos et avatars** : les URLs `/static/...` renvoyées par les uploads sont servies depuis le 07/10 (`ServeStaticModule`,
  dossier `backend/uploads`, 404 si le fichier manque). Elles sont relatives à l'origine de l'API : en dev le proxy Vite
  relaie `/static` vers le backend (`vite.config.ts`) ; en prod Nginx devra faire de même.
- **Profils non publics** : `GET /profiles/:userId` renvoie 404 pour un profil `FRIENDS_ONLY` ou `PRIVATE`, même à un ami
  ou à son propriétaire (§7) ; pour soi-même, utiliser `GET /profiles/me`.
- **Organisations orphelines** : `POST /organizations` ne crée pas de membership `OWNER` et aucune route n'en crée une
  (`transfer-ownership` exige un `OWNER` existant). Le créateur peut modifier/fermer son organisation mais **ne peut ni
  gérer ni voir ses membres, ni créer d'action pour elle** (403 vérifié) ; un `ADMIN` peut `add`/`approve`, mais la
  récompense `OWNER` échoue (404 « Organization owner not found ») et **annule l'opération** ; `leave`/`remove`/`ban`
  échouent de même. Seuls `join` (→ `PENDING`) et `deny` fonctionnent. Ticket backend : créer le membre `OWNER` à la création.
- Une liste filtrée vide renvoie **404** (`GET /actions?…`, `GET /organizations?creator_id=`) : à traduire en liste vide.
  Les listes de `/organization-members`, `/participations`, `/friend-requests`, `/friendships`, `/actions/:id/comments`
  et `/organizations/:id/comments` renvoient `[]`.
- `username` et `profile_picture` sont `null` (`UserCard`, `ActionComment.user.profile` null) pour un compte sans profil :
  prévoir un libellé de repli (« Neighbour ») et les initiales de l'e-mail seulement pour soi-même.
- `complete` peut échouer à cause d'un participant désactivé : message d'erreur explicite plutôt qu'un échec muet.
- `remaining_seats` est calculé par l'API (`null` = sans plafond) ; ne pas le recalculer côté front. `max_participants` se fixe
  à la création (≥ 3) ; l'API n'expose pas `min_participants` en écriture.
- Fonctionnalités sans route aujourd'hui : suppression de compte, rejet d'action, suppression d'action, retrait d'une photo,
  messagerie (`NEW_MESSAGE` n'est jamais émis), lecture/historique des points, débannissement, annulation d'une
  demande d'adhésion ou d'amitié, recherche d'actions par rayon/date/texte, édition d'un commentaire, suppression d'un
  commentaire d'action (elle existe pour les commentaires d'organisation, §12).
- **Commentaires** : deux DTO différents, `{ content }` pour une action et `{ comment }` pour une organisation ; le backend
  accepte un commentaire d'organisation fait d'espaces, le front doit le refuser.
  Sur une action, seuls le créateur et les participants peuvent écrire (403) : n'afficher le composeur qu'à eux
  (`canComment`, #60). Les deux routes imposent 15 s entre deux commentaires du même compte (429) : le composeur garde un
  délai local et traduit le 429 (ActionComments, OrganizationComments).
- **Notifications** (§17) : pas de WebSocket ni de SSE, donc une relecture périodique de `GET /notifications/me` (toutes
  lues comprises : le compteur = `read: false`). `link` est un chemin du front (`/actions/:id`, `/organizations/:id`) ou
  `null`. `PATCH /notifications/preferences` n'a pas de DTO : n'envoyer que des valeurs de l'enum (sinon 500) ; une
  préférence absente vaut « activée ». `PATCH /notifications/:id/read` répond 404 pour la notification d'un autre compte
  et 500 sur un id non numérique.
- Deux conventions d'erreur pour « compte non actif » : 400 dans les modules historiques, 403 dans `/organization-members`.
- Ordre de déclaration : `/profiles/search` et `/profiles/me` précèdent `/profiles/:userId` (idem `/organizations/search`),
  donc pas de collision de routes.
- Rôle `ADMIN` : aucun moyen de le donner via l'API (colonne `role` en base uniquement). Les écrans admin
  (`suspend`, `reactivate`, points) supposent un compte promu à la main.
- Environnement de dev : `make db-update` après chaque `git pull` du backend (dernières migrations : `add_profile_commune`,
  `split_action_images`, `add_organization_comments`, puis `add_notifications` et
  `add_action_status_notification` le 07/10) ; si le backend ne compile plus après un pull, lire
  `docker compose logs backend` (dépendance manquante, voir l'en-tête) puis redémarrer le conteneur. `make seed` ajoute
  les données de démo sans rien effacer ; `make db-reset` et `make clean` effacent la base. Un seul refresh token par
  compte : se connecter ailleurs avec le même compte déconnecte la première session au prochain rafraîchissement.

## 17. Notifications — `/notifications` (`notifications.controller.ts`) — **nouveau (07/10/2026, PR #109)**

Toutes les routes sont **JWT** (`@UseGuards` sur le contrôleur : 401 « Invalid token » sans jeton). Aucun DTO : le corps de
`PATCH /preferences` n'est pas validé. Pas de temps réel (ni WebSocket ni SSE) : le front relit `GET /notifications/me`.

| Route | Body | Réponse | Erreurs / remarques |
|---|---|---|---|
| `GET /notifications/me` | — | `Notification[]` (plus récente en premier, lues comprises ; `[]` si aucune) | — |
| `PATCH /notifications/:id/read` | — | `Notification` (`read: true`) ; idempotent | 404 « Notification not found » (inconnue **ou à un autre compte**) ; id non numérique → **500** |
| `PATCH /notifications/me/read-all` | — | `{ count: number }` (notifications passées à lu) | — |
| `GET /notifications/preferences` | — | `NotificationPreference[]` : **seulement les types déjà réglés** (`[]` au départ) ; un type absent = activé | — |
| `PATCH /notifications/preferences` | `{ type: NotificationType; enabled: boolean }` | `NotificationPreference` (upsert) | `type` hors enum, body vide ou champ manquant → **500** (aucune validation) |

**Émission** (`NotificationsService.notifyUser`, appelé par les autres services après l'écriture ; une préférence
`enabled: false` pour le type supprime l'envoi ; toute erreur est avalée : jamais de 500, mais une base sans la migration
perd les notifications) :

| Type | Déclencheur | Destinataires | `title` / `message` | `link` |
|---|---|---|---|---|
| `ACTION_MIN_REACHED` | `POST /participations/:actionId` quand le compte des participants atteint `min_participants` (3) | créateur de l'action | « Minimum participants reached » / « Your action "T" has reached its minimum number of participants. » | `/actions/:id` |
| `ACTION_MAX_REACHED` | idem pour `max_participants` | créateur | « Maximum participants reached » / « Your action "T" has reached its maximum number of participants. » | `/actions/:id` |
| `ACTION_APPROVED` | `PATCH /actions/:id/approve` | chaque participant | « Action approved » / « The action "T" has been approved. Visit the action page for the latest date, time and useful information. » | `/actions/:id` |
| `ACTION_STATUS_CHANGED` | `PATCH /actions/:id/cancel`, `/complete` | créateur + participants | « Action status changed » / « The action "T" is now cancelled. » (ou `completed`) | `/actions/:id` |
| `ACTION_COMMENT` | `POST /actions/:id/comments` | créateur + participants, sauf l'auteur | « New comment on an action » / « A new comment was posted on "T". » | `/actions/:id` |
| `ORGANIZATION_COMMENT` | `POST /organizations/:id/comments` | `OWNER` / `MANAGER` actifs (comptes actifs), sauf l'auteur | « New organization comment » / « A new comment was posted on "O". » | `/organizations/:id` |
| `ORGANIZATION_JOIN_REQUEST` | `POST /organization-members/organization/:id/join` | `OWNER` / `MANAGER` actifs | « New organization membership request » / « A user requested to join "O". » | `/organizations/:id` |
| `FRIEND_REQUEST` | `PATCH /friend-requests/me/send` | destinataire | « New friend request » / « You received a new friend request. » | `null` |
| `NEW_MESSAGE` | jamais (pas de messagerie) | — | — | — |

Vérifié par sondes le 08/10/2026 : un commentaire du créateur crée une `ACTION_COMMENT` chez chaque participant (forme §3,
`created_at` ISO), `read` passe à `true` et reste idempotent, 404 depuis un autre compte, préférences `[]` puis upsert,
500 sur `type` invalide, body vide et id non numérique.
