- users -> 9
- profiles -> 8
- organizations -> 2
- memberships -> 10
- friendships -> 2
- friend_requests -> 1
- actions -> 5
- participations -> 9
- comments -> 3

## Utilisateurs et profils

| Compte | Situation initiale |
|---|---|
| Alice | Profil public ; créatrice d’actions |
| Bob | Profil visible uniquement par ses amis |
| Claire | Profil privé |
| Damien | Profil public |
| Emma | Profil public |
| Franck | Profil public |
| Grace | Compte administrateur |
| Hugo | Compte suspendu |
| Nouveau | Compte sans profil, pour tester la création d’un profil |

Alice et Bob sont amis. 
Alice a bloqué Emma.
Claire a envoyé une demande d’amitié à Alice, encore en attente.

## Organisations

| Organisation | Statut | Owner | Manager | Deux membres |
|---|---|---|---|---|
| Collectif Paris | Active | Alice | Bob | Claire et Damien |
| Entraide quartier | Suspendue | Damien | Emma | Bob et Claire |

Franck est banni du Collectif Paris.
Emma a une demande d’adhésion en attente dans cette organisation. 

## Actions et participations

| Action | État initial | Test principal |
|---|---|---|
| Jardiner ensemble | En attente, avec des places libres | S’inscrire et modifier une action |
| Nettoyage à valider | En attente, avec trois participants | Valider une action |
| Action complète | En attente, avec toutes ses places occupées | Refuser une inscription supplémentaire |
| Collecte terminée | Terminée, avec des participants | Vérifier qu’elle est consultable et qu’on ne peut plus s’y inscrire |
| Entraide locale | Liée à l’organisation suspendue | Vérifier les règles appliquées à ses actions |

## Users and profiles

| Account | Initial state |
|---|---|
| Alice | Public profile; action creator |
| Bob | Friends-only profile |
| Claire | Private profile |
| Damien | Public profile |
| Emma | Public profile |
| Franck | Public profile |
| Grace | Administrator account |
| Hugo | Suspended account |
| New User | Account without a profile, used to test profile creation |

Alice and Bob are friends.
Alice has blocked Emma.
Claire has sent Alice a friend request that is still pending.

## Organizations

| Organization | Status | Owner | Manager | Two members |
|---|---|---|---|---|
| Paris Collective | Active | Alice | Bob | Claire and Damien |
| Neighborhood Support | Suspended | Damien | Emma | Bob and Claire |

Franck is banned from Paris Collective.
Emma has a pending membership request for that organization.

## Actions and participation

| Action | Initial state | Main test |
|---|---|---|
| Gardening Together | Pending, with available places | Join and edit an action |
| Cleanup Awaiting Approval | Pending, with three participants | Approve an action |
| Full Action | Pending, with all places taken | Reject another participant |
| Completed Collection | Completed, with participants | Confirm it remains visible and cannot be joined |
| Local Support | Linked to the suspended organization | Check the rules applied to its actions |
