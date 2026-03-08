import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth.jsx";
import { NotificationProvider } from "./contexts/NotificationProvider.jsx";
import NotificationContainer from "./components/ui/NotificationContainer.jsx";
import Authentification from "./pages/Authentification.jsx";
import DashboardWrapper from "./pages/dashboard/DashboardWrapper.jsx";
import Analyse from "./pages/rapports/Analyse.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Produits from "./pages/stock/Produits.jsx";
import Categories from "./pages/stock/Categories.jsx";
import Mouvements from "./pages/stock/Mouvements.jsx";
import Entrepots from "./pages/stock/Entrepots.jsx";
import StockWrapper from "./pages/stock/StockWrapper.jsx";
import Commandes from "./pages/ventes/Commandes.jsx";
import Factures from "./pages/ventes/Factures.jsx";
import Clients from "./pages/ventes/Clients.jsx";
import VentesWrapper from "./pages/ventes/VentesWrapper.jsx";
import Fournisseurs from "./pages/achats/Fournisseurs.jsx";
import CommandesAchat from "./pages/achats/CommandesAchat.jsx";
import Receptions from "./pages/achats/Receptions.jsx";
import AchatsWrapper from "./pages/achats/AchatsWrapper.jsx";
import Utilisateurs from "./pages/parametres/Utilisateurs.jsx";
import ParametresWrapper from "./pages/parametres/ParametresWrapper.jsx";
import Parametres from "./pages/parametres/Parametres.jsx";
import Rapports from "./pages/rapports/Rapports.jsx";
import CreateRapport from "./pages/rapports/CreateRapport.jsx";
import Livreurs from "./pages/livreurs/Livreurs.jsx";
import RapportsAnalyseWrapper from "./pages/rapports/RapportsAnalyseWrapper.jsx";
import LivreursWrapper from "./pages/livreurs/LivreursWrapper.jsx";
import RoleChangeNotification from "./components/RoleChangeNotification.jsx";
import AdminApprovalNotification from "./components/AdminApprovalNotification.jsx";

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <RoleChangeNotification />
          <AdminApprovalNotification />
          <NotificationContainer />
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
                <AdminRoute>
                  <ParametresWrapper>
                    <Utilisateurs />
                  </ParametresWrapper>
                </AdminRoute>
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
                <AdminRoute>
                  <ParametresWrapper>
                    <Utilisateurs />
                  </ParametresWrapper>
                </AdminRoute>
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
            <Route
              path="/rapports/create"
              element={
                <ProtectedRoute>
                  <RapportsAnalyseWrapper>
                    <CreateRapport />
                  </RapportsAnalyseWrapper>
                </ProtectedRoute>
              }
            />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
