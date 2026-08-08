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
    