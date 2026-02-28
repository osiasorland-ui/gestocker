import { Navigate } from 'react-router-dom';

function AuthLayout({ children }) {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-base-200">
      {children}
    </div>
  );
}

export default AuthLayout;
