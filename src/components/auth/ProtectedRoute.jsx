import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuthHook.js";
import { AlertCircle } from "lucide-react";

const ProtectedRoute = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  requireAll = false, // Si true, nécessite toutes les permissions/rôles, sinon une seule suffit
  fallbackPath = "/auth",
}) => {
  const {
    user,
    loading,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAnyRole,
  } = useAuth();

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Utilisateur non authentifié
  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Vérification des permissions
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every((permission) => hasPermission(permission))
      : hasAnyPermission(requiredPermissions);

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette
              page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Vérification des rôles
  if (requiredRoles.length > 0) {
    const hasRequiredRoles = requireAll
      ? requiredRoles.every((role) => hasRole(role))
      : hasAnyRole(requiredRoles);

    if (!hasRequiredRoles) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Accès refusé
            </h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas le rôle requis pour accéder à cette page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Tout est bon, afficher le contenu
  return children;
};

// Composants utilitaires pour les routes protégées spécifiques
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requiredRoles={["ADMIN", "SUPER_ADMIN"]}
    requireAll={false}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const ManagerRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requiredRoles={["ADMIN", "SUPER_ADMIN", "MANAGER"]}
    requireAll={false}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const StockManagerRoute = ({ children, ...props }) => (
  <ProtectedRoute
    requiredRoles={["ADMIN", "SUPER_ADMIN", "MANAGER", "STOCK_MANAGER"]}
    requireAll={false}
    {...props}
  >
    {children}
  </ProtectedRoute>
);

export const PermissionRoute = ({ permission, children, ...props }) => (
  <ProtectedRoute requiredPermissions={[permission]} {...props}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
