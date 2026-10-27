*This project has been created as part of the 42 curriculum by thodavid, mlelu, qupollet, lellanos.*

## Description
**Project Name:** Pioupiounades

**Pioupiounades** is a neighborhood-scale civic engagement web platform designed to connect neighboors, local associations, and local businesses. The platform enables neighboors to discover, organize, and participate in local community actions—such as environmental, social or cultural actions.

### Key Features
- **Action Management:** Full lifecycle to create, publish, customize, join, or cancel neighborhood actions with participant capacity limits.
- **Organizations & Local Collectives:** Dedicated workspaces for local neighborhood associations to mobilize citizens and organize community events.
- **Social & Community Interaction:** Real-time messaging, action discussion threads, notifications, and social networking (friend requests, relationship statuses).
- **Civic Gamification & Points:** Community engagement system awarding civic points to incentivize active neighborhood involvement.
- **Interactive Neighborhood Map:** Real-time geospatial discovery of citizen actions and initiatives using interactive Leaflet/OpenStreetMap integration.

---

## Instructions

### Prerequisites
- Docker & Docker Compose (or Podman / podman-compose)
- GNU Make
- OpenSSL (used by the Makefile to generate local SSL certificates)
- Google Chrome (latest stable version)

### Setup & Launch
1. Clone the repository
   cd Transcendance

2. Configure environment variables:
   cp .env.example .env

3. Run the application (Single Command):
   make

4. Seed the database with initial test records:
   make seed

5. Access the Application:
   Open Google Chrome and navigate to:
   - Frontend: https://localhost (or http://localhost:5173)
   - API Backend: http://localhost:3000/api

### Useful Makefile Commands
- make up         : Create SSL certs, launch containers, and update database.
- make down       : Gracefully stop all running containers.
- make re         : Full rebuild (stops containers, removes volumes, rebuilds, and updates database).
- make db-update  : Regenerate Prisma client and deploy schema migrations.
- make db-reset   : Reset database schema and seed fresh data.
- make seed       : Seed the database with default profiles, actions, and test accounts.
- make logs       : Tail live logs from all running containers.
- make clean      : Stop containers, prune volumes, delete uploaded files, and remove certs.
- make backend-shell : Open an interactive shell inside the backend container.

---

## Team Information
*This project was developed by a team of 4 members with distributed responsibilities across leadership, architecture, and feature engineering:*

- **mlelu:**
  - **Role:** Product Owner (PO), Backend Developer & Database Engineer
  - **Responsibilities:** Product vision and backlog prioritization, database architecture (Prisma schemas, PostgreSQL, and migrations), backend API endpoints, and end-to-end bug fixing.
- **qupollet:**
  - **Role:** Technical Lead, Architect & Backend Developer
  - **Responsibilities:** Pull Request approval and code reviews, direct messaging services, and media upload handling.
- **thodavid:**
  - **Role:** Fullstack / UI Developer
  - **Responsibilities:** Core application shell, client-side routing, Leaflet geospatial maps, and organizations/admin interfaces.
- **lellanos:**
  - **Role:** Project Manager (PM), QA Lead & Frontend Developer
  - **Responsibilities:** Sprint planning and team coordination, end-to-end QA validation and core user profile and civic action UI flows.

---

## Project Management
- **Methodology:** Agile framework with weekly sprints, backlog grooming, and milestone planning.
- **Workflow & Branching Strategy:** Gitflow model with a protected `main` branch. Tasks are developed in isolated branches (`feature/`, `fix/`, `docs/`) linked to issues.
- **Review & Quality Assurance:** Pull Requests require peer review and approval prior to merging. Bug fixes are verified against zero console errors before closing.
- **Tools & Channels:** GitHub Projects & Issues for tracking; Discord for daily standups and architectural coordination; manual checklists for QA verification (`docs/QA_TEST_CHECKLIST.md`).

---

## Technical Stack

