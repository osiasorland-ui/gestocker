# Système de Sauvegarde Automatique et Gestion de Devise

Ce système permet de sauvegarder automatiquement les paramètres lorsqu'ils sont modifiés et de mettre à jour dynamiquement les devises dans toute l'application.

## Fonctionnalités

### 🔄 Sauvegarde Automatique
- **Déclenchement**: Lorsqu'un paramètre est modifié dans la page des paramètres
- **Condition**: Seulement si le type de sauvegarde est configuré sur "Auto"
- **Stockage**: Les sauvegardes sont enregistrées dans la table `sauvegardes`
- **Notification**: L'utilisateur est notifié lorsque la sauvegarde est effectuée

### 💱 Gestion de Devise
- **Configuration**: La devise par défaut peut être XOF, EUR ou USD
- **Mise à jour automatique**: Toutes les pages utilisant le hook `useDevise` se mettent à jour
- **Formatage**: Les montants sont automatiquement formatés selon la devise
- **Notifications**: L'utilisateur est informé lors du changement de devise

## Installation

### 1. Créer la table des sauvegardes
```sql
-- Exécuter le script SQL suivant:
src/database/create_table_sauvegardes.sql
```

### 2. Le système est déjà intégré dans l'application
- ✅ `NotificationProvider` ajouté dans `App.jsx`
- ✅ `NotificationContainer` ajouté pour afficher les notifications
- ✅ `backupService` intégré dans la page des paramètres
- ✅ Hook `useDevise` disponible pour tous les composants

## Utilisation

### Pour les développeurs - Afficher les montants avec la devise actuelle

```jsx
import React from 'react';
import { useDevise } from '../hooks/useDevise.js';

const MonComposant = () => {
  const { devise, formatMontant, getSymboleDevise, loading } = useDevise();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <p>Devise actuelle: {devise}</p>
      <p>Prix: {formatMontant(15000)}</p>
      <p>Total: {formatMontant(25000)}</p>
      <p>Symbole: {getSymboleDevise()}</p>
    </div>
  );
};
```

### Pour l'utilisateur - Changer la devise

1. Aller dans la page **Paramètres**
2. Dans la section **Paramètres système**
3. Changer la devise dans le menu déroulant **Devise**
4. **Automatiquement**:
   - ✅ La nouvelle devise est sauvegardée
   - ✅ Une sauvegarde automatique est effectuée (si activée)
   - ✅ Toutes les pages affichent les montants dans la nouvelle devise
   - ✅ Une notification confirme le changement

## Configuration

### Type de sauvegarde
Dans **Paramètres > Sauvegardes**:
- **Auto**: Sauvegarde automatique à chaque changement de paramètre
- **Séquentielle**: Sauvegarde manuelle uniquement

### Devise supportées
- **XOF**: Franc CFA de l'Afrique de l'Ouest (format: 15 000 XOF)
- **EUR**: Euro (format: 15,00 €)
- **USD**: Dollar américain (format: $15.00)

## Structure des fichiers

### Services
- `src/utils/backupService.js` - Service de sauvegarde automatique
- `src/hooks/useDevise.js` - Hook pour la gestion de devise

### Composants
- `src/contexts/NotificationContext.jsx` - Contexte des notifications
- `src/components/ui/NotificationContainer.jsx` - Affichage des notifications

### Base de données
- `src/database/create_table_sauvegardes.sql` - Script de création de table

## Exemples

Voir `src/components/examples/ExempleUtilisationDevise.jsx` pour un exemple complet d'utilisation.

## Notifications

Le système affiche automatiquement des notifications pour:
- ✅ Sauvegarde automatique réussie
- 💱 Changement de devise
- ❌ Erreurs éventuelles

## Dépannage

### La sauvegarde automatique ne fonctionne pas
1. Vérifier que le type de sauvegarde est sur "Auto" dans les paramètres
2. Vérifier que la table `sauvegardes` existe (exécuter le script SQL)
3. Consulter la console pour les erreurs

### Les devises ne se mettent pas à jour
1. Vérifier que le composant utilise le hook `useDevise`
2. Vérifier que `NotificationProvider` est bien dans `App.jsx`
3. Rafraîchir la page après le changement de devise

### Les montants s'affichent mal
1. Vérifier que `formatMontant()` est utilisé et non directement la valeur
2. Vérifier que la devise est correctement configurée dans les paramètres

## Sécurité

- ✅ Les sauvegardes sont isolées par entreprise
- ✅ Seuls les utilisateurs authentifiés peuvent modifier les paramètres
- ✅ Les données sont validées avant sauvegarde
- ✅ Les erreurs sont gérées et notifiées
