// Utilitaires et constantes pour l'authentification
// Séparés pour éviter les problèmes de Fast Refresh

export const AUTH_STORAGE_KEYS = {
  USER: "gestocker_user",
  PROFILE: "gestocker_profile", 
  PERMISSIONS: "gestocker_permissions",
  REMEMBER: "gestocker_remember"
};

export const ROLE_NAMES = {
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN", 
  MANAGER: "MANAGER",
  STOCK_MANAGER: "STOCK_MANAGER",
  EMPLOYEE: "EMPLOYEE"
};

export const ROLE_GROUPS = {
  ADMIN: [ROLE_NAMES.ADMIN, ROLE_NAMES.SUPER_ADMIN],
  MANAGER: [ROLE_NAMES.ADMIN, ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.MANAGER],
  STOCK_MANAGER: [ROLE_NAMES.ADMIN, ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.MANAGER, ROLE_NAMES.STOCK_MANAGER],
  EMPLOYEE: [ROLE_NAMES.ADMIN, ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.MANAGER, ROLE_NAMES.STOCK_MANAGER, ROLE_NAMES.EMPLOYEE]
};

// Fonctions utilitaires pour la gestion de session
export const saveSessionToStorage = (userData, profileData, rememberMe = false) => {
  sessionStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData));
  sessionStorage.setItem(AUTH_STORAGE_KEYS.PROFILE, JSON.stringify(profileData));
  sessionStorage.setItem(AUTH_STORAGE_KEYS.PERMISSIONS, JSON.stringify([]));

  if (rememberMe) {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER, "true");
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER, "false");
  }
};

export const loadSessionFromStorage = () => {
  try {
    const userData = sessionStorage.getItem(AUTH_STORAGE_KEYS.USER);
    const profileData = sessionStorage.getItem(AUTH_STORAGE_KEYS.PROFILE);
    const permissionsData = sessionStorage.getItem(AUTH_STORAGE_KEYS.PERMISSIONS);

    if (userData && profileData) {
      return {
        user: JSON.parse(userData),
        profile: JSON.parse(profileData),
        permissions: JSON.parse(permissionsData) || []
      };
    }
  } catch (error) {
    console.error("Erreur lors du chargement de la session:", error);
    clearSessionStorage();
  }
  return null;
};

export const clearSessionStorage = () => {
  Object.values(AUTH_STORAGE_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
};
