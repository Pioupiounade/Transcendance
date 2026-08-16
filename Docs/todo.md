ORM ->

* Implémenter `Participations`

  * rejoindre une action ;
  * quitter une action ;
  * lister les participants d’une action ;
  * lister les actions auxquelles participe un utilisateur ;
  * empêcher les doublons ;
  * vérifier `max_participants` ;
  * éventuellement tenir compte de `min_participants`.

* Implémenter `OrganizationMembers`

  * demander à rejoindre une organisation ;
  * approuver/refuser une demande ;
  * gérer les rôles `MEMBER / MANAGER / OWNER` ;
  * vérifier les droits selon le rôle ;
  * lister les membres d’une organisation ;
  * lister les organisations auxquelles appartient un utilisateur.

* Implémenter le système de points

  * créer un `PointsService` ou équivalent ;
  * utiliser `PointTransaction` ;
  * attribuer/retirer des points selon des événements métier ;
  * éviter les modifications arbitraires de `User.points` ;
  * conserver l’historique des transactions.

* Ajouter les recherches restantes

  * recherche utilisateur par `username` ;
  * autocomplétion utilisateur ;
  * recherche actions par date
  * permettre plus tard la combinaison de plusieurs filtres.

* Vérifier toutes les contraintes Prisma

  * clés étrangères ;
  * champs `@unique` ;
  * clés primaires composées ;
  * valeurs par défaut ;
  * enums ;
  * relations optionnelles ou obligatoires ;
  * comportements lors de suppressions/désactivations.

* Vérifier les DTO

  * un `Create...Dto` par création ;
  * un `Update...Dto` ou des DTO métier dédiés ;
  * validations `class-validator` ;
  * champs optionnels correctement déclarés ;
  * ne jamais exposer des champs sensibles comme `password_hash`.

* Uniformiser les réponses API

  * convertir tous les `BigInt` en `string` ;
  * éviter la duplication de cette conversion dans tous les services si possible ;
  * renvoyer des `404`, `400`, `403` cohérents.

* Ajouter les règles d’autorisation quand l’authentification sera disponible

  * propriétaire du compte ;
  * `ADMIN` ;
  * créateur d’organisation ;
  * `OWNER` ;
  * `MANAGER` ;
  * utilisateur actif/suspendu/désactivé ;
  * ne plus passer librement `currentUserId` depuis le client.

* Tester chaque bloc

  * cas nominal ;
  * ID inexistant ;
  * clé étrangère invalide ;
  * données invalides ;
  * transitions de statut impossibles ;
  * utilisateur non autorisé ;
  * doublons ;
  * limites de participation.

* Une fois tout cela fait, la partie ORM sera essentiellement terminée :

  * le `schema.prisma` représentera correctement les données ;
  * les migrations seront à jour ;
  * Prisma accédera correctement à PostgreSQL ;
  * chaque domaine aura son service ;
  * les relations et contraintes métier principales seront implémentées ;
  * l’authentification/autorisation pourra ensuite venir sécuriser les opérations déjà définies.


* **Authentification**

  * inscription / connexion ;
  * gestion des sessions ou JWT selon votre choix ;
  * récupération de l’utilisateur connecté ;
  * changement de mot de passe ;
  * mot de passe oublié / reset ;
  * déconnexion.

* **Autorisation / rôles**

  * Guards NestJS ;
  * vérifier `USER` / `ADMIN` ;
  * protéger les routes sensibles ;
  * vérifier propriétaire du compte ;
  * vérifier `OWNER` / `MANAGER` d’organisation ;
  * remplacer les `currentUserId` temporaires par l’identité issue de l’auth.

* **Frontend React**

  * pages principales ;
  * navigation ;
  * formulaires ;
  * appels API vers NestJS ;
  * affichage des erreurs ;
  * gestion de l’état utilisateur connecté ;
  * affichage conditionnel selon les rôles/statuts.

* **Pages utilisateurs**

  * inscription / login ;
  * profil ;
  * modification email / mot de passe ;
  * intérêts ;
  * amis ;
  * historique des participations ;
  * points.

* **Pages organisations**

  * création ;
  * consultation ;
  * modification ;
  * recherche/autocomplétion ;
  * recherche géographique ;
  * membres ;
  * rôles `MEMBER / MANAGER / OWNER` ;
  * demandes d’adhésion ;
  * suspension / fermeture / réactivation selon les permissions.

* **Pages actions**

  * création ;
  * modification ;
  * consultation ;
  * catégories ;
  * filtres ;
  * recherche géographique ;
  * participation ;
  * capacité min/max ;
  * validation/rejet ;
  * annulation ;
  * complétion ;
  * affichage du cycle de statut.

* **Real-time Features**

  * WebSockets côté NestJS ;
  * connexion temps réel côté frontend ;
  * mise à jour instantanée des notifications ou autres événements ;
  * gestion reconnexion/déconnexion.

* **Notifications**

  * modèle/service si pas encore terminé ;
  * notification lors d’une demande d’ami ;
  * adhésion à une organisation ;
  * validation/rejet ;
  * participation ;
  * autres événements utiles ;
  * lu/non lu ;
  * affichage frontend ;
  * éventuellement push temps réel via WebSocket.

