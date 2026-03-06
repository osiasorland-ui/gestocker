import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { supabase } from "../../config/supabase";

// Import des composants UI
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Badge from "../../components/ui/Badge";
import Loader, { PageLoader, CardLoader } from "../../components/ui/Loader";

const Rapports = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [statistiques, setStatistiques] = useState({
    totalRapports: 0,
    rapportsCeMois: 0,
    rapportsTelecharges: 0,
    rapportsEnAttente: 0,
  });
  const [reportsData, setReportsData] = useState({
    ventes: 0,
    stock: 0,
    clients: 0,
    financier: 0,
  });
  const [recentReports, setRecentReports] = useState([]);

  const chargerDonnees = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("Utilisateur non connecté");
        return;
      }

      // Récupérer l'ID de l'entreprise
      const { data: userData, error: userError } = await supabase
        .from("utilisateurs")
        .select("id_entreprise")
        .eq("id_user", user.id)
        .single();

      if (userError || !userData) {
        console.error(
          "Erreur lors de la récupération de l'entreprise:",
          userError,
        );
        return;
      }

      const entId = userData.id_entreprise;
      setEntrepriseId(entId);

      // Calculer les dates selon la période
      const dates = getDatesPeriode(selectedPeriod);

      // Charger les données pour les statistiques
      const [commandesData, stocksData, clientsData, livraisonsData] =
        await Promise.all([
          supabase
            .from("commandes")
            .select("*, factures(montant_ttc)")
            .eq("id_entreprise", entId)
            .gte("date_commande", dates.debut)
            .lte("date_commande", dates.fin),

          supabase.from("stocks").select("*").eq("id_entreprise", entId),

          supabase.from("clients").select("*").eq("id_entreprise", entId),

          supabase
            .from("livraisons")
            .select("*")
            .eq("id_entreprise", entId)
            .gte("date_livraison", dates.debut)
            .lte("date_livraison", dates.fin),
        ]);

      // Calculer les statistiques
      const totalVentes = commandesData?.reduce(
        (sum, cmd) => sum + (cmd.factures?.montant_ttc || 0),
        0,
      );
      const totalStock = stocksData?.reduce(
        (sum, stock) => sum + stock.quantite_disponible,
        0,
      );
      const totalClients = clientsData?.length || 0;
      const totalLivraisons = livraisons?.length || 0;

      // Mettre à jour les données des rapports
      setReportsData({
        ventes: commandesData?.length || 0,
        stock: totalStock,
        clients: totalClients,
        financier: totalVentes,
      });

      // Simuler des rapports récents basés sur les données réelles
      const simulatedReports = [
        {
          id: 1,
          name:
            "Rapport des ventes - " + new Date().toLocaleDateString("fr-FR"),
          type: "Ventes",
          date: new Date().toLocaleDateString("fr-FR"),
          size: "2.3 MB",
          status: "completed",
        },
        {
          id: 2,
          name: "État du stock - " + new Date().toLocaleDateString("fr-FR"),
          type: "Stock",
          date: new Date().toLocaleDateString("fr-FR"),
          size: "1.8 MB",
          status: "completed",
        },
        {
          id: 3,
          name: "Analyse clients - " + new Date().toLocaleDateString("fr-FR"),
          type: "Clients",
          date: new Date(Date.now() - 86400000).toLocaleDateString("fr-FR"),
          size: "1.2 MB",
          status: "completed",
        },
      ];
      setRecentReports(simulatedReports);

      // Mettre à jour les statistiques
      setStatistiques({
        totalRapports: simulatedReports.length,
        rapportsCeMois: simulatedReports.length,
        rapportsTelecharges: Math.floor(simulatedReports.length * 0.7),
        rapportsEnAttente: 0,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  const getDatesPeriode = (periode) => {
    const maintenant = new Date();
    const debut = new Date();
    const fin = new Date();

    switch (periode) {
      case "week":
        debut.setDate(maintenant.getDate() - 7);
        break;
      case "month":
        debut.setMonth(maintenant.getMonth() - 1);
        break;
      case "quarter":
        debut.setMonth(maintenant.getMonth() - 3);
        break;
      case "year":
        debut.setFullYear(maintenant.getFullYear() - 1);
        break;
      default:
        debut.setMonth(maintenant.getMonth() - 1);
    }

    return {
      debut: debut.toISOString(),
      fin: fin.toISOString(),
    };
  };

  const generateReport = async (reportType) => {
    if (!entrepriseId) return;

    try {
      console.log(
        `Génération du rapport ${reportType} pour l'entreprise ${entrepriseId}`,
      );

      // Logique de génération selon le type
      switch (reportType) {
        case "ventes":
          await generateVentesReport();
          break;
        case "stock":
          await generateStockReport();
          break;
        case "clients":
          await generateClientsReport();
          break;
        case "financier":
          await generateFinancierReport();
          break;
      }

      // Recharger les données
      await chargerDonnees();
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
    }
  };

  const generateVentesReport = async () => {
    const dates = getDatesPeriode(selectedPeriod);
    const { data } = await supabase
      .from("commandes")
      .select("*, factures(montant_ttc), clients(nom, prenom)")
      .eq("id_entreprise", entrepriseId)
      .eq("type_commande", "VENTE")
      .gte("date_commande", dates.debut)
      .lte("date_commande", dates.fin);

    console.log("Rapport ventes généré avec", data?.length || 0, "commandes");
  };

  const generateStockReport = async () => {
    const { data } = await supabase
      .from("stocks")
      .select("*, produits(designation), entrepots(nom_entrepot)")
      .eq("id_entreprise", entrepriseId);

    console.log(
      "Rapport stock généré avec",
      data?.length || 0,
      "produits en stock",
    );
  };

  const generateClientsReport = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id_entreprise", entrepriseId);

    console.log("Rapport clients généré avec", data?.length || 0, "clients");
  };

  const generateFinancierReport = async () => {
    const dates = getDatesPeriode(selectedPeriod);
    const { data } = await supabase
      .from("factures")
      .select("*, commandes(date_commande)")
      .eq("id_entreprise", entrepriseId)
      .gte("date_facturation", dates.debut)
      .lte("date_facturation", dates.fin);

    console.log("Rapport financier généré avec", data?.length || 0, "factures");
  };

  const downloadReport = (report) => {
    console.log("Téléchargement du rapport:", report.name);
    // Logique de téléchargement
  };

  const exportAllReports = async () => {
    console.log("Exportation de tous les rapports...");
    // Logique d'export
  };

  const reportTypes = [
    {
      id: "ventes",
      title: "Rapport des Ventes",
      description: "Analyse des ventes par période",
      icon: TrendingUp,
      color: "blue",
    },
    {
      id: "stock",
      title: "Rapport de Stock",
      description: "État des stocks et mouvements",
      icon: Package,
      color: "green",
    },
    {
      id: "clients",
      title: "Rapport Clients",
      description: "Analyse de la clientèle",
      icon: Users,
      color: "purple",
    },
    {
      id: "financier",
      title: "Rapport Financier",
      description: "Bilan financier mensuel",
      icon: DollarSign,
      color: "yellow",
    },
  ];

  const periods = [
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "quarter", label: "Ce trimestre" },
    { value: "year", label: "Cette année" },
  ];

  if (loading) {
    return <PageLoader text="Chargement des rapports..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Rapports et Analyses
              </h1>
              <p className="mt-2 text-gray-600">
                Générez et consultez vos rapports d'activité
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                icon={Download}
                className="w-full sm:w-auto"
                onClick={exportAllReports}
              >
                Exporter tout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card hover>
            <CardContent className="flex items-center">
              <div className="shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total rapports
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistiques.totalRapports}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center">
              <div className="shrink-0">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ce mois</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistiques.rapportsCeMois}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center">
              <div className="shrink-0">
                <Download className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Téléchargés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistiques.rapportsTelecharges}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="flex items-center">
              <div className="shrink-0">
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistiques.rapportsEnAttente}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Rechercher un rapport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <Button variant="outline" icon={Filter}>
              Filtres
            </Button>
          </div>
        </div>

        {/* Report Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Types de rapports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.id}
                  hover
                  className="cursor-pointer"
                  onClick={() => generateReport(report.id)}
                >
                  <CardContent>
                    <div className="flex items-center mb-4">
                      <div className={`p-2 rounded-lg bg-${report.color}-100`}>
                        <Icon className={`h-6 w-6 text-${report.color}-600`} />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {report.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {reportsData[report.id]}{" "}
                        {report.id === "financier"
                          ? "FCFA"
                          : report.id === "stock"
                            ? "unités"
                            : "enregistrements"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Rapports récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom du rapport
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taille
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun rapport trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    recentReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">
                              {report.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default" className="text-xs">
                            {report.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.size}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              report.status === "completed"
                                ? "success"
                                : "warning"
                            }
                            className="text-xs"
                          >
                            {report.status === "completed"
                              ? "Terminé"
                              : "En cours"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Download}
                              onClick={() => downloadReport(report)}
                            />
                            <Button variant="ghost" size="sm" icon={FileText} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Charts Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des rapports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    Graphique d'évolution des rapports
                  </p>
                  <p className="text-sm text-gray-400">
                    {statistiques.totalRapports} rapports générés ce mois
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    Répartition des types de rapports
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Ventes: {reportsData.ventes} enregistrements</p>
                    <p>Stock: {reportsData.stock} unités</p>
                    <p>Clients: {reportsData.clients} clients</p>
                    <p>
                      Financier: {reportsData.financier.toLocaleString("fr-FR")}{" "}
                      FCFA
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Rapports;
