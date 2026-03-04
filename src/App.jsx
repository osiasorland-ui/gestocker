import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import Authentification from "./pages/Authentification";
import DashboardWrapper from "./pages/DashboardWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import TestOTP from "./pages/TestOTP";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Authentification />} />
          <Route path="/test-otp" element={<TestOTP />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
