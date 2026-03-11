# Contraintes de Gestion des Utilisateurs et Entrepôts

## 🛡️ Contraintes Implémentées

### 1. Suppression des Gérants d'Entrepôt

**Règle :** Un utilisateur assigné comme gérant d'entrepôt ne peut pas être supprimé.

**Logique :**
- Vérification préalable si l'utilisateur est gérant d'entrepôt(s)
- Blocage de la suppression avec message explicite
- Liste des entrepôts concernés dans le message d'erreur

**Message d'erreur :**
```
Impossible de supprimer cet utilisateur car il est gérant de 2 entrepôt(s): Entrepôt A, Entrepôt B. Veuillez d'abord le désassigner de ses entrepôts.
```

**Fonctions concernées :**
- `checkUserIsWarehouseManager()` : Vérifie si un utilisateur est gérant
- `unassignUserFromWarehouses()` : Désassigne un utilisateur des entrepôts
- `handleDeleteUser()` : Gère la suppression avec validation

### 2. Unicité des Catégories dans les Entrepôts

**Règle :** Une même catégorie de produits ne peut pas exister deux fois dans le même entrepôt.

**Logique :**
- Vérification via la table `produits` (relation indirecte)
- Une catégorie est considérée comme présente dans un entrepôt si au moins un produit de cette catégorie y est stocké
- Validation avant l'assignation de produits à des catégories/entrepôts

**Fonction concernée :**
- `checkCategoryExistsInWarehouse()` : Vérifie si une catégorie existe déjà dans un entrepôt

## 📊 Structure des Données

### Relations :
- `utilisateurs` ← `entrepots.id_gerant` (Un-à-plusieurs)
- `categories` ← `produits.id_categorie` (Un-à-plusieurs)  
- `entrepots` ← `produits.id_entrepot` (Un-à-plusieurs)

### Contrainte de catégorie dans entrepôt :
La relation entre catégories et entrepôts est indirecte via les produits :
```
categories → produits → entrepots
```

## 🔧 Implémentation Technique

### Validation des gérants :
```javascript
// Vérification avant suppression
const { isManager, warehouses } = await checkUserIsWarehouseManager(userId);

if (isManager && warehouses.length > 0) {
  setError(`Impossible de supprimer cet utilisateur car il est gérant de ${warehouses.length} entrepôt(s)`);
  return;
}
```

### Validation des catégories :
```javascript
// Vérification si catégorie existe dans entrepôt
const { exists } = await checkCategoryExistsInWarehouse(warehouseId, categoryId);

if (exists) {
  setError('Cette catégorie existe déjà dans cet entrepôt');
  return;
}
```

## 🎯 Cas d'Usage

### Scénario 1 - Suppression d'un gérant :
1. Admin clique sur "Supprimer" pour un utilisateur gérant
2. Système vérifie les entrepôts assignés à cet utilisateur
3. Si des entrepôts sont trouvés → Blocage avec message
4. Si aucun entrepôt → Suppression autorisée

### Scénario 2 - Assignation de catégorie :
1. Utilisateur essaie d'assigner une catégorie à un entrepôt
2. Système vérifie si des produits de cette catégorie existent déjà dans cet entrepôt
3. Si oui → Blocage avec message d'erreur
4. Si non → Assignation autorisée

## 🔄 Workflow de Résolution

### Pour supprimer un gérant :
1. **Désassigner** l'utilisateur de tous ses entrepôts
2. **Assigner** un nouveau gérant à chaque entrepôt
3. **Supprimer** l'utilisateur

### Pour ajouter une catégorie :
1. **Vérifier** que la catégorie n'existe pas déjà dans l'entrepôt
2. **Créer** les produits avec la catégorie et l'entrepôt spécifiés
3. **Confirmer** l'assignation

## 📝 Notes Importantes

- **Intégrité référentielle** : Les contraintes protègent contre la corruption des données
- **Expérience utilisateur** : Messages clairs et actions suggérées
- **Performance** : Requêtes optimisées avec LIMIT 1 pour les vérifications
- **Sécurité** : Utilisation du client admin pour contourner les restrictions RLS

## 🚀 Évolutions Possibles

1. **Interface de désassignation** : Bouton pour désassigner rapidement un gérant de tous ses entrepôts
2. **Dashboard de gestion** : Vue d'ensemble des gérants et de leurs entrepôts
3. **Validation en temps réel** : Vérification lors de la saisie dans les formulaires
4. **Historique des changements** : Tracking des assignations/désassignations
