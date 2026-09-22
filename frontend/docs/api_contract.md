# Contrat d'API — backend NestJS (état réel du code)

Généré le 2026-09-20 par lecture de `backend/src/**/*.controller.ts`, `backend/src/**/dto/*.ts`,
`backend/src/**/*.service.ts`, `backend/src/auth/**` et `backend/prisma/schema.prisma`
(dernier commit backend : `4202e60a`, 2026-09-17). Ce fichier décrit ce que le code **fait**,
pas ce que `Docs/prisma_rules.md` prévoit. À régénérer à chaque changement du backend.

## 1. Conventions globales

- **Base URL** : `http://localhost:3000` (port NestJS, exposé par `docker/docker-compose.yml`).
  Aucun préfixe `/api`, aucun versionnement, pas de Swagger.
- **CORS** : non activé dans `backend/src/main.ts`. Un appel direct depuis le navigateur
  (`localhost:5173`) est bloqué tant que `app.enableCors()` n'est pas ajouté ou qu'un proxy Vite n'est pas configuré.
- **Format** : JSON en entrée (`Content-Type: application/json`) et en sortie. Dates en chaînes ISO 8601.
- **Validation** : `ValidationPipe` global avec `whitelist`, `forbidNonWhitelisted`, `transform`.
  Tout champ absent du DTO → **400**. Les query params et path params ne sont **pas** validés (reçus en `string`).
- **Identifiants** : `BigInt` en base. En **réponse**, tous les ids sont des **strings** (`"12"`).
  En **entrée** : dans un body, un id est un **entier** (`creator_id: 12`) ; dans l'URL ou la query, une string.
  Un id non numérique dans l'URL (`BigInt("abc")`) provoque un **500**.
- **Localisation** : `location` = tableau `[latitude, longitude]` de 2 nombres (pas de PostGIS).
  Les recherches par rayon se font en mémoire (haversine, rayon en km).
- **Erreurs** : format NestJS `{ "statusCode": 400, "message": "Email is already used", "error": "Bad Request" }`.
  Pour une erreur de validation, `message` est un **tableau** de strings.
  Erreurs Prisma non interceptées (`update`/`delete` sur un id inexistant, enum invalide en query) → **500**.
- **Codes de succès** : `POST` → 201 sauf `/auth/login`, `/auth/logout`, `/auth/refresh` → 200 ; `GET`/`PATCH`/`DELETE` → 200.
- **Authentification** — deux mécanismes coexistent :
  1. **JWT** (module `auth`) : header `Authorization: Bearer <access_token>` (durée 15 min).
     Refresh token (7 jours) envoyé dans le **body** de `POST /auth/refresh`. Payload : `{ id: string, email, role }` → `req.user`.
  2. **`?current_user_id=<id>`** en query string sur les routes métier (profiles, interests, friend-requests,
     friendships, participations, actions). **Aucun guard** : le backend fait confiance à ce paramètre.
     Transitoire (cf. `Docs/todo.md`, « ne plus passer librement currentUserId »). À centraliser côté frontend.
- **Statut de compte** : la plupart des opérations exigent `account_status = ACTIVE` pour l'utilisateur courant (sinon **400**).
- **Guards existants** : `JwtAuthGuard` (stratégie `jwt`, header Bearer) et `JwtRefreshGuard` (stratégie `jwt-refresh`,
  body `refresh_token`). Ils ne sont utilisés que dans `AuthController`. Aucun guard de rôle (ADMIN/MODERATOR).

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
| PointReason | `ACTION_COMPLETED`, `ACTION_PARTICIPATED`, `ACTION_PARTICIPANTS`, `ORGANIZATION_JOINED`, `USER_SUSPENDED`, `USER_BANNED` |
| PiouPiouStatus | `PETIT_PIOUPIOU`, `GRAND_PIOUPIOU`, `PIOUPIOU_OR` (déclaré, utilisé par aucun modèle) |

## 3. Formes de réponse (types réutilisés ci-dessous)

