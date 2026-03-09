# Configuration du Système de Première Connexion

Ce document explique comment configurer et utiliser le nouveau système de première connexion qui force les nouveaux utilisateurs à changer leur mot de passe.

## 🎯 Objectif

Lors de la création d'un nouvel utilisateur :
- Le champ mot de passe est désactivé et affiche "Password123" par défaut
- L'utilisateur est marqué comme `first_time_login: true`
- Lors de la première connexion, l'utilisateur doit :
  1. S'authentifier avec son email et le mot de passe "Password123"
  2. Changer son mot de passe via un modal forcé
  3. Se reconnecter avec le nouveau mot de passe

## 📋 Étapes d'Installation

### 1. Appliquer la migration SQL

Exécutez le fichier de migration pour ajouter le champ `first_time_login` :

```sql
-- Exécuter le fichier : src/database/migrations/add_first_time_login.sql
```

Ou manuellement :

```sql
ALTER TABLE public.utilisateurs 
ADD COLUMN first_time_login BOOLEAN DEFAULT true;

CREATE INDEX idx_utilisateurs_first_time_login ON public.utilisateurs(first_time_login);

UPDATE public.utilisateurs 
SET first_time_login = false 
WHERE created_at < NOW() - INTERVAL '1 day';
```

### 2. Créer la fonction RPC

Exécutez le fichier de fonction pour la vérification des mots de passe :

```sql
-- Exécuter le fichier : src/database/functions/verify_user_password.sql
```

### 3. Redémarrer l'application

Assurez-vous que tous les composants sont bien importés et que l'application est redémarrée.

## 🔄 Flux Complet

### Pour l'administrateur (création d'utilisateur)

1. Allez dans `Paramètres > Utilisateurs`
2. Cliquez sur "Ajouter un utilisateur"
3. Remplissez les informations (nom, prénom, email, téléphone, rôle)
4. Le champ mot de passe est désactivé et affiche "Password123"
5. Cliquez sur "Enregistrer"

L'utilisateur est créé avec :
- `mot_de_passe: "Password123"`
- `first_time_login: true`

### Pour le nouvel utilisateur (première connexion)

1. Ouvrez la page de connexion
2. Entrez votre email et le mot de passe `Password123`
3. Cliquez sur "Se connecter"
4. Un modal s'ouvre automatiquement pour changer le mot de passe
5. Entrez le mot de passe actuel (`Password123`)
6. Choisissez un nouveau mot de passe (8+ caractères, 1 majuscule, des chiffres)
7. Confirmez le nouveau mot de passe
8. Cliquez sur "Changer le mot de passe"
9. Vous serez redirigé vers la page de connexion pour vous reconnecter

## 🧪 Tests

### Exécuter les tests automatisés

Dans la console du navigateur :

```javascript
// Importer et exécuter le test
import { runFirstLoginTest } from './src/tests/first-login-test.js';
await runFirstLoginTest();
```

Ou utilisez la fonction globale :

```javascript
// La fonction est disponible globalement après import
await testFirstLogin();
```

### Test manuel

1. **Créer un utilisateur de test**
   - Via l'interface : Paramètres > Utilisateurs > Ajouter
   - Email: `test@example.com`
   - Mot de passe sera automatiquement `Password123`

2. **Tester la première connexion**
   - Déconnectez-vous
   - Connectez-vous avec `test@example.com` / `Password123`
   - Vérifiez que le modal de changement de mot de passe s'ouvre

3. **Tester le changement de mot de passe**
   - Changez le mot de passe dans le modal
   - Vérifiez que vous êtes redirigé vers la page de connexion
   - Reconnectez-vous avec le nouveau mot de passe

## 🔧 Composants Modifiés

### Nouveaux fichiers
- `src/components/auth/ForcePasswordChangeModal.jsx` - Modal de changement forcé
- `src/database/migrations/add_first_time_login.sql` - Migration SQL
- `src/database/functions/verify_user_password.sql` - Fonction RPC
- `src/tests/first-login-test.js` - Tests automatisés

### Fichiers modifiés
- `src/pages/parametres/Utilisateurs.jsx` - Désactivation champ mot de passe
- `src/config/auth.js` - Ajout first_time_login dans les données utilisateur
- `src/components/auth/LoginForm.jsx` - Intégration du modal
- `src/hooks/useAuth.jsx` - Retour des données utilisateur complètes

## 🚨 Points d'Attention

### Sécurité
- Le mot de passe par défaut `Password123` est simple mais doit être changé immédiatement
- Le système force le changement dès la première connexion
- Les mots de passe sont stockés en clair (à améliorer avec du hashage)

### Base de données
- Le champ `first_time_login` est par défaut `true` pour les nouveaux utilisateurs
- Les utilisateurs existants sont marqués `false` pour éviter les perturbations
- Un index est créé pour optimiser les performances

### Expérience Utilisateur
- Le modal est clair et informatif
- Les validations de mot de passe sont cohérentes
- La redirection après changement est fluide

## 🐛 Dépannage

### Problème : Le modal ne s'ouvre pas
**Causes possibles :**
- Le champ `first_time_login` n'est pas correctement mis à jour
- La fonction RPC ne retourne pas le champ

**Solutions :**
- Vérifiez la migration SQL a été appliquée
- Vérifiez la fonction RPC est bien créée
- Regardez la console pour les erreurs

### Problème : Erreur lors du changement de mot de passe
**Causes possibles :**
- Mot de passe actuel incorrect
- Nouveau mot de passe ne respecte pas les règles
- Erreur de base de données

**Solutions :**
- Vérifiez que l'utilisateur entre bien `Password123`
- Vérifiez les règles de validation (8+ caractères, 1 majuscule, chiffres)
- Consultez les logs de la console

### Problème : Redirection incorrecte
**Causes possibles :**
- Le hook useAuth ne retourne pas les bonnes données
- Le composant LoginForm ne gère pas correctement le cas

**Solutions :**
- Vérifiez que `result.user.first_time_login` est bien accessible
- Ajoutez des logs de debug dans le composant LoginForm

## 📈 Améliorations Futures

1. **Hashage des mots de passe** : Utiliser bcrypt ou argon2
2. **Expiration des mots de passe** : Forcer le changement périodique
3. **Historique des mots de passe** : Éviter la réutilisation
4. **2FA/MFA** : Ajouter l'authentification multi-facteurs
5. **Logs de sécurité** : Traçabilité des connexions et changements

## 📞 Support

En cas de problème :
1. Consultez les logs de la console du navigateur
2. Exécutez les tests automatisés
3. Vérifiez l'état de la base de données
4. Contactez l'équipe de développement
