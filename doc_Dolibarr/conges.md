# Module GRH — Demande de congés — Dolibarr v23.0.3

## 1. Vue d'ensemble du menu

Le sous-module "Demande de congés" se trouve dans **GRH** et propose :

| Sous-menu | Rôle |
|---|---|
| Nouveau | Créer une demande de congé pour un seul utilisateur |
| Nouvelle demande de congé collectif | Créer la même demande pour plusieurs utilisateurs à la fois |
| Liste | Toutes les demandes, filtrables par statut : Brouillon / En approbation / Approuvée / Annulée / Refusée |
| Solde des congés | Vue des compteurs de jours disponibles par utilisateur et par type de congé |
| État mensuel | Vue récapitulative mois par mois des absences |
| Voir historique modif. | Journal d'audit des modifications faites sur les demandes |

## 2. Cycle de vie d'une demande de congé
- **Brouillon** : demande créée mais pas encore soumise. Référence provisoire au format `(PROVx)`.
- **En approbation** : soumise via le bouton VALIDER, en attente de décision. La référence provisoire est remplacée par une référence définitive (format `HLAAMM-NNNN`, ex: `HL2606-0001`).
- **Approuvée** : validée via le bouton APPROUVER. Date et auteur d'approbation enregistrés. Plus aucune modification possible (seulement Annuler/Supprimer).
- **Refusée** : rejetée par l'approbateur, aucun impact sur le solde.
- **Annulée** : annulée par le demandeur ou un admin, aucun impact sur le solde.

Chaque transition est tracée dans "Les 10 derniers événements" avec horodatage et auteur.

Important : "Demandé par" et "Sera/A été approuvé par" sont deux champs distincts et indépendants, même si la même personne occupe les deux rôles (pas d'auto-approbation automatique : l'approbation reste toujours une action manuelle explicite).

## 3. Formulaire "Créer demande de congés" — champs clés

| Champ | Rôle |
|---|---|
| Utilisateur | Personne qui demande le congé |
| Solde des congés (en jours) | Affiché en info à droite, dépend du type de congé sélectionné |
| Type | Catégorie de congé (voir section 5) |
| Date Début / Date Fin | Période demandée, avec sélecteur Matin/Après-midi pour les demi-journées |
| Sera approuvé par | Responsable désigné pour valider la demande |
| Description | Commentaire libre / motif |
| Nombre de jours | Calculé automatiquement à partir des dates et des demi-journées |

## 4. Solde des congés — fonctionnement en temps normal

- Le solde affiché sur le formulaire et sur la page "Solde des congés" est une **valeur calculée**, pas un champ saisissable directement depuis cette page.
- Seuls les types de congé marqués **"Gérer un compteur"** (dans Configuration → Dictionnaires → Type de congés) ont un solde suivi. Exemples observés : `LEAVE_PAID`, `LEAVE_RTT_FR`, `LEAVE_PAID_FR`. Les types sans compteur (ex: `LEAVE_SICK` — Congé maladie) n'ont pas de solde associé et ne sont jamais bloqués par un manque de jours.
- En fonctionnement normal, le solde des types avec compteur est alimenté par une **attribution automatique mensuelle** (mécanisme de type tâche planifiée), visible via le message "Dernière mise à jour automatique de l'attribution des congés : [date]". Le nombre de jours attribués par mois dépend du paramètre "Mois suivant" défini pour chaque type dans le dictionnaire (ex: 2,08334 jours/mois pour LEAVE_PAID_FR).
- Aucune correction manuelle directe du solde n'a été trouvée dans l'interface standard explorée (la page "Solde des congés" est en lecture seule).
- Conséquence pratique : une demande sur un type sans compteur peut être créée et approuvée même avec un solde théorique à 0, car aucune vérification de solde ne s'applique à ce type.

## 5. Types de congé (Dictionnaires)

Accessible via `Configuration → Dictionnaires → Type de congés`. Chaque type définit :
- Un code (ex: `LEAVE_SICK`, `LEAVE_PAID_FR`)
- Un libellé
- S'il "Gère un compteur" (1 = oui, vide = non)
- Un "Délai de prévenance" (en jours, avant la date de début)
- Un taux d'attribution mensuel ("Mois suivant")
- Un pays d'application éventuel (certains types sont spécifiques à un pays, ex: suffixe `_FR`)

## 6. État mensuel

- Vue calendaire/récapitulative regroupant les absences par mois.
- Permet de voir en un coup d'œil qui est absent, quand, et pour quel type de congé, sans avoir à ouvrir chaque demande individuellement.
- Utile pour une vision d'équipe/planning plutôt que pour le détail d'une demande précise.

## 7. Historique des modifications

- Accessible via "Voir historique modif." dans le menu du module.
- Journal d'audit qui trace les modifications apportées aux demandes de congés (changements de statut, de dates, etc.), indépendamment de la fiche individuelle de chaque demande.
- Complète la traçabilité déjà visible sur chaque demande (bloc "Les 10 derniers événements"), mais à l'échelle globale du module plutôt que demande par demande.

## 8. Prérequis technique rencontré : Société/Organisation

- Le module a affiché un blocage ("Définissez d'abord le pays Société/Organisation") sur l'écran Liste des congés.
- Cause réelle : le champ **Raison sociale** (obligatoire) était vide dans `Configuration → Société/Organisation`, malgré Pays et Devise déjà renseignés (Madagascar / Ariary).
- Correction : renseignement de la Raison sociale → déblocage de l'écran.
- Remarque : configuration administrative de base, non liée à une modification du code/structure de l'ExistingApp.

## 9. Test pratique réalisé

- Création d'une demande de congé : Utilisateur SuperAdmin, Type "Congé maladie", 1 jour (25/06/2026 Matin → Après-midi), approbateur SuperAdmin.
- Statut initial : Brouillon, référence provisoire `(PROV1)`.
- Validation (VALIDER) → statut "En approbation", référence définitive `HL2606-0001`.
- Approbation (APPROUVER) → statut "Approuvée", avec date d'approbation (25/06/2026 22:21) et approbateur enregistrés.
- Vérification : 3 événements tracés (création, validation, approbation) dans l'historique de la demande.
- Constat : le type "Congé maladie" n'ayant pas de compteur, le solde à 0 n'a jamais bloqué la création ni l'approbation.

## 10. URLs API REST identifiées (à vérifier précisément via Swagger)

Base : `/api/index.php`

| Action | Méthode | Endpoint |
|---|---|---|
| Lister les demandes de congés | GET | `/holiday` |
| Détail d'une demande de congé | GET | `/holiday/{id}` |
| Créer une demande de congé | POST | `/holiday` |
| Valider/Approuver une demande | POST/PUT | `/holiday/{id}/validate` ou `/holiday/{id}` (selon version) |
| Solde de congés d'un utilisateur | GET | `/holiday/users/{id}` ou paramètre dédié sur `/holiday` |
| Lister les utilisateurs | GET | `/users` |