### Frontend
- **Framework & Tooling:** React, Vite, and TypeScript (Strict Mode) for fast builds and type-safe modular components.
- **Styling:** CSS Modules with centralized design tokens (`tokens.css`) for scoped styles and UI consistency.
- **Maps:** Leaflet with OpenStreetMap for open-source geospatial visualization.

### Backend
- **Runtime & Framework:** Node.js and NestJS (TypeScript) for modular architecture, dependency injection, and REST endpoints.
- **Database & ORM:** PostgreSQL managed via Prisma ORM for relational integrity and type-safe migrations.
- **Real-Time:** WebSockets via Socket.IO for live chat, presence, and instant event updates.

### DevOps
- **Containerization:** Docker & Docker Compose orchestrating frontend, backend, and PostgreSQL in a single automated environment.

---

## Database Schema
Managed via Prisma ORM over PostgreSQL to model civic participation, organizations, and real-time interaction:

- **User & Profile:** Authentication credentials, platform roles (`RoleApp`), account status, gamification points, and one-to-one profile metadata (username, bio, location, visibility).
- **UserInterest:** Categorizes citizen interests across environmental, social, and cultural domains.
- **Organization & Member:** Neighborhood collectives linked to creators, managing workspace roles (`RoleOrg`) and membership status (`MemberStatus`).
- **Action & Participation:** Civic initiatives tracking capacity bounds, status lifecycles (`ActionStatus`), GPS coordinates, and user enrollment via `Participation`.
- **Comments:** Threaded discussions attached directly to actions (`ActionComment`) and organizations (`OrganizationComment`).
- **Social & Messaging:** Prospective friend requests (`FriendRequest`), active/blocked relationships (`Friendship`), and 1-to-1 direct messages (`DirectMessage`).
- **Notifications & Points:** Event-driven notification system with user preferences (`NotificationPreference`), and an audit ledger for earned civic points (`PointTransaction`).

## Features List

### 1. Authentication & Session Management
- **Registration & Login:** Secure authentication flows issuing signed JWT tokens with refresh-token rotation.
- **Account Lifecycle:** Self-deactivation option via profile settings; deactivated and suspended accounts are prevented from logging in.
- **Access Control:** Blocked users cannot publish, join, or comment on civic actions.

### 2. User Profile & Settings
- **Profile Customization:** Edition of username, biography, commune, neighborhood coordinates, and interests.
- **Privacy Tiers:** Granular visibility toggle supporting `PUBLIC`, `FRIENDS_ONLY`, and `PRIVATE` modes.
- **Account Deletion:** Permanent GDPR-compliant account removal via a dedicated confirmation modal.
- **Notification Settings:** Independent toggles for direct messages, comments, requests, and action updates.

