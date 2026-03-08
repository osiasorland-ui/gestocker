import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuthHook.js";

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // IDs des rôles autorisés
  const ADMIN_ROLE_ID = "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3";
  const SUPER_USER_ROLE_ID = "a033e29c-94f6-4eb3-9243-a9424ec20357";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user || !profile) {
    // Rediriger vers la page de connexion
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur a le rôle Admin ou Super User
  const userRoleId = profile.id_role || profile.role_id;
  const isAdminOrSuperUser = 
    userRoleId === ADMIN_ROLE_ID || 
    userRoleId === SUPER_USER_ROLE_ID;

  if (!isAdminOrSuperUser) {
    // Rediriger vers le dashboard avec un message d'accès refusé
    return <Navigate to="/dashboard" state={{ 
      accessDenied: "Accès refusé : Vous n'avez pas les permissions nécessaires pour accéder à cette page." 
    }} replace />;
  }

  return children;
}

export default AdminRoute;
