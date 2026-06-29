# Module Salaires — Dolibarr v23.0.3

## 1. Vue d'ensemble du menu

Le module "Salaires" est accessible via **Facturation | Paiement** (et non via GRH, contrairement aux congés et notes de frais) :

| Sous-menu | Rôle |
|---|---|
| Nouveau | Créer un nouveau salaire (fiche de paiement) |
| Liste | Tous les salaires enregistrés |
| Règlements | Vue dédiée aux règlements liés aux salaires |
| Statistiques | Vue agrégée |

## 2. Positionnement par rapport aux autres modules RH

Contrairement aux Congés et Notes de frais (workflows avec étapes de validation humaine : Brouillon → Validé → Approuvé → ...), le module Salaires est un **objet financier direct** :
- Pas de demande initiée par l'employé.
- Pas de validation/approbation par un tiers.
- La création de la fiche **peut inclure directement le paiement**, en une seule action.

Ce positionnement explique son rattachement au menu **Facturation | Paiement** plutôt qu'à GRH.

## 3. Formulaire "Nouveau salaire" — champs clés

**Identification**

| Champ | Rôle |
|---|---|
| Salarié | Employé concerné |
| Libellé | Nom de la fiche de salaire (ex: "Salaire Mai 2026") |
| Date de début / Date de fin | Période couverte par le salaire |
| Montant | Montant à verser |
| Commentaires | Texte libre |

**Paiement (intégré dans le même formulaire)**

| Champ | Rôle |
|---|---|
| Enregistrez également le paiement | Case cochée par défaut : si cochée, le règlement est créé en même temps que le salaire |
| Mode de règlement | Virement bancaire, chèque, espèces, etc. |
| Date paiement | Date effective du paiement |
| Date valeur | Date de valeur bancaire |
| Case "Classez automatiquement... payé" | Cochée par défaut : passe directement le statut à "Payée" |

## 4. Différence clé avec les Notes de frais — paiement réel vs classement administratif

| | Notes de frais | Salaires |
|---|---|---|
| Statut final | "Payé" | "Payée" |
| Impact sur "Déjà réglé" | Reste à 0,00 (aucun règlement réel créé) | Passe au montant total payé |
| Impact sur "Reste à payer" | Reste au montant TTC total | Passe à 0,00 |
| Ligne de règlement visible | Absente | Présente (Réf. paiement, date, type, montant) |

Le module Salaires crée donc un **véritable enregistrement de règlement financier**, contrairement au simple changement de statut observé sur les notes de frais.

## 5. Boutons d'action sur une fiche Salaire payée

- **ENVOYER EMAIL**
- **ROUVRIR** : permet de revenir en arrière sur le paiement (repasser en non payé)
- **CLONER** : dupliquer la fiche (utile pour les salaires récurrents mensuels)
- **SUPPRIMER** : désactivé une fois un règlement réel enregistré (cohérence comptable : il faut d'abord traiter/annuler le règlement)

## 6. Test pratique réalisé

- Création d'un salaire : Salarié SuperAdmin, Libellé "Salaire Mai 2026", période 01/05/2026 au 31/05/2026, Montant 1 500 000 MGA.
- Paiement enregistré simultanément : Mode de règlement "Virement bancaire", Date paiement 25/06/2026.
- Résultat : statut "Payée", règlement réel créé (Réf. paiement 1, 25/06/2026 13:00, Virement bancaire, 1 500 000,00), "Déjà réglé" = 1 500 000,00, "Reste à payer" = 0,00.

## 7. URLs API REST identifiées (à vérifier précisément via Swagger)

Base : `/api/index.php`

| Action | Méthode | Endpoint |
|---|---|---|
| Lister les salaires | GET | `/salaries` |
| Détail d'un salaire | GET | `/salaries/{id}` |
| Créer un salaire | POST | `/salaries` |
| Lister les règlements de salaire | GET | `/salaries/payments` (selon version) |
| Créer un règlement de salaire | POST | `/salaries/{id}/payments` (selon version) |
| Lister les utilisateurs | GET | `/users` |