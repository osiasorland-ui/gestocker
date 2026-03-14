import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../components/Notification";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Eye,
  FileText,
  Calendar,
  Package,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
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
import Loader, {
  PageLoader,
  TableLoader,
  InlineLoader,
  CardLoader,
} from "../../components/ui/Loader";

function CommandesAchat() {
  const [commandes, setCommandes] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommande, setEditingCommande] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    id_fournisseur: "",
    date_commande: "",
    date_livraison_prevue: "",
    statut: "en_attente",
    montant_total: "",
    notes: "",
    articles: [],
  });

  const [articleForm, setArticleForm] = useState({
    designation: "",
    quantite: "",
    prix_unitaire: "",
    total: 0,
  });

  const loadData = useCallback(async () => {
    if (!profile?.id_entreprise) return;

    try {
      setLoading(true);
      setError("");

      // Simulation de chargement - à remplacer par l'appel API réel
      const mockCommandes = [];

      const mockFournisseurs = [];

      setCommandes(mockCommandes);
      setFournisseurs(mockFournisseurs);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des commandes");
      showError("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, [profile?.id_entreprise, showError]);

  const statuts = [
    {
      value: "en_attente",
      label: "En attente",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      value: "confirmee",
      label: "Confirmée",
      icon: CheckCircle,
      color: "text-blue-600",
    },
    {
      value: "partiellement_livree",
      label: "Partiellement livrée",
      icon: Package,
      color: "text-orange-600",
    },
    {
      value: "livree",
      label: "Livrée",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      value: "annulee",
      label: "Annulée",
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  // Charger les données depuis la base de données
  useEffect(() => {
    if (profile?.id_entreprise) {
      loadData();
    }
  }, [profile?.id_entreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCommandes = commandes.filter(
    (commande) =>
      commande.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commande.fournisseurs?.nom_fournisseur
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      commande.statut.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const generateReference = () => {
    const year = new Date().getFullYear();
    const count = commandes.length + 1;
    return `CA-${year}-${count.toString().padStart(3, "0")}`;
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const getStatutInfo = (statut) => {
    return statuts.find((s) => s.value === statut) || statuts[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id_entreprise) {
      showError("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    if (!formData.id_fournisseur) {
      showError("Veuillez sélectionner un fournisseur");
      return;
    }

    if (!formData.date_commande) {
      showError("La date de commande est obligatoire");
      return;
    }

    if (formData.articles.length === 0) {
      showError("Veuillez ajouter au moins un article");
      return;
    }

    try {
      const commandeData = {
        reference: editingCommande
          ? editingCommande.reference
          : generateReference(),
        id_fournisseur: formData.id_fournisseur,
        date_commande: formData.date_commande,
        date_livraison_prevue: formData.date_livraison_prevue,
        statut: formData.statut,
        montant_total: formData.articles.reduce(
          (sum, article) => sum + article.total,
          0,
        ),
        notes: formData.notes,
        articles: formData.articles,
        id_entreprise: profile.id_entreprise,
      };

      // Simulation de sauvegarde - à remplacer par l'appel API réel
      if (editingCommande) {
        // Update
        const updatedCommandes = commandes.map((c) =>
          c.id_commande_achat === editingCommande.id_commande_achat
            ? { ...c, ...commandeData }
            : c,
        );
        setCommandes(updatedCommandes);
      } else {
        // Create
        const newCommande = {
          id_commande_achat: Date.now().toString(),
          ...commandeData,
          fournisseurs: fournisseurs.find(
            (f) => f.id_fournisseur === formData.id_fournisseur,
          ),
          created_at: new Date().toISOString(),
        };
        setCommandes([...commandes, newCommande]);
      }

      resetForm();
      showSuccess(
        editingCommande
          ? "Commande modifiée avec succès"
          : "Commande ajoutée avec succès",
      );
    } catch (err) {
      showError(err.message || "Erreur lors de la sauvegarde de la commande");
    }
  };

  const resetForm = () => {
    setFormData({
      id_fournisseur: "",
      date_commande: "",
      date_livraison_prevue: "",
      statut: "en_attente",
      montant_total: "",
      notes: "",
      articles: [],
    });
    setArticleForm({
      designation: "",
      quantite: "",
      prix_unitaire: "",
      total: 0,
    });
    setShowAddModal(false);
    setEditingCommande(null);
  };

  const addArticle = () => {
    if (
      !articleForm.designation ||
      !articleForm.quantite ||
      !articleForm.prix_unitaire
    ) {
      showError("Veuillez remplir tous les champs de l'article");
      return;
    }

    const total =
      parseFloat(articleForm.quantite) * parseFloat(articleForm.prix_unitaire);
    const newArticle = {
      ...articleForm,
      quantite: parseInt(articleForm.quantite),
      prix_unitaire: parseFloat(articleForm.prix_unitaire),
      total,
    };

    setFormData({
      ...formData,
      articles: [...formData.articles, newArticle],
    });

    setArticleForm({
      designation: "",
      quantite: "",
      prix_unitaire: "",
      total: 0,
    });
  };

  const removeArticle = (index) => {
    setFormData({
      ...formData,
      articles: formData.articles.filter((_, i) => i !== index),
    });
  };

  const handleEdit = (commande) => {
    setEditingCommande(commande);
    setFormData({
      id_fournisseur: commande.id_fournisseur,
      date_commande: commande.date_commande,
      date_livraison_prevue: commande.date_livraison_prevue,
      statut: commande.statut,
      montant_total: commande.montant_total,
      notes: commande.notes,
      articles: commande.articles || [],
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_commande_achat) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) return;

    try {
      // Simulation de suppression - à remplacer par l'appel API réel
      const updatedCommandes = commandes.filter(
        (c) => c.id_commande_achat !== id_commande_achat,
      );
      setCommandes(updatedCommandes);
      showSuccess("Commande supprimée avec succès");
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression de la commande");
    }
  };

  const viewDetails = (commande) => {
    setSelectedCommande(commande);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6 mx-auto p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Commandes d'Achat
          </h1>
          <p className="text-gray-600">
            Gérez vos commandes d'achat fournisseurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Chargement des commandes d'achat..." />
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une commande..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date livraison prévue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCommandes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucune commande trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCommandes.map((commande) => {
                      const statutInfo = getStatutInfo(commande.statut);
                      const StatutIcon = statutInfo.icon;
                      return (
                        <tr
                          key={commande.id_commande_achat}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commande.reference}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {commande.fournisseurs?.nom_fournisseur}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(
                                commande.date_commande,
                              ).toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(
                                commande.date_livraison_prevue,
                              ).toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div
                              className={`flex items-center gap-2 ${statutInfo.color}`}
                            >
                              <StatutIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {statutInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatPrice(commande.montant_total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewDetails(commande)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(commande)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(commande.id_commande_achat)
                                }
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCommande
                ? "Modifier la commande"
                : "Nouvelle commande d'achat"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur *
                  </label>
                  <select
                    required
                    value={formData.id_fournisseur}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id_fournisseur: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map((fournisseur) => (
                      <option
                        key={fournisseur.id_fournisseur}
                        value={fournisseur.id_fournisseur}
                      >
                        {fournisseur.nom_fournisseur}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) =>
                      setFormData({ ...formData, statut: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {statuts.map((statut) => (
                      <option key={statut.value} value={statut.value}>
                        {statut.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date commande *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_commande}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_commande: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date livraison prévue
                  </label>
                  <input
                    type="date"
                    value={formData.date_livraison_prevue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_livraison_prevue: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Articles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Articles
                </label>
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  {formData.articles.map((article, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {article.designation}
                        </div>
                        <div className="text-sm text-gray-500">
                          {article.quantite} ×{" "}
                          {formatPrice(article.prix_unitaire)} ={" "}
                          {formatPrice(article.total)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeArticle(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Désignation"
                      value={articleForm.designation}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          designation: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Quantité"
                      value={articleForm.quantite}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          quantite: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Prix unitaire"
                      value={articleForm.prix_unitaire}
                      onChange={(e) =>
                        setArticleForm({
                          ...articleForm,
                          prix_unitaire: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={addArticle}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingCommande ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedCommande && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Détails de la commande {selectedCommande.reference}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Fournisseur:</span>
                  <div className="font-medium">
                    {selectedCommande.fournisseurs?.nom_fournisseur}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Statut:</span>
                  <div className="font-medium">
                    {getStatutInfo(selectedCommande.statut).label}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date commande:</span>
                  <div className="font-medium">
                    {new Date(
                      selectedCommande.date_commande,
                    ).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    Date livraison prévue:
                  </span>
                  <div className="font-medium">
                    {new Date(
                      selectedCommande.date_livraison_prevue,
                    ).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Articles</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Désignation
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantité
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Prix unitaire
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedCommande.articles?.map((article, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">{article.designation}</td>
                          <td className="px-4 py-2">{article.quantite}</td>
                          <td className="px-4 py-2">
                            {formatPrice(article.prix_unitaire)}
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {formatPrice(article.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 font-medium">
                          Total général
                        </td>
                        <td className="px-4 py-2 font-bold">
                          {formatPrice(selectedCommande.montant_total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedCommande.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes</h3>
                  <p className="text-gray-600">{selectedCommande.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      <Notification
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

export default CommandesAchat;
