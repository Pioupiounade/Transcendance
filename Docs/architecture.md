# Architecture

## 1. Architecture Overview

Pioupiounades follows a modern client-server architecture.

The application is composed of a React Single Page Application (SPA) communicating with a NestJS backend through a REST API.

REACT - Frontend : Bibliotheque Javascript qui permet de construire l'interface utilisateur. Tout ce que voit l'utilisateur est construit avec React.

SPA (Single Page Application) : avant, il fallait recharger integralement la page a chaque clic. Avec SPA, React remplace juste la partie qui change. Si je clique sur une action, elle charge seulement la fiche de l'action sans tout recharger. L'application va utiliser plein d'interface dynamiques comme les chats, notifications, commentaires, donc le SPA est adapte.

TYPESCRIPT : TypeScript permet de créer des types qui décrivent la structure des données manipulées par l'application. Il vérifie, pendant le développement, que le code respecte ces types et signale les incohérences avant l'exécution. En utilisant les mêmes modèles de données côté frontend et backend, il améliore la cohérence, la maintenabilité et la fiabilité du code.

API : Une interface de communication entre le frontend et le backend. Elle permet au frontend de demander des donnees, executer des actions sans acceder directement a la base de donnees. L'API controle les acces, valide les donnees et renvoie les reponses au client. Le frontend ne parle jamais a la base de donnees. Il parle uniquement a l'API qui est le seul intermediaire autorise entre l'interface utilisateur et les donnees. L'API fonctionne avec quelques verbes :
 - GET -> Lire
 - POST -> Creer
 - PUT / PATCH -> Modifier
 - DELETE -> Supprimer
 
REST API - Representational State Transfer : Une porte d'entree qui permet au frontend de demander ou de modifier des donnees sur le serveur. REACT n'a jamais acces a la base de donnees sinon n'importe qui pourrait modifier les donnees. REST API sert de gardien.

Websockets : Protocole de communication. Permettent une communication permanente entre le frontend et le backend. Contrairement a une requete REST, la connexion reste ouverte ce qui permet au serveur d'envoyer immediatement des informations au navigateur. Ils sont utiliser pour toutes les fonctionnalites temps reel (ex: messagerie privee, notifications instantanees...etc)

NestJS Backend : Le coeur de l'application. Il contient toute la logique metier. Le backend recoit les requetes provenant du frontend, verifie les droits d'acces, valide les donnees puis interagit avec la base de donnees.

Socket.IO Gateway : la bibliotheque utilisee pour gerer les communications WebSocket. La bibliotheque offre des fonctionnalites pour gerer directement les connexions/reconnexions automatiques, des salons, diffusions a plusieurs etc. Socket est un peu le telephone alors que Websocket est le reseau. Surtout, Socket.IO est un module de NestJS specialise dans les communications WebSocket.

Prisma ORM - Object Relational Mapper : Sa fonction est de faire la traduction entre les objets de type TypeScript et la base de donnees.  

Persistent data is stored in a PostgreSQL database using Prisma ORM.

Real-time features such as private messaging and notifications rely on WebSockets (Socket.IO).

Uploaded media (profile pictures, action photos and suggestion images) are stored separately from the database and referenced through dedicated entities.

The whole application is containerized with Docker Compose to ensure a reproducible development and deployment environment.

                    +--------------------+
                    |      Browser       |
                    +--------------------+
                              |
                              |
                     React SPA (TypeScript)
                              |
                    REST API / WebSockets
                              |
             +----------------+----------------+
             |                                 |
             |                                 |
        NestJS Backend                  Socket.IO Gateway
             |                                 |
             +----------------+----------------+
                              |
                           Prisma ORM
                              |
                        PostgreSQL Database
                              |
                              |
                      Uploaded Media Storage

## 2. Technical Stack

Technical Stack : L'ensemble des technologies (langages, frameworks, bases de donnees...etc) utiliser pour faire fonctionnel le logiciel. Elle se structure autour de deux composantes majeurs : le front-end (interface utilisateur) et le back-end (logique serveur).
Le front-end est visible pour l'utilisateur et utilise HTML, CSS, JavaScript. Le back-end est non visible par l'utilisateur final mais est la compostante centrale. Il gere la logique metier, les operations complexes, la gestion des bases de donnees et les API. 
Les choix faits pour la stack technique impactent direcement la velocite de developpement, la capacite d'evolution (scalabilite) de l'application, son niveau de securite, sa facilite de maintenance et les couts operationnels a long terme. 

### Frontend
- React ----> User Interface -> Construire l'interface utilisateur r à partir de composants réutilisables. React permet de créer une Single Page Application (SPA), où la navigation s'effectue sans recharger entièrement la page.
- TypeScript ----> Static typing -> Langage qui utilise un systeme de types et recommande pour les grands projets. Les erreurs sont detectees des l'ecriture du code et la compilation.