```ts
// User : password_hash retiré. refresh_token (hash argon2) PRÉSENT sur /users/*, retiré sur /auth/*.
type User = {
  user_id: string; email: string; role: RoleApp; account_status: AccountStatus; points: number;
  created_at: string; updated_at: string; refresh_token: string | null;
};
type AuthUser = Omit<User, 'refresh_token'>;
type Tokens = { access_token: string; refresh_token: string };

// Profile : location retirée partout sauf sur GET /profiles/me.
type Profile = {
  user_id: string; username: string; description: string | null; profile_picture: string | null;
  visibility: ProfileVisibility; location?: [number, number];
};
type UserInterest = { user_id: string; interest: InterestCategory };
type UserCard = { user_id: string; username: string | null; profile_picture: string | null };

type Organization = {
  organization_id: string; title: string; description: string; organization_status: OrganizationStatus;
  address: string; location: [number, number]; creator_id: string; created_at: string; updated_at: string;
};

type Action = {
  action_id: string; title: string; description: string; creator_id: string; organization_id: string | null;
  min_participants: number | null; max_participants: number | null; location: [number, number];
  status: ActionStatus; category: Category; imagesList: string[];
  validated_by_user_id: string | null;
  validated_at: string | null; // vaut now() dès la création (default Prisma), même sans validation
  scheduled_at: string; created_at: string; updated_at: string;
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
```

