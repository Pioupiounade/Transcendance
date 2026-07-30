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
- React ----> User Interface -> Construire l'interface utilisateur
- TypeScript ----> Static typing -> Langage qui demande plus de precisions que le Javascript et recommande pour les grands projets. Les erreurs sont detectees des l'ecriture du code et la compilation.

Supporting libraries :
- React Router -> lib qui permet de gerer la navigation et le routage d'une application web
- TanStack Query -> lib puissante qui sert à récupérer, mettre en cache, synchroniser et mettre à jour des données distantes (provenant d'un serveur) dans une application web.
- Leaflet -> lib qui permet d'afficher des cartes interactives en se connectant a des fournisseurs comment OpenStreetMap.
- CSS framework (TBD)

### Backend
- NestJS-------> Business logic & REST API -> framework a conception modulaire, utilise pour creer des API
- Socket.IO-----> Real-time communication -> lib qui permet une communication bidirectionnelle, en temps reel et basee sur les evenements entre un client et un serveur.

Supporting libraries :
- Swagger -> 

### Database
- PostgreSQL-------> Data persistence
- Prisma ORM-------> Database abstraction

### Infrastructure
- Docker---------> Containerization
- Docker Compose--> Multi-container orchestration
- Nginx-------> Reverse proxy & HTTPS

### Testing
- Jest
- React Testing Library
- Supertest

## 3. System Architecture

## 4. Frontend Architecture

## 5. Backend Architecture

## 6. Database Architecture

## 7. API Design

## 8. Real-time Communication

## 9. File Storage

## 10. Security

## 11. Deployment

## 12. Future Evolutions