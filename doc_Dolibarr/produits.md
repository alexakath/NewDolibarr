# Module Produits / Entrepôts — Dolibarr v23.0.3

## 1. Vue d'ensemble

Le module "Produits" dans Dolibarr regroupe deux notions liées :
- **Produits** : ce qu'on vend ou achète (biens, services)
- **Entrepôts** : lieux physiques de stockage, avec des quantités par produit

Menu de gauche :
- **Produits** : Nouveau produit / Liste / Stocks
- **Entrepôts** : Nouvel entrepôt / Liste / Mouvements / Transfert de stock en masse / Stock à date
- **Inventaires** : comparaison stock théorique vs stock réel

## 2. Fiche Produit — champs clés

| Champ | Rôle |
|---|---|
| Réf. produit | Identifiant unique obligatoire |
| Libellé | Nom affiché du produit |
| État (Vente) / État (Achat) | Le produit peut-il être vendu / acheté |
| Entrepôt par défaut | Entrepôt utilisé par défaut pour le stock |
| Limite stock pour alerte | Seuil déclenchant une alerte de réapprovisionnement |
| Stock désiré optimal | Quantité cible à maintenir |
| Nature de produit | Matière première / Produit manufacturé |
| Prix de vente | Prix HT par défaut |

## 3. Fiche Entrepôt — champs clés

| Champ | Rôle |
|---|---|
| Réf. | Identifiant unique obligatoire |
| Nom court de l'emplacement | Nom affiché |
| Ajouter dans | Permet de créer un sous-entrepôt (hiérarchie) |
| État | Ouvert / Fermé — un entrepôt fermé n'est plus utilisable pour réceptionner du stock |

## 4. Lien Produit ↔ Entrepôt ↔ Stock

- Un produit peut avoir du stock dans plusieurs entrepôts.
- Chaque changement de quantité est enregistré comme un **mouvement de stock** (traçabilité).
- Le **stock physique** affiché sur la fiche produit = somme de tous les mouvements pour ce produit, par entrepôt.
- Le **stock virtuel** = stock physique + projection des commandes en cours (non livrées).
- Le **PMP (Prix Moyen Pondéré)** est recalculé automatiquement à chaque entrée de stock, à partir du prix d'achat unitaire saisi.

## 5. Correction de stock (entrée/sortie manuelle)

Formulaire accessible via le bouton **CORRIGER LE STOCK** sur la fiche produit.

| Champ | Description |
|---|---|
| Entrepôt | Entrepôt concerné par le mouvement |
| Nombre de pièces | Ajouter ou Retirer + quantité |
| Prix d'achat unitaire | Utilisé pour recalculer le PMP |
| Libellé du mouvement | Texte libre décrivant le mouvement |
| Code mouvement ou inventaire | Généré automatiquement (horodatage) |

Une entrée (Ajouter) apparaît en vert (+Qté) dans la liste des mouvements ; une sortie (Retirer) apparaît en rouge/négatif (-Qté).

## 6. Limite stock pour alerte

- Seuil défini librement sur la fiche produit, purement informatif (ne bloque aucune action).
- Quand le **stock physique** descend en dessous de ce seuil, une icône d'alerte (⚠️) apparaît dans la liste des produits et dans Produits > Stocks.
- Sert d'outil de gestion d'achat : repérer en un coup d'œil les produits à recommander avant rupture.

## 7. Stock à date

- Fonctionnalité de reconstitution historique : répond à "quel était/sera mon stock à telle date ?".
- Dolibarr ne stocke pas une photo quotidienne du stock : il recalcule en rejouant/annulant les mouvements de stock entre la date demandée et aujourd'hui.
- Formule : Stock à la date X = Stock actuel − (mouvements survenus entre X et aujourd'hui).
- Différence avec les autres notions de stock :

| Notion | Répond à la question | Basé sur |
|---|---|---|
| Stock physique | Combien j'ai réellement maintenant ? | Mouvements déjà enregistrés jusqu'à maintenant |
| Stock virtuel | Combien j'aurai bientôt si les commandes en cours se concrétisent ? | Stock physique + commandes non livrées |
| Stock à date | Combien avais-je/aurai-je à une date précise ? | Reconstruction historique (passé) ou projection (futur) |

## 8. Test pratique réalisé

- Création entrepôt `ENT-001` (Entrepôt Principal)
- Création produit `PROD-001` (Chaise de bureau ergonomique), entrepôt par défaut = ENT-001
- Correction de stock : +20 pièces, prix unitaire 100 → Stock physique = 20, PMP = 100, Valorisation = 2000
- Vérification dans Entrepôts > Mouvements : mouvement tracé avec Réf., date, code, libellé, quantité +20
- Test sortie de stock : -5 pièces (vérifié, fonctionnement symétrique, stock physique = 15)
- Test "Stock à date" sur une date antérieure aux mouvements : résultat 0, confirmant le mécanisme de reconstruction historique

## 9. URLs API REST identifiées (à vérifier précisément via Swagger)

Base : `/api/index.php`

| Action | Méthode | Endpoint |
|---|---|---|
| Lister les produits | GET | `/products` |
| Détail d'un produit | GET | `/products/{id}` |
| Créer un produit | POST | `/products` |
| Lister les entrepôts | GET | `/warehouses` |
| Détail d'un entrepôt | GET | `/warehouses/{id}` |
| Créer un entrepôt | POST | `/warehouses` |
| Mouvements de stock | GET | `/stockmovements` |
| Corriger/ajouter du stock | POST | `/products/{id}/stock` ou `/stockmovements` |