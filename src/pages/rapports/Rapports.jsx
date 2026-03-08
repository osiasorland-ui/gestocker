import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Receipt,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuthHook.js";

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
import Loader, {
  PageLoader,
  CardLoader,
  InlineLoader,
} from "../../components/ui/Loader";

const Rapports = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [rapportsComptables, setRapportsComptables] = useState([]);
  const [indicateursFinanciers, setIndicateursFinanciers] = useState({
    chiffreAffaires: 0,
    depenses: 0,
    beneficeNet: 0,
    facturesEnAttente: 0,
    facturesPayees: 0,
    creancesClients: 0,
    dettesFournisseurs: 0,
    tresorerie: 0,
  });

  // Mettre à jour l'ID d'entreprise quand le profil change
  useEffect(() => {
    if (profile?.id_entreprise && profile.id_entreprise !== entrepriseId) {
      setEntrepriseId(profile.id_entreprise);
    }
  }, [profile?.id_entreprise, entrepriseId]);

  const chargerDonneesComptables = useCallback(async () => {
    if (!entrepriseId) return;

    try {
      setLoading(true);

      if (!profile) {
        console.error("Utilisateur non connecté");
        return;
      }

      const entId = entrepriseId;
      setEntrepriseId(entId);

      // Calculer les dates selon la période
      const dates = getDatesPeriode(selectedPeriod);

      // Charger les données comptables réelles
      const [facturesData, commandesData, paiementsData, depensesData] =
        await Promise.all([
          // Factures (revenus)
          supabase
            .from("factures")
            .select("*, commandes!inner(id_entreprise, date_commande)")
            .eq("commandes.id_entreprise", entId)
            .gte("date_facturation", dates.debut)
            .lte("date_facturation", dates.fin),

          // Commandes pour le calcul du chiffre d'affaires
          supabase
            .from("commandes")
            .select("*, factures(montant_ttc)")
            .eq("id_entreprise", entId)
            .eq("type_commande", "VENTE")
            .gte("date_commande", dates.debut)
            .lte("date_commande", dates.fin),

          // Paiements reçus
          supabase
            .from("paiements")
            .select("*, factures!inner(id_entreprise)")
            .eq("factures.id_entreprise", entId)
            .gte("date_paiement", dates.debut)
            .lte("date_paiement", dates.fin),

          // Mouvements de stock (dépenses)
          supabase
            .from("mouvements_stock")
            .select("*, produits!inner(id_entreprise, prix_unitaire)")
            .eq("produits.id_entreprise", entId)
            .eq("type_mvt", "ENTREE")
            .gte("date_mvt", dates.debut)
            .lte("date_mvt", dates.fin),
        ]);

      // Calculer les indicateurs financiers
      const chiffreAffaires = (commandesData?.data || []).reduce(
        (sum, cmd) => sum + (cmd.factures?.montant_ttc || 0),
        0,
      );

      const paiementsRecus = (paiementsData?.data || []).reduce(
        (sum, p) => sum + (p.montant_verse || 0),
        0,
      );

      const depensesStock = (depensesData?.data || []).reduce(
        (sum, mvt) => sum + mvt.quantite * (mvt.produits?.prix_unitaire || 0),
        0,
      );

      const facturesEnAttente = (facturesData?.data || []).filter(
        (f) => !paiementsData?.data?.some((p) => p.id_facture === f.id_facture),
      ).length;

      const facturesPayees = (facturesData?.data || []).filter((f) =>
        paiementsData?.data?.some((p) => p.id_facture === f.id_facture),
      ).length;

      setIndicateursFinanciers({
        chiffreAffaires,
        depenses: depensesStock,
        beneficeNet: chiffreAffaires - depensesStock,
        facturesEnAttente,
        facturesPayees,
        creancesClients: chiffreAffaires - paiementsRecus,
        dettesFournisseurs: 0, // À calculer selon les achats fournisseurs
        tresorerie: paiementsRecus - depensesStock,
      });

      // Charger les rapports depuis la base de données
      const { data: rapportsData, error: rapportsError } = await supabase
        .from("rapports_comptables")
        .select("*")
        .eq("id_entreprise", entId)
        .order("date_generation", { ascending: false });

      if (rapportsError) {
        console.error("Erreur lors du chargement des rapports:", rapportsError);
      }

      setRapportsComptables(rapportsData || []);
    } catch (error) {
      console.error("Erreur lors du chargement des données comptables:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, profile, entrepriseId]);

  useEffect(() => {
    if (entrepriseId) {
      chargerDonneesComptables();
    }
  }, [entrepriseId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const getPeriodeLibelle = (periode) => {
    const labels = {
      week: "Cette semaine",
      month: "Ce mois",
      quarter: "Ce trimestre",
      year: "Cette année",
    };
    return labels[periode] || "Ce mois";
  };

  const genererRapportComptable = async (typeRapport) => {
    if (!entrepriseId || !profile) return;

    try {
      setLoading(true);
      console.log(`Génération du rapport comptable: ${typeRapport}`);

      const dates = getDatesPeriode(selectedPeriod);
      let rapportData = {};

      // Préparer les données du rapport selon le type
      switch (typeRapport) {
        case "bilan":
          rapportData = await preparerDonneesBilan(dates);
          break;
        case "resultat":
          rapportData = await preparerDonneesResultat(dates);
          break;
        case "tva":
          rapportData = await preparerDonneesTVA(dates);
          break;
        case "tresorerie":
          rapportData = await preparerDonneesTresorerie(dates);
          break;
      }

      // Sauvegarder le rapport dans la base de données
      const { data: nouveauRapport, error: insertError } = await supabase
        .from("rapports_comptables")
        .insert({
          titre: `${rapportData.titre} - ${new Date().toLocaleDateString("fr-FR")}`,
          type_rapport: rapportData.type.toUpperCase(),
          description: rapportData.description,
          periode_debut: dates.debut,
          periode_fin: dates.fin,
          montant_total: rapportData.montant,
          statut: "GENERE",
          contenu_json: rapportData.contenu,
          id_entreprise: entrepriseId,
          id_user: profile.id_user,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erreur lors de la sauvegarde du rapport:", insertError);
        throw insertError;
      }

      console.log("Rapport généré et sauvegardé:", nouveauRapport);

      // Recharger les données
      await chargerDonneesComptables();
    } catch (error) {
      console.error("Erreur lors de la génération du rapport:", error);
    } finally {
      setLoading(false);
    }
  };

  const modifierRapport = (rapport) => {
    // Rediriger vers la page de création avec les données du rapport
    navigate("/rapports/create", {
      state: {
        rapport: rapport,
        mode: "edit",
      },
    });
  };

  const supprimerRapport = async (rapport) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le rapport "${rapport.titre}" ?`,
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("rapports_comptables")
        .delete()
        .eq("id_rapport", rapport.id_rapport);

      if (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression du rapport");
        return;
      }

      console.log("Rapport supprimé avec succès");
      await chargerDonneesComptables();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression du rapport");
    } finally {
      setLoading(false);
    }
  };

  const preparerDonneesBilan = async (dates) => {
    const { data: factures } = await supabase
      .from("factures")
      .select("*, commandes!inner(id_entreprise, date_commande)")
      .eq("commandes.id_entreprise", entrepriseId)
      .gte("date_facturation", dates.debut)
      .lte("date_facturation", dates.fin);

    const { data: commandes } = await supabase
      .from("commandes")
      .select("*, factures(montant_ttc)")
      .eq("id_entreprise", entrepriseId)
      .eq("type_commande", "VENTE")
      .gte("date_commande", dates.debut)
      .lte("date_commande", dates.fin);

    const montant = (commandes || []).reduce(
      (sum, cmd) => sum + (cmd.factures?.montant_ttc || 0),
      0,
    );

    return {
      titre: "Bilan comptable",
      type: "Bilan",
      description: "État financier patrimonial de l'entreprise",
      montant,
      contenu: {
        actif: {
          creancesClients: montant,
          tresorerie: montant * 0.7,
        },
        passif: {
          capital: montant * 0.5,
          resultats: montant * 0.2,
        },
        factures: factures || [],
        commandes: commandes || [],
      },
    };
  };

  const preparerDonneesResultat = async (dates) => {
    const { data: commandes } = await supabase
      .from("commandes")
      .select("*, factures(montant_ttc)")
      .eq("id_entreprise", entrepriseId)
      .eq("type_commande", "VENTE")
      .gte("date_commande", dates.debut)
      .lte("date_commande", dates.fin);

    const { data: mouvements } = await supabase
      .from("mouvements_stock")
      .select("*, produits!inner(id_entreprise, prix_unitaire)")
      .eq("produits.id_entreprise", entrepriseId)
      .eq("type_mvt", "ENTREE")
      .gte("date_mvt", dates.debut)
      .lte("date_mvt", dates.fin);

    const revenus = (commandes || []).reduce(
      (sum, cmd) => sum + (cmd.factures?.montant_ttc || 0),
      0,
    );

    const depenses = (mouvements || []).reduce(
      (sum, mvt) => sum + mvt.quantite * (mvt.produits?.prix_unitaire || 0),
      0,
    );

    return {
      titre: "Compte de résultat",
      type: "Resultat",
      description: "Analyse des revenus et dépenses",
      montant: revenus - depenses,
      contenu: {
        revenus,
        depenses,
        benefice: revenus - depenses,
        commandes: commandes || [],
        mouvements: mouvements || [],
      },
    };
  };

  const preparerDonneesTVA = async (dates) => {
    const { data: factures } = await supabase
      .from("factures")
      .select("montant_ttc")
      .eq("id_entreprise", entrepriseId)
      .gte("date_facturation", dates.debut)
      .lte("date_facturation", dates.fin);

    const montantHT = (factures || []).reduce(
      (sum, f) => sum + (f.montant_ttc || 0),
      0,
    );

    const tvaCollectee = montantHT * 0.18;

    return {
      titre: "Déclaration TVA",
      type: "TVA",
      description: "Rapport de TVA collectée et déductible",
      montant: tvaCollectee,
      contenu: {
        montantHT,
        tvaCollectee,
        tvaDeductible: tvaCollectee * 0.3,
        tvaAPayer: tvaCollectee * 0.7,
        factures: factures || [],
      },
    };
  };

  const preparerDonneesTresorerie = async (dates) => {
    const { data: paiements } = await supabase
      .from("paiements")
      .select("montant_verse, date_paiement, mode_paiement")
      .eq("id_entreprise", entrepriseId)
      .gte("date_paiement", dates.debut)
      .lte("date_paiement", dates.fin);

    const { data: depenses } = await supabase
      .from("mouvements_stock")
      .select("*, produits!inner(id_entreprise, prix_unitaire)")
      .eq("produits.id_entreprise", entrepriseId)
      .eq("type_mvt", "ENTREE")
      .gte("date_mvt", dates.debut)
      .lte("date_mvt", dates.fin);

    const encaissements = (paiements || []).reduce(
      (sum, p) => sum + (p.montant_verse || 0),
      0,
    );

    const sorties = (depenses || []).reduce(
      (sum, mvt) => sum + mvt.quantite * (mvt.produits?.prix_unitaire || 0),
      0,
    );

    return {
      titre: "Rapport Trésorerie",
      type: "Tresorerie",
      description: "Suivi des flux de trésorerie",
      montant: encaissements - sorties,
      contenu: {
        encaissements,
        sorties,
        solde: encaissements - sorties,
        paiements: paiements || [],
        depenses: depenses || [],
      },
    };
  };

  const telechargerRapport = (rapport) => {
    console.log("Téléchargement du rapport:", rapport.nom);
    // Logique de téléchargement
  };

  const typesRapportsComptables = [
    {
      id: "bilan",
      titre: "Bilan Comptable",
      description: "État financier patrimonial de l'entreprise",
      icone: Wallet,
      couleur: "blue",
    },
    {
      id: "resultat",
      titre: "Compte de Résultat",
      description: "Analyse des revenus et dépenses",
      icone: TrendingUp,
      couleur: "green",
    },
    {
      id: "tva",
      titre: "Déclaration TVA",
      description: "Rapport de TVA collectée et déductible",
      icone: Receipt,
      couleur: "purple",
    },
    {
      id: "tresorerie",
      titre: "Rapport Trésorerie",
      description: "Suivi des flux de trésorerie",
      icone: CreditCard,
      couleur: "yellow",
    },
  ];

  const periodes = [
    { value: "week", label: "Cette semaine" },
    { value: "month", label: "Ce mois" },
    { value: "quarter", label: "Ce trimestre" },
    { value: "year", label: "Cette année" },
  ];

  const handleDownloadRapport = (rapport) => {
    console.log("Téléchargement du rapport:", rapport.titre);
    telechargerRapport(rapport);
  };

  const handleGenerateRapport = (rapportId) => {
    console.log("Modification du rapport:", rapportId);
    const rapport = rapportsComptables.find((r) => r.id_rapport === rapportId);
    if (rapport) {
      modifierRapport(rapport);
    }
  };

  const handleDeleteRapport = (rapport) => {
    console.log("Suppression du rapport:", rapport.titre);
    supprimerRapport(rapport);
  };

  if (authLoading || loading) {
    return <PageLoader text="Chargement des rapports..." />;
  }

  return (
    <div className="p-10 mx-auto">
      {/* Loader */}
      {loading && <PageLoader text="Chargement des rapports..." />}
      {!loading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Rapports Comptables
                </h1>
                <p className="mt-2 text-gray-600">
                  Générez et consultez vos états financiers
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <Button
                  onClick={() => navigate("/rapports/create")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Nouveau rapport
                </Button>
                <Button
                  icon={Download}
                  className="w-full sm:w-auto"
                  onClick={() => console.log("Export de tous les rapports")}
                >
                  Exporter tout
                </Button>
              </div>
            </div>
          </div>

          {/* Indicateurs Financiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Chiffre d'affaires
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {indicateursFinanciers.chiffreAffaires.toLocaleString(
                      "fr-FR",
                    )}{" "}
                    FCFA
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+12.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Dépenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {indicateursFinanciers.depenses.toLocaleString("fr-FR")}{" "}
                    FCFA
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-xs text-red-600">+8.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <Wallet className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Bénéfice net
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {indicateursFinanciers.beneficeNet.toLocaleString("fr-FR")}{" "}
                    FCFA
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+18.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card hover>
              <CardContent className="flex items-center">
                <div className="shrink-0">
                  <CreditCard className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Trésorerie
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {indicateursFinanciers.tresorerie.toLocaleString("fr-FR")}{" "}
                    FCFA
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">+5.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Rechercher un rapport comptable..."
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
                {periodes.map((periode) => (
                  <option key={periode.value} value={periode.value}>
                    {periode.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" icon={Filter}>
                Filtres
              </Button>
            </div>
          </div>

          {/* Types de Rapports Comptables */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rapports Comptables
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {typesRapportsComptables.map((rapport) => {
                const Icon = rapport.icone;
                return (
                  <Card
                    key={rapport.id}
                    hover
                    className="cursor-pointer"
                    onClick={() => genererRapportComptable(rapport.id)}
                  >
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <div
                          className={`p-2 rounded-lg bg-${rapport.couleur}-100`}
                        >
                          <Icon
                            className={`h-6 w-6 text-${rapport.couleur}-600`}
                          />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {rapport.titre}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {rapport.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {getPeriodeLibelle(selectedPeriod)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Disponible
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Tableau des Rapports Comptables */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Rapports générés</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Historique de vos états financiers
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {rapportsComptables.length} rapport
                  {rapportsComptables.length > 1 ? "s" : ""}
                </Badge>
                <Button variant="outline" size="sm" icon={Download}>
                  Tout exporter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rapport
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Période
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Généré le
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rapportsComptables.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Aucun rapport comptable disponible
                            </h3>
                            <p className="text-sm text-gray-500 max-w-md mb-6">
                              Générez vos premiers états financiers en cliquant
                              sur les types de rapports ci-dessus. Vos rapports
                              apparaîtront ici avec toutes les détails
                              nécessaires.
                            </p>
                            <Button
                              onClick={() => navigate("/rapports/create")}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Générer un rapport
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rapportsComptables
                        .filter(
                          (rapport) =>
                            rapport.titre
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()) ||
                            rapport.type_rapport
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()),
                        )
                        .map((rapport) => (
                          <tr
                            key={rapport.id_rapport}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-start">
                                <div className="shrink-0">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {rapport.titre}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    ID: #
                                    {rapport.id_rapport
                                      .toString()
                                      .padStart(6, "0")}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${
                                    rapport.type_rapport === "BILAN"
                                      ? "bg-blue-500"
                                      : rapport.type_rapport === "RESULTAT"
                                        ? "bg-green-500"
                                        : rapport.type_rapport === "TVA"
                                          ? "bg-purple-500"
                                          : "bg-yellow-500"
                                  }`}
                                />
                                <span className="text-sm font-medium text-gray-900">
                                  {rapport.type_rapport}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {new Date(
                                  rapport.periode_debut,
                                ).toLocaleDateString("fr-FR")}{" "}
                                -{" "}
                                {new Date(
                                  rapport.periode_fin,
                                ).toLocaleDateString("fr-FR")}
                              </div>
                              <div className="text-xs text-gray-500">
                                Période fiscale
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {new Date(
                                  rapport.date_generation,
                                ).toLocaleDateString("fr-FR")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(
                                  rapport.date_generation,
                                ).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {rapport.montant_total.toLocaleString("fr-FR")}{" "}
                                FCFA
                              </div>
                              <div className="text-xs text-gray-500">HT</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${
                                    rapport.statut === "GENERE"
                                      ? "bg-green-500"
                                      : rapport.statut === "BROUILLON"
                                        ? "bg-yellow-500"
                                        : "bg-blue-500"
                                  }`}
                                />
                                <div>
                                  <Badge
                                    variant={
                                      rapport.statut === "GENERE"
                                        ? "success"
                                        : rapport.statut === "BROUILLON"
                                          ? "warning"
                                          : "info"
                                    }
                                    className="text-xs font-medium"
                                  >
                                    {rapport.statut === "GENERE"
                                      ? "Généré"
                                      : rapport.statut === "BROUILLON"
                                        ? "Brouillon"
                                        : "Validé"}
                                  </Badge>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {rapport.statut === "GENERE"
                                      ? "Prêt au téléchargement"
                                      : rapport.statut === "BROUILLON"
                                        ? "En cours de rédaction"
                                        : "Rapport validé"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Download}
                                  onClick={() => handleDownloadRapport(rapport)}
                                  className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                  title="Télécharger le rapport"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Edit}
                                  onClick={() =>
                                    handleGenerateRapport(rapport.id)
                                  }
                                  className="text-gray-600 hover:text-green-600 hover:bg-green-50"
                                  title="Modifier le rapport"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => handleDeleteRapport(rapport)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Supprimer le rapport"
                                />
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {rapportsComptables.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      Affichage de {rapportsComptables.length} rapport
                      {rapportsComptables.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>
                        Dernière mise à jour:{" "}
                        {new Date().toLocaleTimeString("fr-FR")}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => chargerDonneesComptables()}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Actualiser
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Rapports;