### 3. Citizen Actions Lifecycle
- **Action CRUD:** Full lifecycle to create, edit, join, and cancel community initiatives across environmental, social, and cultural categories.
- **Capacity Management:** Real-time seat tracking enforcing minimum thresholds and maximum participant caps.
- **State Progression:** Moderated lifecycles tracking `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, and `COMPLETED` statuses.

### 4. Interactive Geospatial Mapping
- **Spatial Discovery:** Real-time visualization of neighborhood initiatives using Leaflet and OpenStreetMap markers.
- **Map Proposing Tool:** Capability to propose new actions directly by picking GPS coordinates on the map.

### 5. Social Directory & Friendships
- **Connection Handshake:** Bilateral friend request workflows (`PENDING_SENT`, `PENDING_RECEIVED`).
- **Social Management:** Directory to accept, decline, remove, or block connections.
- **Contextual CTAs:** Dynamic friendship action buttons on public profiles.

### 6. Communication & Discussions
- **Direct Messaging:** Private 1-to-1 chat conversations between confirmed connections.
- **Action Comments:** Public discussion threads on action detail pages.
- **Organization Boards:** Community feedback walls on organization profiles.

### 7. Media & File Uploads
- **Profile Avatars:** Client- and server-validated profile image uploads with format and size restrictions.
- **Action Evidence:** Before-and-after photo galleries supporting visual documentation for initiatives.

### 8. Organizations & Collectives
- **Collective Workspaces:** Profiles for local neighborhood associations, businesses, and grassroots groups.
- **Role Governance:** Membership tiers with `OWNER`, `MANAGER`, and `MEMBER` privileges.
- **Sponsored Initiatives:** Ability for approved organizations to propose and sponsor official neighborhood actions.

### 9. Administration & Platform Moderation
- **User Governance:** Operator controls to inspect account statuses, activate, suspend, or block users.
- **Organization Audit:** Administrative tools to approve, suspend, or close organization accounts.
- **Action Moderation:** Dedicated moderation queues to inspect, approve, reject, or hide proposed actions.

## Modules

### Module Overview & Point Calculation

The project implements a total of **17 points** across the module categories:

| Category | Module Name | Type | Points | Assigned Member(s) |
| :--- | :--- | :--- | :--- | :--- |
| **Web** | Web Frameworks | Major | 2 pts | mlelu, thodavid, qupollet, lellanos |
| **Web** | Real-time Features | Major | 2 pts | qupollet, thodavid |
| **Web** | Allow users to interact with other users | Major | 2 pts | qupollet, lellanos, thodavid |
| **Web** | ORM for Database | Minor | 1 pt | mlelu |
| **Web** | Notification System | Minor | 1 pt | mlelu, qupollet, lellanos |
| **Web** | Advanced Search & Filters | Minor | 1 pt | thodavid, qupollet |
| **Web** | File Upload & Management | Minor | 1 pt | qupollet, lellanos |
| **Accessibility and Internationalization** | Support for Additional Browsers | Minor | 1 pt | lellanos |
| **User Management** | Standard User Management | Major | 2 pts | mlelu, lellanos, thodavid |
| **User Management** | Advanced permissions system | Major | 2 pts | mlelu, thodavid |
| **User Management** | Organization System | Major | 2 pts | mlelu, thodavid |
| **Total Points** | | | **17 pts** |

---

### Module Details

#### 1. Web Frameworks (Major – 2 pts)
- **Members:** mlelu, thodavid, qupollet, lellanos
- **Implementation:** React frontend with TypeScript, NestJS backend REST API, and modular Single Page Application (SPA) routing via React Router.

#### 2. Real-time Features (Major – 2 pts)
- **Members:** qupollet, thodavid
- **Implementation:** Delivering real-time direct chat messages, live notifications.

#### 3. Allow users to interact with other users (Major – 2 pts)
- **Members:** qupollet, lellanos, thodavid
- **Implementation:** Public user profiles, friend request lifecycle, public action comments and private 1-to-1 direct messaging, 

#### 4. ORM for Database (Minor – 1 pt)
- **Member:** mlelu, qupollet
- **Implementation:** PostgreSQL database managed with Prisma ORM, handling declarative models, relations, migrations, and automated database seeding.

#### 5. Notification System (Minor – 1 pt)
- **Members:** mlelu, qupollet, lellanos
- **Implementation:** Automated event alerts triggered on new messages, comments, status changes.

#### 6. Advanced Search & Filters (Minor – 1 pt)
- **Members:** thodavid, qupollet
- **Implementation:** Multi-entity search across citizen actions, users, and organizations with keyword queries, category and status filtering, geospatial map search via Leaflet/OpenStreetMap.

#### 7. File Upload & Management (Minor – 1 pt)
- **Members:** qupollet, lellanos
- **Implementation:** Multi-part file upload endpoints handling image validation, storage, profile avatars, and before/after action galleries.

#### 8. Support for Additional Browsers (Minor – 1 pt)
- **Member:** lellanos
- **Implementation:** Tested and verified functionality across Google Chrome, Mozilla Firefox, and Brave.

#### 9. Standard User Management (Major – 2 pts)
- **Members:** mlelu, lellanos, thodavid
- **Implementation:** Email and salted/hashed password authentication with JWT sessions, profile customization, multi-tier privacy settings (PUBLIC, FRIENDS_ONLY, PRIVATE), and account deactivation/deletion.

#### 10. Advanced permissions system (Major – 2 pts)
- **Members:** mlelu, thodavid
- **Implementation:** User role management (`USER`, `ADMIN`), user status lifecycle controls (active, suspended, deactivated), and protected administration routes (`/admin`) with dedicated views for accounts, citizen action validation, and organization governance.

#### 11. Organization System (Major – 2 pts)
- **Members:** mlelu, thodavid
- **Implementation:** Organization , role-based member management (OWNER, MANAGER, MEMBER), join requests approval workflow, and public organization pages.

## Individual Contributions

### thodavid
- **Tasks, features, modules, or components implemented:**
  - Choose the artistic direction
  - Make the mockups
  - Design the frontend code base
  - Build the shared modules
  - Build the frontend pages and respect the design system
  - **Design system:** `shared/ui` (`Button`, `Dialog`, `ConfirmDialog`, `FloatingField`, `Chip`, `Avatar`, `Icon`, `Steps`, `CommentThread`, `StreetScene`), CSS tokens, light/dark admin theme
  - **App shell:** Header, footer, bottom nav (mobile), routing, lazy pages
  - **Home:** Landing for visitors, adaptive dashboard for logged users (compact map, my actions, nearby actions)
  - **Map:** Actions on a map, geolocation on demand, create an action from a point on the map
  - **Actions:** List, detail, create, edit, cancel, comments
  - **Organizations:** Directory (search, sort, filters, paging, URL state), detail page with the constellation graph, create organization (map picker + form), join / manage members, comments
  - **Participations:** Join / leave an action, my participations
  - **Admin:** Users (block / unblock), actions moderation (approve / hide), organizations (suspend / close / reactivate), shared admin table and list hook
  - **Auth UI:** Login / register forms, "My Actions" sign-in card for visitors
- **Challenges faced and how he overcome:**
  - *Keep track of the complexity of the code base:* Organized one folder per feature with strict import rules.
  - *Make good decisions with the team:* Checked every backend change, kept the API contract up to date, and wrote questions down before coding.
  - *Have an overview of all the code:* Performed regular checkups of `main` (build, lint, routes in a headless browser) and delivered small, focused PRs.

### qupollet
- **Tasks, features, modules, or components implemented:**
  - Pull Request Review (checking all code modifications)
  - Backend developer (implementing features)
  - Bug fixing (at the same time)
  - Token-based Authentication
  - Image uploading and compression (Avatar + Action Pictures)
  - Direct Messages
  - Comments on Actions and Organizations
  - Added new modules in the Prisma schema
- **Challenges faced and how he overcome:**
  - *Learning how to use Git (GitHub) in a team:* Leveraged Git documentation and AI assistance.
  - *Working with HTML/CSS/TS:* Studied documentation, web references, and AI tools.
  - *Working in a bigger team:* Maintained continuous communication with team members.

### mlelu
- **Tasks, features, modules, or components implemented:**
  - Database & Prisma
  - Database Seeding 
  - Fullstack developer
  - Backend API Endpoints:
  - Bug Fixing & Integration
- **Challenges faced and how she overcome:**
  

### lellanos
- **Tasks, features, modules, or components implemented:**
  - User Profile & Settings
  - Social Interactions & Friendship
  - Action Details UI
  - **Quality Assurance & Testing:** Built QA testing checklists (`docs/QA_TEST_CHECKLIST.md`), conducted systematic cross-browser testing across Google Chrome, Mozilla Firefox, and Brave, enforcing a strict zero-console-warning policy.
- **Challenges faced and how she overcome:**
  - *Sprint coordination and Gitflow as PM:* Standardized PR conventions (`Closes #<id>`), managed backlog boards in GitHub Projects.
  - *Lifecycle of github tickets:* Send message to the team telling them how we should handle them. 