* **File Upload**

  * upload avatar ;
  * images d’actions ;
  * validation du type de fichier ;
  * validation de taille ;
  * stockage ;
  * suppression/remplacement ;
  * URLs exposées au frontend.

* **Advanced Search**

  * recherche utilisateur ;
  * organisation ;
  * action ;
  * texte partiel ;
  * catégories ;
  * statuts ;
  * dates ;
  * créateur ;
  * organisation ;
  * zone géographique ;
  * combinaison de plusieurs filtres ;
  * autocomplétion.

* **Système de points**

  * brancher les événements réels sur `PointsService` ;
  * attribution automatique ;
  * historique des transactions ;
  * empêcher les doubles récompenses ;
  * affichage frontend ;
  * éventuellement classement.

* **User Interaction**

  * demandes d’amis ;
  * accepter/refuser ;
  * blocage si prévu ;
  * participation aux actions ;
  * affichage des relations côté frontend ;

* **Messagerie privée entre amis**

  * permettre l’envoi de messages uniquement entre utilisateurs ayant une `Friendship ACTIVE` ;
  * empêcher l’envoi de messages si l’amitié est supprimée ou `BLOCKED` ;
  * modèle `Conversation` pour représenter une conversation entre deux amis ;
  * modèle `Message` avec conversation, expéditeur, contenu et date d’envoi ;
  * créer ou récupérer une conversation entre deux amis ;
  * envoyer un message ;
  * récupérer l’historique des messages d’une conversation ;
  * récupérer la liste de ses conversations ;
  * vérifier que seuls les participants peuvent accéder à une conversation ;
  * gestion du statut lu / non lu des messages ;
  * compteur de messages non lus ;
  * intégration WebSocket pour recevoir les nouveaux messages en temps réel ;
  * mise à jour du statut lu en temps réel si nécessaire ;
  * gestion du comportement lorsqu’un utilisateur bloque ou supprime un ami ;
  * frontend : liste des conversations ;
  * frontend : affichage d’une conversation ;
  * frontend : envoi et réception des messages ;
  * frontend : indicateur de nouveaux messages / messages non lus ;
  * tests des permissions d’accès aux conversations ;
  * tests du blocage et de la suppression d’une amitié ;
  * tests de l’envoi et de la réception des messages en temps réel.

* **Organization System**

  * gestion complète des membres ;
  * invitations/demandes ;
  * rôles ;
  * droits par rôle ;
  * transfert éventuel de propriété ;
  * comportement quand une organisation ferme ou est suspendue.

* **Standard User Management**

  * gestion du profil ;
  * désactivation ;
  * suspension admin ;
  * réactivation ;
  * modération ;
  * éventuellement administration des comptes.

* **Tests backend**

  * tests unitaires des services ;
  * tests controllers ;
  * tests e2e ;
  * tests des permissions ;
  * tests des transitions de statut ;
  * tests des erreurs Prisma ;
  * tests des cas limites.

* **Tests frontend**

  * formulaires ;
  * erreurs API ;
  * navigation ;
  * permissions visuelles ;
  * états de chargement ;
  * tests des parcours utilisateur principaux.

* **Sécurité**

  * validation stricte des DTO ;
  * protection des mots de passe ;
  * ne jamais exposer `password_hash` ;
  * contrôle d’accès ;
  * rate limiting si nécessaire ;
  * CORS ;
  * gestion des fichiers uploadés ;
  * validation des IDs/query params ;
  * gestion propre des erreurs.

* **Docker / déploiement**

  * vérifier que le projet démarre sur un poste neuf ;
  * Dockerfiles propres ;
  * docker-compose final ;
  * variables `.env` documentées ;
  * migrations appliquées automatiquement ou via procédure claire ;
  * volumes ;
  * réseau frontend/backend/PostgreSQL ;
  * build production.

* **Documentation**

  * README ;
  * procédure d’installation ;
  * `.env.example` ;
  * architecture du projet ;
  * endpoints API principaux ;
  * règles métier importantes ;
  * commandes Prisma ;
  * procédure de migrations ;
  * éventuellement Swagger/OpenAPI.

* **Polish frontend**

  * responsive ;
  * erreurs utilisateur propres ;
  * loading states ;
  * empty states ;
  * formulaires agréables ;
  * cohérence graphique ;
  * accessibilité minimale.

* **Validation finale du projet**

  * repartir d’un clone propre ;
  * recréer les `.env` ;
  * `docker compose up --build` ;
  * appliquer les migrations ;
  * créer un utilisateur ;
  * créer une organisation ;
  * créer une action ;
  * rejoindre une action ;
  * tester les rôles ;
  * tester les notifications ;
  * tester le temps réel ;
  * tester les uploads ;
  * vérifier que tous les modules annoncés sont réellement démontrables.

* **Modules supplémentaires si vous avez encore du temps**

  * export/import de données ;
  * fonctionnalités GDPR ;
  * compatibilité navigateurs supplémentaires ;
  * dashboard analytics avec graphiques.

* **En résumé après l’ORM**

  * l’ORM aura construit le socle de données et les règles métier ;
  * il restera surtout à **sécuriser avec l’auth**, **brancher le frontend**, **implémenter les modules fonctionnels restants**, **tester**, puis **stabiliser le déploiement**.
