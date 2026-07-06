# API REST — Dolibarr v23.0.3

## 1. Activation et authentification

### Activation du module

L'API REST n'est pas active par défaut. Activation via :
`Accueil → Configuration → Modules/Applications → API REST`

### Génération de la clé API (DOLAPIKEY)

- Chaque utilisateur dispose d'une clé API personnelle.
- Génération depuis la fiche utilisateur (onglet "Utilisateur" principal, bloc "Identifiants de connexion" → champ "Jeton pour API"), via le bouton MODIFIER.
- La valeur est masquée ("Caché") en lecture, visible uniquement en mode édition.
- Authentification simple par clé statique (pas de notion de token expirant, pas d'OAuth2 contrairement à GLPI).
- Header HTTP à envoyer sur chaque requête : `DOLAPIKEY: <valeur_de_la_clé>`

### Swagger Explorer

Documentation interactive disponible à : http://localhost/dolibarr/htdocs/api/index.php/explorer/

- Base URL des endpoints : `/api/index.php`
- API version : 1
- La clé API se saisit dans le champ en haut de la page puis bouton "Explore" pour activer les tests "Try it out".
- Organisation par tags = un tag par module (correspondance avec les modules de l'interface, à condition que le module soit activé).

### Point de vigilance

Les libellés affichés dans le Swagger peuvent contenir des erreurs de copier-coller dans le code source de Dolibarr (ex: un libellé "Update expense report" affiché sur une route `/holidays/{id}`). Toujours vérifier le comportement réel par un test, ne pas se fier uniquement au texte descriptif.

## 2. Endpoints — Produits (`products`)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/products` | Lister tous les produits |
| POST | `/products` | Créer un produit |
| GET | `/products/{id}` | Récupérer un produit par ID |
| PUT | `/products/{id}` | Mettre à jour un produit |
| DELETE | `/products/{id}` | Supprimer un produit |
| GET | `/products/{id}/stock` | Récupérer les données de stock d'un produit |
| GET | `/products/ref/{ref}` | Récupérer un produit par sa référence (ex: PROD-001) |
| GET | `/products/barcode/{barcode}` | Récupérer un produit par code-barres |

## 3. Endpoints — Entrepôts (`warehouses`)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/warehouses` | Lister tous les entrepôts |
| POST | `/warehouses` | Créer un entrepôt |
| GET | `/warehouses/{id}` | Récupérer un entrepôt par ID |
| PUT | `/warehouses/{id}` | Mettre à jour un entrepôt |
| DELETE | `/warehouses/{id}` | Supprimer un entrepôt |
| GET | `/warehouses/{id}/products` | Lister les produits présents dans un entrepôt |

## 4. Endpoints — Mouvements de stock (`stockmovements`)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/stockmovements` | Lister tous les mouvements de stock |
| POST | `/stockmovements` | Créer un mouvement de stock (équivalent API du bouton "CORRIGER LE STOCK") |
| GET | `/stockmovements/{id}` | Récupérer un mouvement par ID |

## 5. Endpoints — Congés (`holidays`)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/holidays` | Lister les congés |
| POST | `/holidays` | Créer une demande de congé |
| GET | `/holidays/{id}` | Récupérer une demande par ID |
| PUT | `/holidays/{id}` | Mettre à jour les champs généraux |
| DELETE | `/holidays/{id}` | Supprimer une demande |
| POST | `/holidays/{id}/validate` | Valider (Brouillon → En approbation) |
| POST | `/holidays/{id}/approve` | Approuver (En approbation → Approuvée) |
| POST | `/holidays/{id}/refuse` | Refuser |
| POST | `/holidays/{id}/cancel` | Annuler |
| POST | `/holidays/{id}/reopen` | Réouvrir une demande annulée |

Une route dédiée par transition de statut — cohérent avec le cycle de vie observé en pratique (Brouillon → En approbation → Approuvée/Refusée/Annulée).

## 6. Endpoints — Notes de frais (`expensereports`)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/expensereports` | Lister les notes de frais |
| POST | `/expensereports` | Créer une note de frais |
| GET | `/expensereports/{id}` | Récupérer une note par ID |
| PUT | `/expensereports/{id}` | Mettre à jour les champs généraux |
| DELETE | `/expensereports/{id}` | Supprimer une note |
| POST | `/expensereports/{id}/line` | Ajouter une ligne de dépense |
| GET | `/expensereports/{id}/lines` | Lister les lignes |
| PUT | `/expensereports/{id}/lines/{lineid}` | Modifier une ligne |
| DELETE | `/expensereports/{id}/lines/{lineid}` | Supprimer une ligne |
| POST | `/expensereports/{id}/validate` | Valider (Brouillon → Validé) |
| POST | `/expensereports/{id}/approve` | Approuver |
| POST | `/expensereports/{id}/deny` | Refuser *(nommé "deny", pas "refuse" — incohérence de nommage avec le module Congés)* |
| POST | `/expensereports/{id}/cancel` | Annuler |
| POST | `/expensereports/{id}/settodraft` | Repasser en brouillon |
| POST | `/expensereports/{id}/payments` | Créer un paiement |
| PUT | `/expensereports/{id}/payments` | Mettre à jour un paiement |
| GET | `/expensereports/payments` | Lister tous les paiements de notes de frais |
| GET | `/expensereports/payments/{pid}` | Récupérer un paiement par ID |

Remarque : contrairement à ce qui a été observé dans l'interface (le classement "Payé" ne créait aucun règlement réel visible), l'API expose bien une notion de paiement distincte (`/payments`) qui pourrait permettre d'enregistrer un règlement effectif.

## 7. Endpoints — Salaires (`salaries`)

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/salaries` | Lister les salaires |
| POST | `/salaries` | Créer un salaire |
| GET | `/salaries/{id}` | Récupérer un salaire par ID |
| PUT | `/salaries/{id}` | Mettre à jour |
| POST | `/salaries/{id}/payments` | Créer un paiement de salaire |
| PUT | `/salaries/{id}/payments` | Mettre à jour un paiement |
| GET | `/salaries/payments` | Lister tous les paiements de salaires |
| GET | `/salaries/payments/{pid}` | Récupérer un paiement par ID |

## 8. Endpoints — Utilisateurs (`users`)

Module transversal, référencé par tous les modules RH (Salarié, Demandeur, Approbateur).

| Méthode | Endpoint | Rôle |
|---|---|---|
| GET | `/users` | Lister les utilisateurs |
| POST | `/users` | Créer un utilisateur |
| GET | `/users/{id}` | Récupérer un utilisateur par ID |
| PUT | `/users/{id}` | Mettre à jour |
| DELETE | `/users/{id}` | Supprimer |
| GET | `/users/info` | Infos sur l'utilisateur courant (celui de la clé API utilisée) |
| GET | `/users/email/{email}` | Rechercher un utilisateur par email |
| GET | `/users/login/{login}` | Rechercher un utilisateur par login |
| GET | `/users/{id}/groups` | Groupes d'un utilisateur |

## 9. Tags Swagger disponibles hors périmètre du sujet

`agendaevents`, `contacts`, `documents`, `emailtemplates`, `objectlinks`, `thirdparties`, `productlots`, `setup`, `status`, `login`.

- `setup` : potentiellement utile plus tard pour lire des dictionnaires (taux de TVA, types de congés) si besoin.
- `login` : mécanisme d'authentification alternatif par session, non nécessaire car DOLAPIKEY est utilisé directement.

## 10. Test pratique réalisé

- Module API REST activé via Configuration → Modules/Applications.
- Clé API générée pour l'utilisateur SuperAdmin (champ "Jeton pour API").
- Accès au Swagger Explorer confirmé : `http://dolibarr.localhost/api/index.php/explorer/`
- Authentification testée : clé saisie dans le champ DOLAPIKEY du Swagger, bouton "Explore" → liste complète des tags affichée avec succès.
- Détail des endpoints vérifié pour : `products`, `warehouses`, `stockmovements`, `holidays`, `expensereports`, `salaries`, `users`.




