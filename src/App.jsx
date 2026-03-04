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
import Layout from "./components/Layout";
import Produits from "./pages/stock/Produits";
import Categories from "./pages/stock/Categories";
import Mouvements from "./pages/stock/Mouvements";
import Entrepots from "./pages/stock/Entrepots";
import StockWrapper from "./pages/stock/StockWrapper";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Authentification />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/produits"
            element={
              <ProtectedRoute>
                <StockWrapper>
                  <Produits />
                </StockWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/categories"
            element={
              <ProtectedRoute>
                <StockWrapper>
                  <Categories />
                </StockWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/mouvements"
            element={
              <ProtectedRoute>
                <StockWrapper>
                  <Mouvements />
                </StockWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock/entrepots"
            element={
              <ProtectedRoute>
                <StockWrapper>
                  <Entrepots />
                </StockWrapper>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
