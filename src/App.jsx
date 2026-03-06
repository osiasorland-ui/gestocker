import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import Authentification from "./pages/Authentification";
import DashboardWrapper from "./pages/dashboard/DashboardWrapper.jsx";
import Analyse from "./pages/rapports/Analyse";
import ProtectedRoute from "./components/ProtectedRoute";
import Produits from "./pages/stock/Produits";
import Categories from "./pages/stock/Categories";
import Mouvements from "./pages/stock/Mouvements";
import Entrepots from "./pages/stock/Entrepots";
import StockWrapper from "./pages/stock/StockWrapper";
import Commandes from "./pages/ventes/Commandes";
import Factures from "./pages/ventes/Factures";
import Clients from "./pages/ventes/Clients";
import VentesWrapper from "./pages/ventes/VentesWrapper";
import Fournisseurs from "./pages/achats/Fournisseurs";
import CommandesAchat from "./pages/achats/CommandesAchat";
import Receptions from "./pages/achats/Receptions";
import AchatsWrapper from "./pages/achats/AchatsWrapper";
import Utilisateurs from "./pages/parametres/Utilisateurs";
import ParametresWrapper from "./pages/parametres/ParametresWrapper";
import Parametres from "./pages/parametres/Parametres";
import Rapports from "./pages/rapports/Rapports.jsx";
import Livreurs from "./pages/livreurs/Livreurs";
import RapportsAnalyseWrapper from "./pages/rapports/RapportsAnalyseWrapper";
import LivreursWrapper from "./pages/livreurs/LivreursWrapper";

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
            path="/rapports/analyse"
            element={
              <ProtectedRoute>
                <RapportsAnalyseWrapper>
                  <Analyse />
                </RapportsAnalyseWrapper>
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
          <Route
            path="/ventes/commandes"
            element={
              <ProtectedRoute>
                <VentesWrapper>
                  <Commandes />
                </VentesWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ventes/factures"
            element={
              <ProtectedRoute>
                <VentesWrapper>
                  <Factures />
                </VentesWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ventes/clients"
            element={
              <ProtectedRoute>
                <VentesWrapper>
                  <Clients />
                </VentesWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/achats/fournisseurs"
            element={
              <ProtectedRoute>
                <AchatsWrapper>
                  <Fournisseurs />
                </AchatsWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/achats/commandes"
            element={
              <ProtectedRoute>
                <AchatsWrapper>
                  <CommandesAchat />
                </AchatsWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/achats/receptions"
            element={
              <ProtectedRoute>
                <AchatsWrapper>
                  <Receptions />
                </AchatsWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parametres/utilisateurs"
            element={
              <ProtectedRoute>
                <ParametresWrapper>
                  <Utilisateurs />
                </ParametresWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <ParametresWrapper>
                  <Parametres />
                </ParametresWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/utilisateurs"
            element={
              <ProtectedRoute>
                <ParametresWrapper>
                  <Utilisateurs />
                </ParametresWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/livreurs"
            element={
              <ProtectedRoute>
                <LivreursWrapper>
                  <Livreurs />
                </LivreursWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rapports/rapports-généraux"
            element={
              <ProtectedRoute>
                <RapportsAnalyseWrapper>
                  <Rapports />
                </RapportsAnalyseWrapper>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
