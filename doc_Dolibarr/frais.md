# Module GRH — Notes de frais — Dolibarr v23.0.3

## 1. Vue d'ensemble du menu

Le sous-module "Notes de frais" se trouve dans **GRH** et propose :

| Sous-menu | Rôle |
|---|---|
| Nouveau | Créer une nouvelle note de frais |
| Liste | Toutes les notes, filtrables par statut : Brouillon / Validé / Approuvé / Payé / Annulé / Refusé |
| Statistiques | Vue agrégée des notes de frais (montants, périodes, etc.) |

## 2. Cycle de vie d'une note de frais
- **Brouillon** : note créée mais pas encore soumise. Référence provisoire au format `(PROVx)`.
- **Validé** : soumise via le bouton VALIDER. Le statut affiché précise explicitement "Validé (en attente d'approbation)". La référence provisoire est remplacée par une référence définitive au format `ERAAMM-NNNN` (ex: `ER2606-0001`, ER = Expense Report). Une note ne peut être validée que si elle contient au moins une ligne de dépense.
- **Approuvé** : le responsable a accepté la dépense via le bouton APPROUVER. Date et auteur d'approbation enregistrés.
- **Payé** : la note est classée comme payée via le bouton CLASSER 'PAYÉE'.
- **Refusé** : la dépense est rejetée via REFUSER.
- **Annulé** : annulée à tout moment via ANNULER.

Chaque transition est tracée dans "Les derniers événements" avec horodatage et auteur (créée, validée, approuvée, payée).

### Point important : "Payé" ≠ règlement financier enregistré

Le bouton "CLASSER 'PAYÉE'" change uniquement le statut administratif de la note (équivalent à cocher "c'est fait"). Il ne crée **aucun enregistrement de règlement réel** : après ce classement, "Déjà réglé" reste à 0,00 et "Reste à payer" reste au montant TTC total — la section "Règlements" reste vide. L'enregistrement effectif d'un paiement (lien avec la trésorerie/banque) est un mécanisme distinct, non couvert par ce simple changement de statut. Le bouton inverse "CLASSER 'IMPAYÉ'" permet de revenir en arrière sur ce classement.

## 3. Comparaison avec le module Congés

| | Congés | Notes de frais |
|---|---|---|
| Représente | Une absence (temps) | Une dépense (argent) |
| Unité suivie | Jours | Montant (devise) |
| Vocabulaire statut intermédiaire | "En approbation" | "Validé (en attente d'approbation)" |
| Étape finale | Approuvée | Payé (classement administratif, pas un règlement réel) |
| Détail | Une seule période, un seul type | Plusieurs lignes de dépense possibles dans une seule note |
| Référence définitive | `HLAAMM-NNNN` | `ERAAMM-NNNN` |

## 4. Formulaire "Nouvelle note de frais" — champs clés

Ce formulaire crée seulement l'en-tête/enveloppe de la note ; les dépenses détaillées sont ajoutées ensuite ligne par ligne.

| Champ | Rôle |
|---|---|
| Utilisateur | Employé qui a engagé les frais |
| Date début / Date fin | Période couverte par la note |
| Sera approuvé par | Responsable désigné pour valider |
| Note (publique) | Commentaire visible par tous les intervenants (dont l'approbateur) |
| Note (privée) | Commentaire visible seulement par l'auteur/les admins |

## 5. Ajout d'une ligne de dépense — champs clés

| Champ | Rôle |
|---|---|
| Date | Date de la dépense |
| Type | Catégorie de frais (ex: Repas, Transport, Hôtel) |
| Description | Texte libre décrivant la dépense |
| TVA | Taux de TVA appliqué (dépend du dictionnaire des taux par pays) |
| P.U. HT | Prix unitaire hors taxe |
| P.U TTC | Calculé automatiquement à partir du P.U. HT et du taux de TVA |
| Qté | Quantité |

Chaque ligne ajoutée remonte automatiquement dans les totaux globaux de la note (Montant HT / Montant TVA / Montant TTC) et dans "Montant réclamé" / "Reste à payer".

## 6. Prérequis technique rencontré : taux de TVA par pays

- Blocage rencontré à l'ajout d'une ligne de dépense : "Erreur, aucun taux TVA défini pour le pays MG. Corrigez ceci ici."
- Cause : Dolibarr nécessite un taux de TVA défini dans le dictionnaire pour le pays configuré de la société (Madagascar), et aucun n'existait par défaut.
- Correction : ajout d'un taux de TVA via `Configuration → Dictionnaires → Taux de TVA ou de Taxes de Ventes` :
  - Pays : Madagascar (MG)
  - Type de TVA : Vente+Achat
  - Taux : 20
  - NPR : Non
  - Défaut : Oui (pour pré-sélection automatique)
- Remarque : configuration administrative de base (dictionnaire fiscal), non liée à une modification du code/structure de l'ExistingApp.

## 7. Test pratique réalisé

- Création d'une note de frais : Utilisateur SuperAdmin, période du 25/06/2026 au 25/06/2026, approbateur SuperAdmin.
- Statut initial : Brouillon, référence provisoire `(PROV1)`.
- Ajout d'une ligne de dépense : Type "Repas", description "Repas client - test", TVA 20%, P.U. HT 50,00 → P.U TTC 60,00 calculé automatiquement, Qté 1.
- Validation (VALIDER) → statut "Validé (en attente d'approbation)", référence définitive `ER2606-0001`, montants globaux mis à jour (HT 50,00 / TVA 10,00 / TTC 60,00).
- Avertissement rencontré à la validation : tentative d'envoi d'email échouée (profil utilisateur sans email valide) — sans impact, hors périmètre du sujet.
- Approbation (APPROUVER) → statut "Approuvé", avec date et auteur d'approbation enregistrés.
- Classement paiement (CLASSER 'PAYÉE') → statut "Payé". Constat : "Déjà réglé" reste 0,00 et "Reste à payer" reste 60,00, confirmant que ce classement est administratif et non un règlement financier réellement enregistré.
- Vérification : 4 événements tracés (créée, validée, approuvée, payée) dans l'historique de la note.

## 8. URLs API REST identifiées (à vérifier précisément via Swagger)

Base : `/api/index.php`

| Action | Méthode | Endpoint |
|---|---|---|
| Lister les notes de frais | GET | `/expensereports` |
| Détail d'une note de frais | GET | `/expensereports/{id}` |
| Créer une note de frais | POST | `/expensereports` |
| Ajouter une ligne de dépense | POST | `/expensereports/{id}/lines` |
| Valider une note de frais | POST/PUT | `/expensereports/{id}/validate` (selon version) |
| Approuver une note de frais | POST/PUT | `/expensereports/{id}/approve` (selon version) |
| Classer payée | POST/PUT | `/expensereports/{id}/settopaid` (selon version) |
| Lister les utilisateurs | GET | `/users` |
| Lister les taux de TVA (dictionnaire) | GET | `/setup/dictionary/vat` (selon version) |