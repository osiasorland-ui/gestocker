import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

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

  const recentReports = [];

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
              <Button icon={Download} className="w-full sm:w-auto">
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
                <p className="text-2xl font-bold text-gray-900">0</p>
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
                <p className="text-2xl font-bold text-gray-900">0</p>
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
                <p className="text-2xl font-bold text-gray-900">0</p>
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
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
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
          </CardContent>
        </Card>

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
                  onClick={() => console.log("Report selected:", report.id)}
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
                        Pas de données
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
                <thead className="bg-gray-50">
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
                  {recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {report.name}
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
                          <Button variant="ghost" size="sm" icon={Download} />
                          <Button variant="ghost" size="sm" icon={FileText} />
                        </div>
                      </td>
                    </tr>
                  ))}
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
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Graphique d'évolution</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Répartition par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Graphique de répartition</p>
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
