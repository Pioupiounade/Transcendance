Suivi des actions :

1. Docker :
    - J'ai recupere le docker de mon projet Inception et supprime les informations inutiles (Worpdress, MariaDB)
    - J'ai cree des dossiers pour frontend, backend et Nginx
    - J'ai cree le docker-compose.yml qui permet de lancer PostgreSQL (pour la BDD du projet)
    - PostgreSQL est la bases de donnees relationnelle utilisee par le projet.
    - J'ai cree le dockerfile et mis a jour le docker-compose.yml pour Nest JS. Il a une dependance a PostgreSQL et ce dernier doit etre `healthy` pour que NestJS se lance.
    - J'ai cree le dockerfile pour le frontend.


2. Backend :
    - J'ai installe NestJS mais suite a un probleme de place dans la session 42, j'ai du mettre le cache NPM dans le goinfre en attendant de reformater ma cle pour travailler dessus apres.
    - Le cache NPM est le gestionnaire de paquets utilise pour installer NestJS et les differentes dependances de Nest JS du projet.
    - NestJS sera utilise pour le backend, il prend toute la logique metier du projet. C'est le framework utilise pour developper le backend et expose les API de l'application. Il fait l'intermediaire entre le frontend et les donnees de l'application.
    - J'ai lancé NestJS localement avec `npm run start:dev` afin de vérifier que le projet compile et que le serveur démarre correctement.
    - J'ai teste en faisant un `curl http://localhost:3000` depuis un autre terminal : cette commande envoi une requete `HTTP GET / 3000` sur le port 3000 et le port repond "Hello World!"
    
-> Pourquoi le port 3000 ? : C'est le port utilise par defaut par NestJS.

    - NestJS fournit un kit de demarrage, un squelette de fichiers prets a etre utilises et enrichis pour le developpement du backend.
    
3. Frontend :
    - Depuis la racine du projet, j'utilie npm pour installer react.
    - Je cree le frontend avec VITE en utilisant le template React + TypeScript. Vite fournit l'environnement qui permet de developper et construire le frontend. Un peu comme NestJS, il va generer la structure de depart.
    - Lors de l'installation, je peux choisir entre Oxlint et ESLint. Je choisis ce dernier parce qu'il utilise `Linter` qui va analyser le code pour detecter des problemess et faire respecter certaines regles. 
    - Apres l'installation, au demarrage de Vite, il va me donner un lien `http://localhost:5173/`. Je clique dessus et ca ouvre le site dans le navigateur.

-> En resume :
    TypeScript → LANGAGE
    React      → BIBLIOTHÈQUE frontend
    Vite       → OUTIL de développement/build

    Le frontend est écrit en TypeScript et utilise React pour construire l’interface utilisateur. Vite fournit l’environnement de développement et de build.