Supporting libraries :
- React Router -> lib qui permet de gerer la navigation et le routage d'une application web sans recharger la page.
- TanStack Query -> lib puissante qui sert à récupérer, mettre en cache, synchroniser et mettre à jour des données distantes (provenant d'un serveur) dans une application web. Il évite également de refaire inutilement les mêmes appels API grâce à son système de cache.
- Leaflet -> lib qui permet d'afficher des cartes interactives en se connectant a des fournisseurs comme OpenStreetMap.
- CSS framework (TBD)

### Backend
- NestJS-------> Business logic & REST API -> Framework backend basé sur Node.js. Il permet de créer des API REST, d'organiser le code en modules et de centraliser toute la logique métier de l'application.
- Socket.IO-----> Real-time communication -> lib qui permet une communication bidirectionnelle, en temps reel et basee sur les evenements entre un client et un serveur. Il implémente les communications WebSocket et simplifie les échanges temps réel entre le navigateur et le serveur.

Supporting libraries :
- Swagger -> lib qui permet de générer automatiquement une documentation interactive des API REST. Il facilite leur visualisation, leur test et leur maintenance.

### Database
- PostgreSQL-------> Data persistence -> Base de données relationnelle utilisée pour stocker l'ensemble des données persistantes de l'application (utilisateurs, actions, messages, participations...)
- Prisma ORM-------> Database abstraction -> ORM (Object Relational Mapper) qui fait le lien entre NestJS et PostgreSQL. Il permet de décrire le modèle de données, de générer les tables de la base de données et de manipuler les données sous forme d'objets TypeScript plutôt qu'en écrivant directement des requêtes SQL.

### Infrastructure
- Docker---------> Containerization -> Plateforme permettant d'exécuter chaque service de l'application dans un conteneur isolé, garantissant un environnement identique pour tous les développeurs.
- Docker Compose--> Multi-container orchestration -> Outil permettant de lancer et de configurer simultanément plusieurs conteneurs (frontend, backend, base de données...) avec une seule commande.
- Nginx-------> Reverse proxy & HTTPS -> Serveur web et reverse proxy. Il distribue les requêtes vers les différents services de l'application, gère HTTPS et peut servir les fichiers statiques.

### Testing
- Jest -> Outil de test Javascript qui automatise les tests de projet.
- React Testing Library -> Outil de test pour tester les composants React du point de vue de l'utilisateur.
- Supertest -> Outil de test des API HTTP/REST

## 3. System Architecture

-> Expliquer comment les differentes parties de l'application cooperent + 2/3 flux generaux

Le projet suit une architecture client - serveur, en couches, avec un front-end, back-end et une base de donnees.
Un seul backend avec NestJS qui contient plusieurs modules independants :
- utilisateurs
- actions
- messages
- notifications

Presentation layer
-> React affiche l’interface et recueille les actions de l’utilisateur.

Communication layer
-> REST transporte les requêtes classiques.
-> WebSockets transportent les événements temps réel.

Application layer
-> NestJS applique les règles métier, les validations et les permissions.

Persistence layer
-> Prisma fournit l’accès aux données.

Data layer
-> PostgreSQL conserve les données persistantes.
-> Le stockage média conserve les fichiers.

Exemple de flux CREATION D'UNE ACTION:

Utilisateur
→ formulaire React --> Front
→ requête REST --> Front
→ validation NestJS --> Back
→ écriture avec Prisma --> BDD
→ PostgreSQL --> BDD
→ réponse vers React --> Front

## 4. Frontend Architecture

-> Comment le code React sera organise et comment le frontend remplira ses responsabilites

Que fait le front-end ? :
- Afficher les pages
- Recuperer les donnees de l'API
- Gerer la navigation
- Afficher les etats de chargement et les erreurs
- envoyer les formulaires
- gerer la session cote interface
- recevoir les evenements de Socket.IO
- afficher la carte

Organisation :

frontend/src/
├── pages/ --> ecrans correspondant aux routes
├── components/ --> elements reutilisables (boutons, cartes, modales)
├── features/ --> code regroupe par domaine metier (actions, chat)
├── services/ --> appels a l'API
├── hooks/ --> logique React reutilisable
├── contexts/ --> donnees globales (l'utilisateur connecte)
├── types/ --> defintions Typescript
├── assets/ --> images et icones
└── tests/

Composants minimum :
- Bouton
- Champs de formulaire
- cadre d'action
- avatar
- modale
- badge
- notification
- chargeur
- message d'erreur
- selecteur de categorie

## 5. Backend Architecture

->Comment NestJS organise la logique metier

Les modules :

AuthModule
UsersModule
OrganizationsModule
ActionsModule
SuggestionsModule
ParticipationsModule
CommentsModule
ChatModule
NotificationsModule
MediaModule
AdminModule
CategoriesModule



## 6. Database Architecture

-> Description des donnees stockees, comment elles sont reliees, les regles qui garantissent la coherence.

## 7. API Design

-> Definition des conventions de l'API REST

## 8. Real-time Communication

-> Quelles fonctions utilisent Socket.IO, comment les connexions sont organisees et comment les donnees restent coherentes.

## 9. File Storage

-> Ou sont stockes les fichiers et comment leur upload et securise

## 10. Security

-> Les principales menaces et les mecanismes prevus pour la protection de l'application

### 10.1 Autorisations et Rôles (RBAC)

La plateforme implémente un contrôle d'accès basé sur les rôles (RBAC) côté frontend et backend :

- **USER (Habitant) :**
  - Créer et gérer ses propres actions de quartier.
  - Participer aux actions validées.
  - Gérer son profil personnel, ses centres d'intérêt et ses demandes d'amis.
  - Créer et administrer des organisations de quartier.

- **MODERATOR (Modérateur) :**
  - Dispose de toutes les fonctionnalités d'un **USER**.
  - Examiner les actions soumises et modifier leur statut (`approved` / `rejected`).
  - Accéder à la file de modération et aux signalements de la communauté.

- **ADMIN (Administrateur) :**
  - Accès complet à l'administration du système.
  - Gérer le cycle de vie des comptes utilisateurs (ex. passer le statut à `suspended` ou `deactivated`).
  - Modérer les organisations et modifier les paramètres globaux de la plateforme.
  - Consulter les métriques globales et les journaux d'activité.
  
  ## 11. Deployment

-> Comment lancer l'application, son exposition en HTTPS

## 12. Future Evolutions

-> Les evolutions possibles.
