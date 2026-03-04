import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Users,
  Truck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  BarChart3,
  PieChart,
  ArrowUpDown,
} from "lucide-react";
import { supabase } from "../config/supabase";

function Rapports() {
  const [entrepriseData, setEntrepriseData] = useState(null);
  const [rapports, setRapports] = useState({
    ventes: [],
    stocks: [],
    livraisons: [],
    livreurs: [],
  });
  const [filters, setFilters] = useState({
    dateDebut: "",
    dateFin: "",
    typeRapport: "tous",
  });

  const chargerEntreprise = async () => {
    try {
      // Récupérer la première entreprise disponible
      const { data: entreprise } = await supabase
        .from("entreprises")
        .select("*")
        .limit(1)
        .single();

      setEntrepriseData(entreprise);
    } catch (error) {
      console.error("Erreur lors du chargement de l'entreprise:", error);
    }
  };

  const chargerRapports = async () => {
    try {
      // Récupérer la première entreprise disponible
      const { data: entreprise } = await supabase
        .from("entreprises")
        .select("id_entreprise")
        .limit(1)
        .single();

      if (!entreprise) return;

      const entrepriseId = entreprise.id_entreprise;

      // Charger les rapports de ventes
      const { data: ventes } = await supabase
        .from("commandes")
        .select(
          `
          *,
          clients(nom, prenom),
          factures(num_facture, montant_ttc)
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .eq("type_commande", "VENTE")
        .order("date_commande", { ascending: false });

      // Charger les rapports de stocks
      const { data: stocks } = await supabase
        .from("stocks")
        .select(
          `
          *,
          produits(designation, sku),
          entrepots(nom_entrepot)
        `,
        )
        .eq("id_entreprise", entrepriseId);

      // Charger les livraisons
      const { data: livraisons } = await supabase
        .from("livraisons")
        .select(
          `
          *,
          livreurs(nom, prenom, telephone),
          clients(nom, prenom),
          commandes(reference)
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .order("date_livraison", { ascending: false });

      // Charger les livreurs
      const { data: livreurs } = await supabase
        .from("livreurs")
        .select("*")
        .eq("id_entreprise", entrepriseId)
        .eq("statut", "ACTIF");

      setRapports({
        ventes: ventes || [],
        stocks: stocks || [],
        livraisons: livraisons || [],
        livreurs: livreurs || [],
      });
    } catch (error) {
      console.error("Erreur lors du chargement des rapports:", error);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    const loadData = async () => {
      await chargerEntreprise();
      await chargerRapports();
    };
    loadData();
  }, []);

  const exporterRapport = (type) => {
    // Fonction pour exporter les données en CSV
    let csvContent = "";
    let filename = "";

    switch (type) {
      case "ventes":
        csvContent = "Date,Référence,Client,Montant TTC,Statut\n";
        rapports.ventes.forEach((vente) => {
          csvContent += `${vente.date_commande},${vente.reference},${vente.clients?.nom || ""} ${vente.clients?.prenom || ""},${vente.factures?.montant_ttc || 0},${vente.statut}\n`;
        });
        filename = "rapports_ventes.csv";
        break;
      case "stocks":
        csvContent =
          "Produit,SKU,Entrepôt,Quantité disponible,Seuil d'alerte\n";
        rapports.stocks.forEach((stock) => {
          csvContent += `${stock.produits?.designation || ""},${stock.produits?.sku || ""},${stock.entrepots?.nom_entrepot || ""},${stock.quantite_disponible},${stock.seuil_alerte}\n`;
        });
        filename = "rapports_stocks.csv";
        break;
      case "livraisons":
        csvContent = "Date,Référence commande,Livreur,Client,Statut\n";
        rapports.livraisons.forEach((livraison) => {
          csvContent += `${livraison.date_livraison},${livraison.commandes?.reference || ""},${livraison.livreurs?.nom || ""} ${livraison.livreurs?.prenom || ""},${livraison.clients?.nom || ""} ${livraison.clients?.prenom || ""},${livraison.statut}\n`;
        });
        filename = "rapports_livraisons.csv";
        break;
      case "livreurs":
        csvContent =
          "Nom,Prénom,Téléphone,Email,Véhicule,Immatriculation,Statut\n";
        rapports.livreurs.forEach((livreur) => {
          csvContent += `${livreur.nom},${livreur.prenom || ""},${livreur.telephone},${livreur.email || ""},${livreur.vehicule_type || ""},${livreur.immatriculation || ""},${livreur.statut}\n`;
        });
        filename = "liste_livreurs.csv";
        break;
    }

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rapports</h1>
              <p className="text-sm text-gray-500">
                {entrepriseData?.nom_commercial || "Entreprise"} -{" "}
                {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.dateDebut}
                onChange={(e) =>
                  setFilters({ ...filters, dateDebut: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.dateFin}
                onChange={(e) =>
                  setFilters({ ...filters, dateFin: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de rapport
              </label>
              <select
                value={filters.typeRapport}
                onChange={(e) =>
                  setFilters({ ...filters, typeRapport: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Tous</option>
                <option value="ventes">Ventes</option>
                <option value="stocks">Stocks</option>
                <option value="livraisons">Livraisons</option>
                <option value="livreurs">Livreurs</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={chargerRapports}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Ventes totales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapports.ventes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Produits en stock
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapports.stocks.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <Truck className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Livraisons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapports.livraisons.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Livreurs actifs
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rapports.livreurs.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableaux des rapports */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-8">
        {(filters.typeRapport === "tous" ||
          filters.typeRapport === "ventes") && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Rapports des ventes
              </h3>
              <button
                onClick={() => exporterRapport("ventes")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant TTC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rapports.ventes.slice(0, 10).map((vente) => (
                    <tr key={vente.id_commande}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(vente.date_commande).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vente.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vente.clients?.nom} {vente.clients?.prenom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vente.factures?.montant_ttc
                          ? `${vente.factures.montant_ttc.toLocaleString("fr-FR")} FCFA`
                          : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vente.statut === "VALIDE"
                              ? "bg-green-100 text-green-800"
                              : vente.statut === "ANNULE"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {vente.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(filters.typeRapport === "tous" ||
          filters.typeRapport === "stocks") && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Rapports des stocks
              </h3>
              <button
                onClick={() => exporterRapport("stocks")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alerte
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rapports.stocks.slice(0, 10).map((stock) => (
                    <tr key={stock.id_stock}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.produits?.designation}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.produits?.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.entrepots?.nom_entrepot}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={
                            stock.quantite_disponible <= stock.seuil_alerte
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {stock.quantite_disponible}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.seuil_alerte}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(filters.typeRapport === "tous" ||
          filters.typeRapport === "livraisons") && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Rapports des livraisons
              </h3>
              <button
                onClick={() => exporterRapport("livraisons")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Livreur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rapports.livraisons.slice(0, 10).map((livraison) => (
                    <tr key={livraison.id_livraison}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(livraison.date_livraison).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livraison.commandes?.reference}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livraison.livreurs?.nom} {livraison.livreurs?.prenom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livraison.clients?.nom} {livraison.clients?.prenom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            livraison.statut === "LIVRE"
                              ? "bg-green-100 text-green-800"
                              : livraison.statut === "EN_COURS"
                                ? "bg-blue-100 text-blue-800"
                                : livraison.statut === "ANNULE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {livraison.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(filters.typeRapport === "tous" ||
          filters.typeRapport === "livreurs") && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Liste des livreurs
              </h3>
              <button
                onClick={() => exporterRapport("livreurs")}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prénom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rapports.livreurs.map((livreur) => (
                    <tr key={livreur.id_livreur}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livreur.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livreur.prenom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livreur.telephone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {livreur.vehicule_type} ({livreur.immatriculation})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            livreur.statut === "ACTIF"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {livreur.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rapports;
