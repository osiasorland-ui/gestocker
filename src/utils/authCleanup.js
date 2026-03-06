// Utilitaires de nettoyage pour les problèmes d'authentification

/**
 * Nettoie toutes les tentatives de migration échouées et les marqueurs de rate limit
 * Utile quand l'utilisateur rencontre des problèmes de rate limiting avec Supabase
 */
export const cleanupAuthIssues = () => {
  try {
    const keysToRemove = [];
    
    // Parcourir toutes les clés localStorage pour trouver celles liées à l'auth
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('migration_attempt_') ||
        key.includes('_failed') ||
        key.includes('supabase.auth.token')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Supprimer toutes les clés trouvées
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Nettoyé: ${key}`);
    });
    
    console.log(`Nettoyage terminé: ${keysToRemove.length} éléments supprimés`);
    return keysToRemove.length;
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    return 0;
  }
};

/**
 * Vérifie s'il y a des problèmes de rate limiting actifs
 */
export const hasAuthIssues = () => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('_failed') ||
        key.includes('rate_limit')
      )) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return false;
  }
};

/**
 * Réinitialise complètement l'état d'authentification local
 * À utiliser avec précaution - déconnectera l'utilisateur
 */
export const resetAuthState = () => {
  try {
    // Nettoyer les marqueurs de migration
    cleanupAuthIssues();
    
    // Nettoyer les données de session
    const sessionKeys = [
      'user_session',
      'auth_token',
      'user_profile',
      'user_permissions'
    ];
    
    sessionKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('État d\'authentification réinitialisé');
    return true;
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    return false;
  }
};

/**
 * Fonction utilitaire pour débogage - affiche l'état actuel de l'auth
 */
export const debugAuthState = () => {
  try {
    console.log('=== État d\'authentification ===');
    
    const authRelatedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('auth') ||
        key.includes('session') ||
        key.includes('user') ||
        key.includes('migration')
      )) {
        authRelatedKeys.push({
          key,
          value: localStorage.getItem(key)?.substring(0, 50) + '...',
          length: localStorage.getItem(key)?.length || 0
        });
      }
    }
    
    console.table(authRelatedKeys);
    console.log(`Total: ${authRelatedKeys.length} clés liées à l'auth`);
    
    return authRelatedKeys;
  } catch (error) {
    console.error('Erreur lors du débogage:', error);
    return [];
  }
};
