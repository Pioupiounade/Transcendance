# Contrat d'API — backend NestJS (état réel du code)

Généré le 2026-09-23 par lecture de `backend/src/**/*.controller.ts`, `backend/src/**/dto/*.ts`,
`backend/src/**/*.service.ts`, `backend/src/auth/**`, `backend/src/main.ts` et `backend/prisma/schema.prisma`
(dernier commit backend : `c22b7785`, 2026-09-22, PR #40). Ce fichier décrit ce que le code **fait**,
pas ce que `Docs/prisma_rules.md` prévoit. À régénérer à chaque changement du backend.

**Changements majeurs depuis la version du 2026-09-20** (commit `4202e60a`) :
- Le paramètre `?current_user_id=` a **disparu**. Toute route qui agit au nom de l'utilisateur passe par
  `JwtAuthGuard` (header `Authorization: Bearer <access_token>`). Les bodies ne contiennent plus `creator_id`
  (`POST /actions`, `POST /organizations`) : l'envoyer provoque un **400** (`forbidNonWhitelisted`).
- `refresh_token` n'est **plus** renvoyé par `/users/*`. `GET /users/me` est implémenté.
- `PATCH /users/:id/email|password|deactivate` → `PATCH /users/me/...`. `suspend`/`reactivate` réservés à `ADMIN`.
- `PATCH /organizations/:id`, `/suspend`, `/deactivate`, `/reactivate` sont branchés.
- Nouveaux modules : `/organization-members` (14 routes) et `/point-transactions` (1 route admin).
  Système de points automatique (barème §14) déclenché par `complete` d'une action, les mouvements de membres et la suspension.
- `POST /actions` ne persiste plus `imagesList` et ne vérifie plus l'existence de l'organisation.

## 1. Conventions globales

- **Base URL** : `http://localhost:3000` (port NestJS, exposé par `docker/docker-compose.yml`).
  Aucun préfixe `/api`, aucun versionnement, pas de Swagger.
- **CORS** : toujours **non activé** dans `backend/src/main.ts`. Proxy Vite obligatoire en dev (`frontend/CLAUDE.md`).
- **Format** : JSON en entrée (`Content-Type: application/json`) et en sortie. Dates en chaînes ISO 8601.
- **Validation** : `ValidationPipe` global avec `whitelist`, `forbidNonWhitelisted`, `transform`.
  Tout champ absent du DTO → **400**. Les query params et path params ne sont **pas** validés (reçus en `string`),
  sauf dans `/organization-members` où un id non numérique → **400** « `<champ>` must be a valid integer ».
- **Identifiants** : `BigInt` en base. En **réponse**, tous les ids sont des **strings** (`"12"`) : soit par mapping
  explicite dans le service, soit par le patch global `BigInt.prototype.toJSON` de `main.ts` (routes qui renvoient
  l'objet Prisma brut : `POST /actions`, `/organization-members/*`, `/point-transactions/*`).
  En **entrée** : dans un body, un id est un **entier** (`organization_id: 12`) ; dans l'URL, une string.
  Hors `/organization-members`, un id non numérique dans l'URL (`BigInt("abc")`) provoque un **500**.
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
  body `refresh_token`). Aucun guard de rôle : `RolesGuard` n'existe pas.

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
| PiouPiouStatus | `PETIT_PIOUPIOU`, `GRAND_PIOUPIOU`, `PIOUPIOU_OR` (déclaré, utilisé par aucun modèle) |

## 3. Formes de réponse (types réutilisés ci-dessous)

```ts
// User : password_hash et refresh_token retirés partout.
type User = {
  user_id: string; email: string; role: RoleApp; account_status: AccountStatus; points: number;
  created_at: string; updated_at: string;
};
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

type PointTransaction = {
  point_transaction_id: string; user_id: string; points: number; reason: PointReason;
  event_key: string; created_at: string;
};
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
| `GET /users` | aucun | — | `User[]` (tous statuts) | — |
| `GET /users/me` | JWT | — | `User` | 404 « User not found ». Équivalent de `GET /auth/me` |
| `GET /users/:id` | aucun | — | `User` | 404 « User not found » |
| `POST /users` | aucun | body `CreateUserDto` (`email`, `password` ≥ 8) | 201 `User` | 400 « Email is already used ». Doublon de `/auth/register` sans tokens |
| `PATCH /users/me/email` | JWT | body `UpdateUserDto` : `email?` (format e-mail) | `User` | 400 « Email is already used » ; body vide = aucune modification |
| `PATCH /users/me/password` | JWT | body `UpdatePasswordDto` : `password` (≥ 8) | `User` | aucune vérification de l'ancien mot de passe |
| `PATCH /users/me/deactivate` | JWT | — | `User` (`DEACTIVATED`) | irréversible via l'API (voir `reactivate`) ; le JWT reste valide jusqu'à expiration |
| `PATCH /users/:id/suspend` | JWT, **ADMIN** | — | `User` (`SUSPENDED`) ; crée une transaction **−50** points (`USER_SUSPENDED`) | 404 « User not found » (appelant), « User to suspend not found » ; 403 « Only an admin can suspend a user » ; 400 « User is already suspended » |
| `PATCH /users/:id/reactivate` | JWT, **ADMIN** | — | `User` (`ACTIVE`) | 404 ; 403 « Only an admin can reactivate a user » ; 400 « Only a suspended account can be reactivated » (un compte `DEACTIVATED` n'est **pas** réactivable) |

Pas de route de suppression de compte.

## 7. Profiles — `/profiles` (`profiles.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /profiles` | aucun | — | `Profile[]` (visibilité `PUBLIC` et compte `ACTIVE` uniquement, sans `location`) | — |
| `GET /profiles/search?q=` | aucun | query `q` (sous-chaîne du `username`, insensible à la casse) | `Profile[]` (max 15, publics + actifs, sans `location`) | `q` absent → renvoie les 15 premiers profils publics |
| `GET /profiles/me` | JWT | — | `Profile` **avec** `location` (quelle que soit la visibilité) | 404 « Profile not found » (compte sans profil : cas normal juste après `register`) |
| `GET /profiles/:userId` | aucun | — | `Profile` sans `location` | 404 si inexistant, si visibilité ≠ `PUBLIC` ou si compte non `ACTIVE` (`FRIENDS_ONLY` non géré : traité comme privé) |
| `POST /profiles` | JWT | body `CreateProfileDto` : `username` (string), `description?`, `profile_picture?` (string, URL/chemin), `location` (`[number, number]`), `visibility?` (`ProfileVisibility`) | 201 `Profile` sans `location` | 404 « User not found » ; 400 « Only an active user can create a profile », « User already has a profile », « Username is already taken » |
| `PATCH /profiles/me` | JWT | body `UpdateProfileDto` : mêmes champs, tous optionnels | `Profile` sans `location` | 404 « User not found », « Profile does not exist » ; 400 non actif / username pris |

## 8. Interests — `/interests` (`interests.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `PATCH /interests/me/select` | JWT | body `SelectInterestDto` : `interest` (`InterestCategory`) | `UserInterest` créé | 404 user ; 400 non actif, « This interest is already selected » |
| `PATCH /interests/me/remove` | JWT | body `SelectInterestDto` | `UserInterest` supprimé | 404 user ; 400 non actif ; intérêt non sélectionné → 500 |
| `GET /interests/me` | JWT | — | `UserInterest[]` | 404 user ; 400 non actif |

## 9. Friend requests — `/friend-requests` (`friend-requests.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `PATCH /friend-requests/me/send` | JWT | body `SendFriendRequestDto` : `addressee_id` (entier) | `FriendRequest` (`PENDING`) — un `PATCH` qui **crée** | 404 « User not found », « Receiver not found » ; 400 : émetteur ou destinataire non actif, « You can't send a request to yourself », « A pending friend request already exists between these users », « Friendship already active », « Friendship blocked » |
| `PATCH /friend-requests/:requestId/accept` | JWT | — | `FriendRequest` (`ACCEPTED`, `responded_at`) ; crée une `Friendship` `ACTIVE` | 404 ; 400 « This friend request can no longer be accepted » (non `PENDING`) ; 403 « Only the receiver can accept this friend request » |
| `PATCH /friend-requests/:requestId/reject` | JWT | — | `FriendRequest` (`REJECTED`) | 404 ; 400 ; 403 « Only the receiver can reject this friend request » |
| `GET /friend-requests/sentRequests` | JWT | — | `SentRequest[]` (`PENDING` seulement) | 404 user ; 400 non actif |
| `GET /friend-requests/receivedRequests` | JWT | — | `ReceivedRequest[]` (`PENDING` seulement) | 404 user ; 400 non actif |

Pas d'annulation d'une demande envoyée.

## 10. Friendships — `/friendships` (`friendships.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /friendships/me` | JWT | — | `FriendSummary[]` (amitiés `ACTIVE`) | — |
| `GET /friendships/me/blocked` | JWT | — | `FriendSummary[]` (amitiés `BLOCKED` **bloquées par moi**) | — |
| `PATCH /friendships/:friendUserId/block` | JWT | — | `Friendship` (`BLOCKED`, `blocked_by_user_id` = moi) | 404 « User not found », « Friendship not found » ; 400 non actif, « Only an active friendship can be blocked » (on ne bloque qu'un ami actuel) |
| `PATCH /friendships/:friendUserId/unblock` | JWT | — | `Friendship` (`ACTIVE`) | 404 ; 400 « This friendship is not blocked » ; 403 « Only the user who blocked this friendship can unblock it » |
| `DELETE /friendships/:friendUserId` | JWT | — | `Friendship` supprimée | 404 ; 400 « This friendship is not active » (une amitié bloquée ne peut pas être supprimée) |

## 11. Participations — `/participations` (`participations.controller.ts`)

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `POST /participations/:actionId` | JWT | — | 201 `Participation` | 404 « User not found », « Action not found » ; 400 non actif, « You can only join a pending action » (**`PENDING` seulement**, pas `APPROVED`), « User already participates to this action », « Maximum number of participants reached » (si `max_participants` défini) |
| `DELETE /participations/:actionId` | JWT | — | `Participation` supprimée | 404 user/action/« Participation not found » ; 400 non actif, « Participation can only be cancelled while the action is pending » |
| `GET /participations/action/:actionId` | aucun | — | `Participant[]` | 404 « Action not found » ; 400 « Participants are not available for this action status » (`REJECTED`, `CANCELLED`) |
| `GET /participations/me` | JWT | — | `MyParticipation[]` (actions `PENDING`/`APPROVED`/`COMPLETED`) | 404 user ; 400 non actif |

Le service contient aussi `removeOpenParticipationsForInactiveUser`, non exposé par une route.

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
| `POST /organization-members/organization/O/join` | JWT | 201 `OrganizationMember` (`PENDING`, `MEMBER`, `validated_at: null`) | 404 « User not found », « Organization not found » ; 403 « Only active users can join an organization », « You are banned from this organization » ; 400 « Organization is not active » ; **409** « A membership request is already pending », « You are already a member of this organization », « A previous membership request has already been rejected » (un refus est **définitif**) |
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

| Route | Guard | Entrée | Réponse | Erreurs / règles |
|---|---|---|---|---|
| `GET /actions` | aucun | query optionnelle, **un seul filtre appliqué**, priorité : `organization_id` > `category` > `creator_id` > `status` | `Action[]` (tous statuts) | filtre sans résultat → **404** (« No actions found for this organization / category / user / status ») ; sans filtre → `[]` possible ; `category` ou `status` hors enum → 500 |
| `GET /actions/:id` | aucun | — | `Action` | 404 « Action not found » |
| `POST /actions` | JWT | body `CreateActionDto` : `title`, `description` (strings), `location` (`[number, number]`), `organization_id?` (entier), `category` (`Category`), `imagesList?` (`string[]`, **accepté mais ignoré**), `scheduled_at` (date ISO). **Plus de `creator_id`** (400 si envoyé). `min_participants` / `max_participants` toujours refusés | 201 `Action` (`PENDING`, `creator_id` = moi, `imagesList: []`) | 404 « Creator not found » ; 400 « Only an active user can create an action » ; `organization_id` inconnu → **500** (clé étrangère, plus de vérification) ; organisation `SUSPENDED`/`CLOSED` **acceptée** |
| `PATCH /actions/:id` | JWT | body `UpdateActionDto` : `title?`, `description?`, `organization_id?`, `location?`, `category?`, `imagesList?`, `scheduled_at?` | `Action` | 404 action/user ; 400 « This action can no longer be modified » (`CANCELLED`, `COMPLETED`, `REJECTED`) ; 403 « You are not allowed to update this action » sauf `ADMIN`, créateur, ou membre `ACTIVE` `MANAGER`/`OWNER` de l'organisation liée |
| `PATCH /actions/:id/approve` | JWT | — | `Action` (`APPROVED`, `validated_by_user_id`, `validated_at`) | 400 « This action can no longer be approved » (non `PENDING`) ; 404 ; 400 « Only an active organization can approve an action » ; 403 sauf `ADMIN`, **le créateur lui-même**, `MANAGER`/`OWNER`. Le rôle `MODERATOR` n'est pas vérifié |
| `PATCH /actions/:id/cancel` | JWT | — | `Action` (`CANCELLED`) | 400 « This action can no longer be cancelled » (ni `PENDING` ni `APPROVED`) ; 403 (mêmes rôles ; organisation inactive → `ADMIN` seulement) |
| `PATCH /actions/:id/complete` | JWT | — | `Action` (`COMPLETED`) ; distribue les points (§14) dans une transaction | 400 « This action cannot be completed » (non `APPROVED`) ; 403 (mêmes rôles) ; **400 « Only active users can receive points » si le créateur ou l'un des participants n'est plus `ACTIVE`**, 400 « Organization is not active » si l'organisation liée ne l'est plus → l'action reste `APPROVED` |

Pas de route de **rejet** (`REJECTED` est inatteignable via l'API), pas de suppression, pas de recherche par rayon
(`findByRadius` existe dans le service sans route), pas de recherche par date ni par mot-clé.

## 16. Points d'attention pour le frontend

- **Auth partout** : le client HTTP n'a plus rien à ajouter en query ; le `?current_user_id=` de `frontend/CLAUDE.md`
  §« Appels API » est obsolète (à retirer du client et de `CLAUDE.md`). Un 401 sur une route métier = token expiré → refresh.
- **Organisations orphelines** : `POST /organizations` ne crée pas de membership `OWNER` et aucune route n'en crée une
  (`transfer-ownership` exige un `OWNER` existant). Conséquences tant que le backend ne le corrige pas :
  le créateur peut modifier/fermer son organisation (règle « créateur ») mais **ne peut ni gérer ni voir ses membres**
  (403) ; un `ADMIN` peut `add`/`approve`, mais la récompense `OWNER` échoue (404 « Organization owner not found ») et
  **annule l'opération** ; `leave`/`remove`/`ban` échouent de même. Seuls `join` (→ `PENDING`) et `deny` fonctionnent.
  À signaler par ticket backend : créer le membre `OWNER` à la création de l'organisation.
- Une liste filtrée vide renvoie **404** (`GET /actions?…`, `GET /organizations?creator_id=`) : à traduire en liste vide.
  Les listes de `/organization-members` renvoient `[]`.
- `complete` peut échouer à cause d'un participant désactivé : prévoir un message d'erreur explicite plutôt qu'un échec muet.
- Fonctionnalités sans route aujourd'hui : suppression de compte, rejet d'action, upload de fichiers (`imagesList`
  n'est même plus persisté à la création), notifications, messagerie, historique/lecture des points, débannissement,
  annulation d'une demande d'adhésion ou d'amitié, recherche d'actions par rayon/date/texte.
- `max_participants` ne peut pas être renseigné via l'API : « places restantes » n'est pas calculable.
- On ne peut rejoindre (ou quitter) qu'une action `PENDING` ; une action `APPROVED` n'accepte plus d'inscription.
- Deux conventions d'erreur pour « compte non actif » : 400 dans les modules historiques, 403 dans `/organization-members`.
- Ordre de déclaration : `/profiles/search` et `/profiles/me` précèdent `/profiles/:userId` (idem `/organizations/search`),
  donc pas de collision de routes.
- Rôle `ADMIN` : aucun moyen de le donner via l'API (colonne `role` en base uniquement). Les écrans admin
  (`suspend`, `reactivate`, points) supposent un compte promu à la main.
