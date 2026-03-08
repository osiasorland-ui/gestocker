import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../components/Notification";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  Eye,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Warehouse,
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

function Receptions() {
  const [receptions, setReceptions] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [entrepots, setEntrepots] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReception, setEditingReception] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReception, setSelectedReception] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    id_commande: "",
    date_reception: "",
    id_entrepot: "",
    statut: "en_attente",
    notes: "",
    articles_recus: [],
  });

  const statuts = [
    {
      value: "en_attente",
      label: "En attente",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      value: "en_cours",
      label: "En cours",
      icon: Truck,
      color: "text-blue-600",
    },
    {
      value: "terminee",
      label: "Terminée",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      value: "partielle",
      label: "Partielle",
      icon: Package,
      color: "text-orange-600",
    },
    {
      value: "annulee",
      label: "Annulée",
      icon: XCircle,
      color: "text-red-600",
    },
  ];

  // Charger les données depuis la base de données
  const loadData = useCallback(async () => {
    if (!profile?.id_entreprise) return;

    try {
      setLoading(true);
      setError("");

      // Simulation de chargement - à remplacer par l'appel API réel
      const mockReceptions = [];

      const mockCommandes = [];

      const mockEntrepots = [];

      setReceptions(mockReceptions);
      setCommandes(mockCommandes);
      setEntrepots(mockEntrepots);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des réceptions");
      showError("Erreur lors du chargement des réceptions");
    } finally {
      setLoading(false);
    }
  }, [profile?.id_entreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [profile?.id_entreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredReceptions = receptions.filter(
    (reception) =>
      reception.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reception.commandes_achat?.fournisseurs?.nom_fournisseur
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reception.statut.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const generateReference = () => {
    const year = new Date().getFullYear();
    const count = receptions.length + 1;
    return `REC-${year}-${count.toString().padStart(3, "0")}`;
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

    if (!formData.id_commande) {
      showError("Veuillez sélectionner une commande d'achat");
      return;
    }

    if (!formData.date_reception) {
      showError("La date de réception est obligatoire");
      return;
    }

    if (!formData.id_entrepot) {
      showError("Veuillez sélectionner un entrepôt");
      return;
    }

    if (formData.articles_recus.length === 0) {
      showError("Veuillez ajouter au moins un article reçu");
      return;
    }

    try {
      const receptionData = {
        reference: editingReception
          ? editingReception.reference
          : generateReference(),
        id_commande: formData.id_commande,
        date_reception: formData.date_reception,
        id_entrepot: formData.id_entrepot,
        statut: formData.statut,
        notes: formData.notes,
        articles_recus: formData.articles_recus,
        id_entreprise: profile.id_entreprise,
      };

      // Simulation de sauvegarde - à remplacer par l'appel API réel
      if (editingReception) {
        // Update
        const updatedReceptions = receptions.map((r) =>
          r.id_reception === editingReception.id_reception
            ? { ...r, ...receptionData }
            : r,
        );
        setReceptions(updatedReceptions);
      } else {
        // Create
        const newReception = {
          id_reception: Date.now().toString(),
          ...receptionData,
          commandes_achat: commandes.find(
            (c) => c.id_commande_achat === formData.id_commande,
          ),
          entrepots: entrepots.find(
            (e) => e.id_entrepot === formData.id_entrepot,
          ),
          created_at: new Date().toISOString(),
        };
        setReceptions([...receptions, newReception]);
      }

      resetForm();
      showSuccess(
        editingReception
          ? "Réception modifiée avec succès"
          : "Réception créée avec succès",
      );
    } catch (err) {
      showError(err.message || "Erreur lors de la sauvegarde de la réception");
    }
  };

  const resetForm = () => {
    setFormData({
      id_commande: "",
      date_reception: "",
      id_entrepot: "",
      statut: "en_attente",
      notes: "",
      articles_recus: [],
    });
    setShowAddModal(false);
    setEditingReception(null);
  };

  const loadCommandeArticles = (commandeId) => {
    const commande = commandes.find((c) => c.id_commande_achat === commandeId);
    if (commande) {
      setFormData({
        ...formData,
        articles_recus: commande.articles.map((article) => ({
          designation: article.designation,
          quantite_commandee: article.quantite,
          quantite_recue: 0,
          id_entrepot: formData.id_entrepot,
          notes: "",
        })),
      });
    }
  };

  const updateArticleRecu = (index, field, value) => {
    const updatedArticles = [...formData.articles_recus];
    updatedArticles[index] = {
      ...updatedArticles[index],
      [field]: field === "quantite_recue" ? parseInt(value) || 0 : value,
    };
    setFormData({ ...formData, articles_recus: updatedArticles });
  };

  const handleEdit = (reception) => {
    setEditingReception(reception);
    setFormData({
      id_commande: reception.id_commande_achat,
      date_reception: reception.date_reception,
      id_entrepot: reception.id_entrepot,
      statut: reception.statut,
      notes: reception.notes,
      articles_recus: reception.articles_recus || [],
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_reception) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette réception ?"))
      return;

    try {
      // Simulation de suppression - à remplacer par l'appel API réel
      const updatedReceptions = receptions.filter(
        (r) => r.id_reception !== id_reception,
      );
      setReceptions(updatedReceptions);
      showSuccess("Réception supprimée avec succès");
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression de la réception");
    }
  };

  const viewDetails = (reception) => {
    setSelectedReception(reception);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6 mx-auto p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réceptions</h1>
          <p className="text-gray-600">
            Gérez la réception des commandes d'achat
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle réception
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Chargement des réceptions..." />
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
              placeholder="Rechercher une réception..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Receptions Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date réception
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReceptions.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucune réception trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReceptions.map((reception) => {
                      const statutInfo = getStatutInfo(reception.statut);
                      const StatutIcon = statutInfo.icon;
                      return (
                        <tr
                          key={reception.id_reception}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {reception.reference}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {reception.commandes_achat?.reference}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {
                                reception.commandes_achat?.fournisseurs
                                  ?.nom_fournisseur
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(
                                reception.date_reception,
                              ).toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Warehouse className="w-4 h-4 text-gray-400" />
                              {reception.entrepots?.nom_entrepot}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewDetails(reception)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(reception)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(reception.id_reception)
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
              {editingReception
                ? "Modifier la réception"
                : "Nouvelle réception"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commande d'achat *
                  </label>
                  <select
                    required
                    value={formData.id_commande}
                    onChange={(e) => {
                      const commandeId = e.target.value;
                      setFormData({
                        ...formData,
                        id_commande: commandeId,
                      });
                      loadCommandeArticles(commandeId);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner une commande</option>
                    {commandes
                      .filter((c) => c.statut === "confirmee")
                      .map((commande) => (
                        <option
                          key={commande.id_commande_achat}
                          value={commande.id_commande_achat}
                        >
                          {commande.reference} -{" "}
                          {commande.fournisseurs?.nom_fournisseur}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrepôt *
                  </label>
                  <select
                    required
                    value={formData.id_entrepot}
                    onChange={(e) =>
                      setFormData({ ...formData, id_entrepot: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un entrepôt</option>
                    {entrepots.map((entrepot) => (
                      <option
                        key={entrepot.id_entrepot}
                        value={entrepot.id_entrepot}
                      >
                        {entrepot.nom_entrepot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date réception *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date_reception}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_reception: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
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

              {/* Articles reçus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Articles reçus
                </label>
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  {formData.articles_recus.map((article, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Désignation
                          </label>
                          <input
                            type="text"
                            value={article.designation}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Quantité commandée
                          </label>
                          <input
                            type="number"
                            value={article.quantite_commandee}
                            readOnly
                            className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-100 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Quantité reçue *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={article.quantite_commandee}
                            value={article.quantite_recue}
                            onChange={(e) =>
                              updateArticleRecu(
                                index,
                                "quantite_recue",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Notes
                          </label>
                          <input
                            type="text"
                            value={article.notes}
                            onChange={(e) =>
                              updateArticleRecu(index, "notes", e.target.value)
                            }
                            placeholder="Conformité, état..."
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes générales
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
                  {editingReception ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedReception && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                Détails de la réception {selectedReception.reference}
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
                  <span className="text-sm text-gray-500">Commande:</span>
                  <div className="font-medium">
                    {selectedReception.commandes_achat?.reference}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Fournisseur:</span>
                  <div className="font-medium">
                    {
                      selectedReception.commandes_achat?.fournisseurs
                        ?.nom_fournisseur
                    }
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date réception:</span>
                  <div className="font-medium">
                    {new Date(
                      selectedReception.date_reception,
                    ).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Entrepôt:</span>
                  <div className="font-medium">
                    {selectedReception.entrepots?.nom_entrepot}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Statut:</span>
                  <div className="font-medium">
                    {getStatutInfo(selectedReception.statut).label}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Articles reçus</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Désignation
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Qté commandée
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Qté reçue
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReception.articles_recus?.map(
                        (article, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{article.designation}</td>
                            <td className="px-4 py-2">
                              {article.quantite_commandee}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`font-medium ${
                                  article.quantite_recue ===
                                  article.quantite_commandee
                                    ? "text-green-600"
                                    : article.quantite_recue > 0
                                      ? "text-orange-600"
                                      : "text-red-600"
                                }`}
                              >
                                {article.quantite_recue}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {article.notes || "-"}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedReception.notes && (
                <div>
                  <h3 className="font-medium mb-2">Notes générales</h3>
                  <p className="text-gray-600">{selectedReception.notes}</p>
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

export default Receptions;