4. Prisma :
    - PrismaORL va permettre de faire le lien entre NestJS (le backend) et PostgreSQL (la base de donnees)
    - Primsa a 2 librairies :
        - prisma : librairie principale qui va etre installee dans les dependances de `dev`. Elle permet d'executer des commandes dans le terminal pour faire des actions.
        - @prisma/client : cette librairie va etre dans les dependances et va permettre de faire des requetes a la base de donnees.
    - Prisma a ete installe et un dossier cree dans le frontend.
    - Fichier Schema Prisma : Le fichier dans lequel on donne les details de la source de donnees a laquelle Prisma doit se connecter.
    - 4 concepts fondamentaux a maitriser :
        - Modeles = Une table. Le nom du modele Prisma doit correspondre au nom de la table de la bdd
        - Champs = Les proprietes d'un modele. Le champs est defini par son nom et type (opt : attribut)
            - Nom en camelCase, doit correspondre au nom de la colonne en BDD
            - Type en PascalCase :
                - Scalar comme String, Int, Boolean
                - Relations : indique si un modele est lie a un autre
            - [] : transforme le champs en liste
            - ? : le rend facultatif
        - Attributs : modifie le comportement d'un champs ou d'un modele
            - @ : pour modifier le comportement d'un champs specifique (ex : @id // @default // @unique // @ updatedAt)
            - @@ : pour modifier le comportement d'un modele ou d'un groupe de champs
            - il existe des fonctions (ex:autoincrement() pour generer des identifiants auto // uuid() genere un identifiant unique // now() pour horodater l'event)
        - Relations : connecter 2 modeles Prisma
            - OneToOne : Un element A correspond a un seul element B. (user -> profile)
            - OneToMany / ManyToOne : Plusieurs elements de la table "Many" se connectent a un seul element de la table "One"/ (user -> plusieurs posts // post -> un seul user) 
            - ManyToMany : lier plusieurs elements d'une table a plusieurs elements d'une autre (utilisateur -> plusieurs groupes // groupe -> plusieurs utilisateurs)
    - Les commandes suivantes permettent de verifier le format du schema.prisma :
        ```
            npx prisma format
            npx prisma validate
        ```
    - Une fois le format et les relations verifiees, il faut connecter Prisma avec PostgreSQL. On effectue une migration : 
    ```
        npx prisma migrate dev --name init
    ```
    La commande traduit le schema.prisma en un fichier `migration.sql`. Les bases de donnees ont ete crees mais sont vides. Il faut maintenant faire le lien entre la base de donnees et NestJS.

    - En cas de modifications dans le schema.prisma, il faut reverifier le format / validate et une nouvelle migration. Une nouvelle couche sera ajoutee sans modifier la migration d'origine:
        1. Je modifie schema.prisma
        2. Je vérifie mon schéma
            ```
                npx prisma format
                npx prisma validate
            ```
        3. Je crée + applique la migration
            ```
                npx prisma migrate dev --name nom_explicit_de_la_modification
            ```

5. Lien Prisma -> Nest JS 
    - Depuis le backend : ``` npx prisma generate``` permet de generer un Prisma Client en TypeScript. NestJS utilisera Prisma Client pour accéder à PostgreSQL. Prisma se charge ensuite de générer et exécuter les requêtes SQL nécessaires. 
    - Dans le dossier /generate un sous-dossier /model contient les fichiers TypeScript -> 1 par modele.
     - Les commandes suivantes permettent de creer le module et le service :
        ```
            npx nest generate module prisma
            npx nest generate service prisma
        ```
    - Un module est un contenant qui permet d'organiser les composant. Un module contient le service. Ainsi, il y aura un modul principal et des modules fonctionnels qui peuvent contenir un ou plusieurs services chacun.
    - Un service Nest JS : une classe qui contient une fonctionnalite que d'autres parties de l'application pourront utiliser
        ex : PrismaService continendra PrismaClient, il agit conne un service centrat pour acceder a Prisma. Une porte d'entree vers PrismaClient mais il contiendra peu de logique puisque chaque grand bloc aura son propre service (ex:UserService, ActionService, PointService etc) qui saura quoi faire avec les donnees.
    En bref :
        A la creation d'un nouveau module:
            → création de xxx.module.ts
            → app.module.ts est mis à jour pour importer ce module

        A la creation d'un nouveau service
            → création de xxx.service.ts
            → création de xxx.service.spec.ts
            → xxx.module.ts est mis à jour avec providers: [XxxService]

        Puis, si ce service a besoin de la BDD
            → il reçoit PrismaService par injection:
                    prisma.module.ts
                        ↓ exporte
                    PrismaService
                        ↓ devient accessible à
                    users.module.ts
                        ↓
                    users.service.ts
                        ↓ injecte PrismaService
    - Je cree un module pour PrismaClient + un service.
    - Je modifie le `prisma.services.ts` pour importer les elements dont j'ai besoin (fonction Injectable / PrismaClient / adapter qui permet a Prisma de communiquer avec PostgreSQL)
    - J'applique `@Injectable()` à `PrismaService` pour indiquer à NestJS que cette classe peut être gérée par son système d'injection de dépendances.
    - `PrismaService` hérite de `PrismaClient` avec `extends PrismaClient`. Il récupère donc les fonctionnalités permettant d'accéder aux modèles de la BDD.
    - Dans le constructeur de `PrismaService`, je configure l'adapter PostgreSQL et le transmets au constructeur de `PrismaClient` avec `super({ adapter })`.
    - Je modifie le `prisma.module.ts` en important la fonction `module` et PrismaService.
    - Le decorateur (fonction) `@Module()` me permet de declarer et "d'exporter" PrismaService.
    - `providers : [PrismaService]` indique que `PrismaService` est fourni et gere par `PrismaModule`.
    - `exports: [PrismaService]` rend `PrismaService` accessible aux autres modules.
    - Les modules qui ont besoin d'acceder a la BDD dependent de `PrismaModule` et doivent importer `PrismaModule`.
    - Une fois `PrismaModule` importe, les services de ces modules peuvent recevoir `PrismaService` par injection de dependances.

    - Je recommence pour UserService en generant un Module et un Service. 
    - Pour verifier que ca compile, dans /backend, lancer la commande : ```npm run build```.
    - On cree ensuite un `controller` avec la commande ```npx nest generate controller users``` qui va generer :
        - users.controller.ts : le controller
        - users.controller.spec.ts : les tests du controller
        - met a jour users.module.ts pour declarer le controller
    - Le `controller` est une classe chargee de receoir les requetes HTTP. On lui applique un `@Controller` importe depuis `@nestjs/common`
    - Dans `users.controller.ts`, `@Controller('users')` indique que le controller gère les requêtes arrivant sur `/users`.
    - `@Get()` indique ce que NestJS doit exécuter lorsqu'une requête HTTP GET arrive sur cette route.
    - J'injecte `UsersService` dans `UsersController`, puis la méthode du controller appelle la méthode correspondante du service.
    - Je test que ca fonctionne avec :
    ```
        bash-5.3$ curl http://localhost:3000/users
        []bash-5.3$
    ```
    Le [] retourne est normal, ma base est vide pour l'instant.

6. Creer un premier utilisateur 
    - DTO (Data Transfer Object) : classe qui définit la structure des données échangées avec l'API. Par exemple, `CreateUserDto` définit les données
    que le client doit envoyer pour créer un utilisateur. Un DTO ne correspond pas forcément directement à une table de la BDD.
    - Je crée un dossier `dto` dans `users`, avec un fichier `create-user.dto.ts`. Dans ce fichier, je définis les champs qui devront être envoyés à l'API pour créer un nouvel utilisateur : `email` et `password`.
    - Je modifie ensuite `users.controller.ts` pour : 
        - importer `CreateUserDto` ;
        - importer et utiliser `@Post()` (ce que je dois faire quand j'ai un POST) et `@Body()` (ou quelles donnees recuperees) ;
        - ajouter la méthode à exécuter lorsqu'une requête `POST /users` arrive ;
        - récupérer les données du body et les transmettre à `UsersService`.

    - Je vais ensuite dans `users.service.ts` pour créer la méthode `create()`. Cette méthode contiendra la logique permettant de créer réellement l'utilisateur avec Prisma.
    - Avant d'enregistrer l'utilisateur, il faut gérer le mot de passe : le client envoie `password`, mais la BDD stocke `password_hash`. Le mot de passe ne doit donc jamais être enregistré en clair.
    - J'installe Argon2 pour effectuer le hachage :
        `npm install argon2`
    - Une fois argon2 installe, je l'importe dans `users.service.ts` .
    - Je permets la gestion des Bigint
    - Je cree la methode create() dans `users.service.ts`
    - Le DTO decrit les types mais ne verifie pas que les donnees recues sont valides, pour ca on utilise les classes standard : `class-validator` et `class-transformer`.
    - Je lance la commande `npm install class-validator class-transformer`
    - Je modifie le `create-users.dto.ts pour mettre des conditions (ex: doit etre une string, contenir 8 caracteres min)
    - Je modifie le `src/main.ts` pour que Nest JS applique les regles de validation des DTO quand un requete arrive.
    - Avec la ligne app.useGlobalPipes(), cette validation devient active pour toute l'application.
    - Je peux desormais interagis avec la BDD directement avec : ```npx prisma studio```

7. Recuperer un utilisateur avec son id :
    - je cree une nouvelle regle GET dans `users.controller,ts`
    - j'ajoute un fonction async findOne(id: string) qui prend l'id en argument et retourne l'utilisateur. Une exception permet de retourner une erreur si l'id n'est pas trouve.

8. Modifier l'utilisateur en statut `desactive`
    - modifier les fichier `users.service.ts` et `users.controller,ts`

9. Creer le module et le service pour `Organization`
    - 