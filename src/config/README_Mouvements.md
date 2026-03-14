# Documentation des Mouvements de Stock

## Architecture

Le système de mouvements de stock a été refactorisé pour utiliser des tables spécifiques pour chaque type de mouvement au lieu d'une table unique `mouvements_stock`.

## Tables Créées

### 1. `entrees_stock`
- **Purpose**: Enregistre les entrées de stock
- **Champs principaux**:
  - `id_entree`: Identifiant unique
  - `reference`: Référence automatique (ENT-YYYY-MM-DD-XXXX)
  - `date_entree`: Date de l'entrée
  - `quantite`: Quantité entrée
  - `prix_unitaire`: Prix unitaire (optionnel)
  - `prix_total`: Prix total calculé automatiquement
  - `motif`: Motif de l'entrée
  - `id_produit`: Référence au produit
  - `id_entrepot`: Référence à l'entrepôt
  - `id_fournisseur`: Référence au fournisseur (optionnel)
  - `id_user`: Utilisateur qui a effectué l'entrée
  - `id_entreprise`: Entreprise concernée

### 2. `sorties_stock`
- **Purpose**: Enregistre les sorties de stock
- **Champs principaux**:
  - `id_sortie`: Identifiant unique
  - `reference`: Référence automatique (SOR-YYYY-MM-DD-XXXX)
  - `date_sortie`: Date de la sortie
  - `quantite`: Quantité sortie
  - `prix_unitaire`: Prix unitaire (optionnel)
  - `prix_total`: Prix total calculé automatiquement
  - `motif`: Motif de la sortie
  - `id_produit`: Référence au produit
  - `id_entrepot`: Référence à l'entrepôt
  - `id_client`: Référence au client (optionnel)
  - `id_user`: Utilisateur qui a effectué la sortie
  - `id_entreprise`: Entreprise concernée

### 3. `ajustements_stock`
- **Purpose**: Enregistre les ajustements de stock
- **Champs principaux**:
  - `id_ajustement`: Identifiant unique
  - `reference`: Référence automatique (AJU-YYYY-MM-DD-XXXX)
  - `date_ajustement`: Date de l'ajustement
  - `type_ajustement`: Type (AUGMENTATION/DIMINUTION)
  - `quantite`: Quantité (positive ou négative)
  - `quantite_absolue`: Valeur absolue de la quantité
  - `motif`: Motif de l'ajustement
  - `id_produit`: Référence au produit
  - `id_entrepot`: Référence à l'entrepôt
  - `id_user`: Utilisateur qui a effectué l'ajustement
  - `id_entreprise`: Entreprise concernée

### 4. `transferts` (existante)
- **Purpose**: Enregistre les transferts entre entrepôts
- Utilise la table existante `transferts`

## Services

### Services Créés (`mouvementsServices.js`)

1. **entreesStock**: Gestion des entrées de stock
2. **sortiesStock**: Gestion des sorties de stock  
3. **ajustementsStock**: Gestion des ajustements de stock
4. **mouvementsUnifie**: Service unifié pour obtenir tous les mouvements

## Fonctionnalités Automatiques

### Génération de Références
- Chaque table génère automatiquement une référence unique
- Format: TYPE-YYYY-MM-DD-XXXX (où XXXX est un hash unique)

### Mise à Jour Automatique du Stock
Des triggers PostgreSQL mettent à jour automatiquement la table `stocks`:

- **Entrée**: Augmente le stock disponible
- **Sortie**: Vérifie la disponibilité et diminue le stock
- **Ajustement**: Augmente ou diminue selon le type
- **Transfert**: Diminue du stock source et augmente dans le stock destination

### Validation
- **Sorties**: Vérifie que le stock est suffisant avant d'autoriser la sortie
- **Ajustements**: Empêche les quantités négatives dans le stock final

## Utilisation dans le Composant

### Chargement des Données
```javascript
// Charge tous les mouvements et les sépare par type
const mouvementsData = await mouvementsUnifie.getAll(user.id_entreprise);
const allMovements = mouvementsData.data || [];
setEntrees(allMovements.filter(m => m.type_mvt === 'ENTREE'));
setSorties(allMovements.filter(m => m.type_mvt === 'SORTIE'));
setAjustements(allMovements.filter(m => m.type_mvt === 'AJUSTEMENT'));
setTransferts(allMovements.filter(m => m.type_mvt === 'TRANSFERT'));
```

### Sauvegarde
```javascript
switch (movementType) {
  case "ENTREE":
    result = await entreesStock.create(entreeData);
    break;
  case "SORTIE":
    result = await sortiesStock.create(sortieData);
    break;
  case "AJUSTEMENT":
    result = await ajustementsStock.create(ajustementData);
    break;
  case "TRANSFERT":
    result = await supabase.from('transferts').insert([transfertData]);
    break;
}
```

## Avantages

1. **Clarté**: Chaque type de mouvement a sa table dédiée
2. **Performance**: Requêtes plus optimisées avec des index spécifiques
3. **Maintenance**: Plus facile à maintenir et à faire évoluer
4. **Validation**: Validation spécifique selon le type de mouvement
5. **Historique**: Historique clair et détaillé par type

## Migration

La table `mouvements_stock` n'est plus utilisée. Les données existantes peuvent être migrées vers les nouvelles tables si nécessaire.

## Suppression de l'Ancien Système

- L'export `movements` a été supprimé de `supabase.js`
- Remplacé par les services spécifiques:
  - `mouvementsUnifie`
  - `entreesStock`
  - `sortiesStock`
  - `ajustementsStock`