## 4. Racine

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /` | aucun | — | `"Hello World!"` (texte) | — |

## 5. Auth — `/auth` (`auth.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `POST /auth/register` | aucun | body `CreateUserDto` : `email` (format e-mail), `password` (string, ≥ 8) | 201 `{ user: AuthUser, access_token, refresh_token }` | 400 « Email is already used » ; e-mail mis en minuscules ; le refresh token est stocké hashé en base |
| `POST /auth/login` | aucun | body `LoginDto` : `email`, `password` (≥ 8) | 200 `{ user: AuthUser, access_token, refresh_token }` | 401 « Invalid credentials » (e-mail inconnu ou mot de passe faux) |
| `POST /auth/logout` | `JwtAuthGuard` (Bearer access token valide) | — (body ignoré) | 200 `{ message: "Logout successful" }` | 401 « Invalid token » ; efface le refresh token en base. Un access token expiré empêche le logout serveur |
| `POST /auth/refresh` | `JwtRefreshGuard` | body `{ refresh_token: string }` (préfixe `Bearer ` toléré ; pas de DTO, champs supplémentaires acceptés) | 200 `Tokens` (rotation : nouveau couple, l'ancien refresh devient invalide) | 401 token absent/invalide/expiré ; 401 « Access Denied » si le token ne correspond pas au hash en base (ex. après logout) |
| `GET /auth/me` | `JwtAuthGuard` | — | 200 `AuthUser` | 401 ; 404 « User not found » |

Script de test manuel : `tests/test_auth.sh` (curl + jq).

## 6. Users — `/users` (`users.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /users` | aucun | — | `User[]` (**avec** `refresh_token` hashé) | — |
| `GET /users/me` | aucun | — | `{ message: "This endpoint will return the authenticated user's profile." }` | placeholder, non implémenté (utiliser `GET /auth/me`) |
| `GET /users/:id` | aucun | — | `User` (avec `refresh_token`) | 404 « User not found » |
| `POST /users` | aucun | body `CreateUserDto` (`email`, `password` ≥ 8) | 201 `User` | 400 « Email is already used ». Doublon de `/auth/register` sans tokens |
| `PATCH /users/:id/email` | aucun | body `UpdateUserDto` : `email?` (format e-mail) | `User` | 400 « Email is already used » ; body vide = aucune modification ; id inconnu → 500 |
| `PATCH /users/:id/password` | aucun | body `UpdatePasswordDto` : `password` (≥ 8) | `User` | id inconnu → 500 ; aucune vérification de l'ancien mot de passe |
| `PATCH /users/:id/deactivate` | aucun | — | `User` (`DEACTIVATED`) | id inconnu → 500 |
| `PATCH /users/:id/suspend` | aucun | — | `User` (`SUSPENDED`) | id inconnu → 500 ; aucun contrôle de rôle |
| `PATCH /users/:id/reactivate` | aucun | — | `User` (`ACTIVE`) | 404 ; 400 « Only a suspended account can be reactivated » (un compte `DEACTIVATED` n'est **pas** réactivable) |

Pas de route de suppression de compte.

## 7. Profiles — `/profiles` (`profiles.controller.ts`) — aucun guard, identité via `?current_user_id`

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /profiles` | aucun | — | `Profile[]` (visibilité `PUBLIC` et compte `ACTIVE` uniquement, sans `location`) | — |
| `GET /profiles/search?q=` | aucun | query `q` (sous-chaîne du `username`, insensible à la casse) | `Profile[]` (max 15, publics + actifs, sans `location`) | `q` absent → renvoie les 15 premiers profils publics |
| `GET /profiles/me?current_user_id=` | aucun | query `current_user_id` | `Profile` **avec** `location` (quelle que soit la visibilité) | 404 « Profile not found » |
| `GET /profiles/:userId` | aucun | — | `Profile` sans `location` | 404 si inexistant, si visibilité ≠ `PUBLIC` ou si compte non `ACTIVE` (`FRIENDS_ONLY` non géré : traité comme privé) |
| `POST /profiles?current_user_id=` | aucun | body `CreateProfileDto` : `username` (string), `description?`, `profile_picture?` (string, URL/chemin), `location` (`[number, number]`), `visibility?` (`ProfileVisibility`) | 201 `Profile` sans `location` | 404 « User not found » ; 400 « Only an active user can create a profile », « User already has a profile », « Username is already taken » |
| `PATCH /profiles/me?current_user_id=` | aucun | body `UpdateProfileDto` : mêmes champs, tous optionnels | `Profile` sans `location` | 404 « User not found », « Profile does not exist » ; 400 non actif / username pris |

## 8. Interests — `/interests` (`interests.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `PATCH /interests/me/select?current_user_id=` | aucun | body `SelectInterestDto` : `interest` (`InterestCategory`) | `UserInterest` créé | 404 user ; 400 non actif, « This interest is already selected » |
| `PATCH /interests/me/remove?current_user_id=` | aucun | body `SelectInterestDto` | `UserInterest` supprimé | 404 user ; 400 non actif ; intérêt non sélectionné → 500 |
| `GET /interests/me?current_user_id=` | aucun | — | `UserInterest[]` | 404 user ; 400 non actif |

## 9. Friend requests — `/friend-requests` (`friend-requests.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `PATCH /friend-requests/me/send?current_user_id=` | aucun | body `SendFriendRequestDto` : `addressee_id` (entier) | `FriendRequest` (`PENDING`) — un `PATCH` qui **crée** | 404 « User not found », « Receiver not found » ; 400 : émetteur ou destinataire non actif, « You can't send a request to yourself », « A pending friend request already exists between these users », « Friendship already active », « Friendship blocked » |
| `PATCH /friend-requests/:requestId/accept?current_user_id=` | aucun | — | `FriendRequest` (`ACCEPTED`, `responded_at`) ; crée une `Friendship` `ACTIVE` | 404 ; 400 « This friend request can no longer be accepted » (non `PENDING`) ; 403 « Only the receiver can accept this friend request » |
| `PATCH /friend-requests/:requestId/reject?current_user_id=` | aucun | — | `FriendRequest` (`REJECTED`) | 404 ; 400 ; 403 « Only the receiver can reject this friend request » |
| `GET /friend-requests/sentRequests?current_user_id=` | aucun | — | `SentRequest[]` (`PENDING` seulement) | 404 user ; 400 non actif |
| `GET /friend-requests/receivedRequests?current_user_id=` | aucun | — | `ReceivedRequest[]` (`PENDING` seulement) | 404 user ; 400 non actif |

Pas d'annulation d'une demande envoyée.

## 10. Friendships — `/friendships` (`friendships.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /friendships/me?current_user_id=` | aucun | — | `FriendSummary[]` (amitiés `ACTIVE`) | aucune vérification de l'utilisateur ; id inconnu → `[]` |
| `GET /friendships/me/blocked?current_user_id=` | aucun | — | `FriendSummary[]` (amitiés `BLOCKED` **bloquées par moi**) | — |
| `PATCH /friendships/:friendUserId/block?current_user_id=` | aucun | — | `Friendship` (`BLOCKED`, `blocked_by_user_id` = moi) | 404 « User not found », « Friendship not found » ; 400 non actif, « Only an active friendship can be blocked » (on ne bloque qu'un ami actuel) |
| `PATCH /friendships/:friendUserId/unblock?current_user_id=` | aucun | — | `Friendship` (`ACTIVE`) | 404 ; 400 « This friendship is not blocked » ; 403 « Only the user who blocked this friendship can unblock it » |
| `DELETE /friendships/:friendUserId?current_user_id=` | aucun | — | `Friendship` supprimée | 404 ; 400 « This friendship is not active » (une amitié bloquée ne peut pas être supprimée) |

## 11. Participations — `/participations` (`participations.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `POST /participations/:actionId?current_user_id=` | aucun | — | 201 `Participation` | 404 « User not found », « Action not found » ; 400 non actif, « You can only join a pending action » (**`PENDING` seulement**, pas `APPROVED`), « User already participates to this action », « Maximum number of participants reached » (si `max_participants` défini) |
| `DELETE /participations/:actionId?current_user_id=` | aucun | — | `Participation` supprimée | 404 user/action/« Participation not found » ; 400 non actif, « Participation can only be cancelled while the action is pending » |
| `GET /participations/action/:actionId` | aucun | — | `Participant[]` | 404 « Action not found » ; 400 « Participants are not available for this action status » (`REJECTED`, `CANCELLED`) |
| `GET /participations/me?current_user_id=` | aucun | — | `MyParticipation[]` (actions `PENDING`/`APPROVED`/`COMPLETED`) | 404 user ; 400 non actif |

Le service contient aussi `removeOpenParticipationsForInactiveUser`, non exposé par une route.

## 12. Organizations — `/organizations` (`organizations.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /organizations` | aucun | query optionnelle : `creator_id` **ou** `lat` + `lng` + `radius` (km). Priorité : `creator_id` > rayon > tout | `Organization[]` (tous statuts, y compris `SUSPENDED`/`CLOSED`) | `creator_id` sans résultat → **404** « No organizations created by this user » ; rayon sans résultat → `[]` ; valeurs non numériques → `[]` |
| `GET /organizations/search?q=` | aucun | query `q` (sous-chaîne du `title`, insensible à la casse) | `Organization[]` (max 15) | `q` absent → 15 premières |
| `GET /organizations/:id` | aucun | — | `Organization` | 404 « Organization not found » |
| `POST /organizations` | aucun | body `CreateOrganizationDto` : `title`, `description`, `address` (strings), `location` (`[number, number]`), `creator_id` (entier) | 201 `Organization` (`ACTIVE`) | 404 « Creator not found » ; 400 « Only an active user can create an organization » |
| `PATCH /organizations/:id` | aucun | body `UpdateOrganizationDto` : `title?`, `description?`, `address?`, `location?` | **non branché** : 200 avec corps vide, aucune modification | seule la validation du body s'applique |
| `PATCH /organizations/:id/suspend` | aucun | — | **non branché** : 200 vide | — |
| `PATCH /organizations/:id/deactivate` | aucun | — | **non branché** : 200 vide | — |
| `PATCH /organizations/:id/reactivate` | aucun | — | **non branché** : 200 vide | — |

Règles déjà écrites dans `organizations.service.ts` (à attendre pour le branchement) : `update` et `deactivate` (→ `CLOSED`)
réservés à `ADMIN`, au créateur ou à un membre `ACTIVE` `MANAGER`/`OWNER` ; `suspend` réservé à `ADMIN` ; `reactivate`
d'une organisation `SUSPENDED` réservé à `ADMIN`, d'une `CLOSED` aux mêmes rôles que `update`.

## 13. Actions — `/actions` (`actions.controller.ts`) — aucun guard

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /actions` | aucun | query optionnelle, **un seul filtre appliqué**, priorité : `organization_id` > `category` > `creator_id` > `status` | `Action[]` (tous statuts) | filtre sans résultat → **404** (« No actions found for this organization / category / user / status ») ; sans filtre → `[]` possible ; `category` ou `status` hors enum → 500 |
| `GET /actions/:id` | aucun | — | `Action` | 404 « Action not found » |
| `POST /actions` | aucun | body `CreateActionDto` : `title`, `description` (strings), `location` (`[number, number]`), `creator_id` (entier), `organization_id?` (entier), `category` (`Category`), `imagesList?` (`string[]`), `scheduled_at` (date ISO). **`min_participants` / `max_participants` refusés** (400, absents du DTO) | 201 `Action` (`PENDING`) | 404 « Creator not found », « Organization not found » ; 400 « Only an active user can create an action », « Only an active organization can create an action » |
| `PATCH /actions/:id?current_user_id=` | aucun | body `UpdateActionDto` : `title?`, `description?`, `organization_id?`, `location?`, `category?`, `imagesList?`, `scheduled_at?` | `Action` | 404 action/user ; 400 « This action can no longer be modified » (`CANCELLED`, `COMPLETED`, `REJECTED`) ; 403 « You are not allowed to update this action » sauf `ADMIN`, créateur, ou membre `ACTIVE` `MANAGER`/`OWNER` de l'organisation liée |
| `PATCH /actions/:id/approve?current_user_id=` | aucun | — | `Action` (`APPROVED`, `validated_by_user_id`, `validated_at`) | 400 « This action can no longer be approved » (non `PENDING`) ; 404 ; 400 « Only an active organization can approve an action » ; 403 sauf `ADMIN`, **le créateur lui-même**, `MANAGER`/`OWNER`. Le rôle `MODERATOR` n'est pas vérifié |
| `PATCH /actions/:id/cancel?current_user_id=` | aucun | — | `Action` (`CANCELLED`) | 400 « This action can no longer be cancelled » (ni `PENDING` ni `APPROVED`) ; 403 (mêmes rôles ; organisation inactive → `ADMIN` seulement) |
| `PATCH /actions/:id/complete?current_user_id=` | aucun | — | `Action` (`COMPLETED`) | 400 « This action cannot be completed » (non `APPROVED`) ; 403 (mêmes rôles) |

Pas de route de **rejet** (`REJECTED` est inatteignable via l'API), pas de suppression, pas de recherche par rayon
(`findByRadius` existe dans le service sans route), pas de recherche par date ni par mot-clé.

## 14. Modules déclarés sans routes

- `OrganizationmembersController` (`/organizationmembers`) et `PointtransactionController` (`/pointtransaction`) :
  contrôleurs et services vides. Toute requête → 404.

## 15. Points d'attention pour le frontend

- Une liste filtrée vide renvoie **404** (`GET /actions?…`, `GET /organizations?creator_id=`) : à traduire en liste vide.
- `GET /users` et `GET /users/:id` renvoient le hash du refresh token : ne jamais l'afficher ni le stocker.
- Fonctionnalités sans route aujourd'hui : suppression de compte, rejet d'action, upload de fichiers, notifications,
  messagerie, membres d'organisation, points, recherche d'actions par rayon/date/texte, modification des organisations.
- `max_participants` ne peut pas être renseigné via l'API : « places restantes » n'est pas calculable.
- On ne peut rejoindre (ou quitter) qu'une action `PENDING` ; une action `APPROVED` n'accepte plus d'inscription.
- Ordre de déclaration : `/profiles/search` et `/profiles/me` précèdent `/profiles/:userId` (idem `/organizations/search`),
  donc pas de collision de routes.
- Les routes non `/auth` n'ont aucun guard : le `current_user_id` est un choix du client. Prévoir de le remplacer par le
  JWT sans toucher aux composants.
