import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Package,
  MapPin,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { warehouses } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";

function Entrepots() {
  const { profile, loading: authLoading } = useAuth();
  const [entrepots, setEntrepots] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingEntrepot, setEditingEntrepot] = useState(null);
  const [selectedEntrepot, setSelectedEntrepot] = useState(null);
  const [formData, setFormData] = useState({
    nom_entrepot: "",
    adresse: "",
  });
  const [stockFormData, setStockFormData] = useState({
    id_produit: "",
    quantite: "",
    type_mouvement: "entree",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les entrepôts depuis la base de données
  const loadEntrepots = async () => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser le profil depuis useAuth
      if (!profile || !profile.id_entreprise) {
        setError("Utilisateur non connecté ou entreprise non trouvée");
        return;
      }

      // Charger les entrepôts de l'entreprise
      const { data, error } = await warehouses.getAll(profile.id_entreprise);

      if (error) {
        setError(error.message);
      } else {
        setEntrepots(data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && profile) {
      loadEntrepots();
    } else if (!authLoading && !profile) {
      setError("Utilisateur non connecté");
      setLoading(false);
    }
  }, [profile, authLoading]);

  // Générer une référence à partir de l'entrepôt pour affichage (séparé du nom)
  const getWarehouseReference = (entrepot) => {
    // Générer une référence basée sur l'index
    const index =
      entrepots.findIndex((e) => e.id_entrepot === entrepot.id_entrepot) + 1;
    const paddedNumber = index.toString().padStart(6, "0");
    return `EN${paddedNumber}`;
  };

  const filteredEntrepots = entrepots.filter(
    (entrepot) =>
      entrepot.nom_entrepot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrepot.adresse.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id_entreprise) {
      setError("Utilisateur non connecté");
      return;
    }

    try {
      setError(null);

      if (editingEntrepot) {
        // Mettre à jour l'entrepôt
        const { data, error } = await warehouses.update(
          editingEntrepot.id_entrepot,
          formData,
        );

        if (error) {
          setError(error.message);
          return;
        }

        // Mettre à jour la liste locale
        setEntrepots(
          entrepots.map((e) =>
            e.id_entrepot === editingEntrepot.id_entrepot
              ? { ...e, ...data }
              : e,
          ),
        );
      } else {
        // Créer un nouvel entrepôt
        const warehouseData = {
          nom_entrepot: formData.nom_entrepot,
          adresse: formData.adresse,
          id_entreprise: profile.id_entreprise,
        };

        const { data, error } = await warehouses.create(warehouseData);

        if (error) {
          setError(error.message);
          return;
        }

        // Ajouter à la liste locale
        setEntrepots([...entrepots, data]);
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nom_entrepot: "",
      adresse: "",
    });
    setShowAddModal(false);
    setEditingEntrepot(null);
  };

  const handleEdit = (entrepot) => {
    setEditingEntrepot(entrepot);
    setFormData({
      nom_entrepot: entrepot.nom_entrepot,
      adresse: entrepot.adresse,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_entrepot) => {
    const entrepot = entrepots.find((e) => e.id_entrepot === id_entrepot);

    if (!profile?.id_entreprise) {
      setError("Utilisateur non connecté");
      return;
    }

    // Vérifier si l'entrepôt contient des produits (simulation pour l'instant)
    if (entrepot.nombre_produits > 0) {
      alert(
        `Impossible de supprimer cet entrepôt car il contient ${entrepot.nombre_produits} produit(s).`,
      );
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cet entrepôt ?")) {
      try {
        setError(null);

        const { error } = await warehouses.delete(id_entrepot);

        if (error) {
          setError(error.message);
          return;
        }

        // Supprimer de la liste locale
        setEntrepots(entrepots.filter((e) => e.id_entrepot !== id_entrepot));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    // Simuler l'ajout de stock
    alert(
      `${stockFormData.quantite} unité(s) ${stockFormData.type_mouvement === "entree" ? "ajoutée(s)" : "retirée(s)"} dans l'entrepôt ${selectedEntrepot?.nom_entrepot}`,
    );
    resetStockForm();
  };

  const resetStockForm = () => {
    setStockFormData({
      id_produit: "",
      quantite: "",
      type_mouvement: "entree",
    });
    setShowStockModal(false);
    setSelectedEntrepot(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Entrepôts
          </h1>
          <p className="text-gray-600">Gérez vos entrepôts et leurs stocks</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un entrepôt
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading || authLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Chargement des entrepôts...</p>
        </div>
      ) : null}

      {/* Search */}
      {!loading && !authLoading && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un entrepôt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      )}

      {/* Entrepots Table */}
      {!loading && !authLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom de l'entrepôt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntrepots.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        {searchTerm
                          ? "Aucun entrepôt trouvé pour cette recherche"
                          : "Aucun entrepôt trouvé"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntrepots.map((entrepot) => (
                    <tr key={entrepot.id_entrepot} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getWarehouseReference(entrepot)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {entrepot.nom_entrepot}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {entrepot.adresse || "Adresse non spécifiée"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entrepot.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {entrepot.nombre_produits || 0}
                        </div>
                        <div className="text-xs text-gray-500">Produits</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {entrepot.stock_total || 0}
                        </div>
                        <div className="text-xs text-gray-500">Unités</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedEntrepot(entrepot);
                              setShowStockModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Gérer le stock"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(entrepot)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entrepot.id_entrepot)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Entrepot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingEntrepot ? "Modifier l'entrepôt" : "Ajouter un entrepôt"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entrepôt *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_entrepot}
                  onChange={(e) =>
                    setFormData({ ...formData, nom_entrepot: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Ex: Entrepôt Principal, Dépôt Nord..."
                />
              </div>

              {!editingEntrepot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence automatique
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    Sera généré automatiquement (EN000001)
                  </div>
                </div>
              )}

              {editingEntrepot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                    {getWarehouseReference(editingEntrepot)}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <textarea
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Adresse de l'entrepôt"
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
                  {editingEntrepot ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && selectedEntrepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Gérer le stock - {selectedEntrepot.nom_entrepot}
            </h2>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de mouvement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setStockFormData({
                        ...stockFormData,
                        type_mouvement: "entree",
                      })
                    }
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      stockFormData.type_mouvement === "entree"
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Entrée
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStockFormData({
                        ...stockFormData,
                        type_mouvement: "sortie",
                      })
                    }
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      stockFormData.type_mouvement === "sortie"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Sortie
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit *
                </label>
                <select
                  required
                  value={stockFormData.id_produit}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      id_produit: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Sélectionner un produit</option>
                  <option value="prod1">Ordinateur Portable</option>
                  <option value="prod2">Clavier USB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockFormData.quantite}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      quantite: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetStockForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {stockFormData.type_mouvement === "entree"
                    ? "Ajouter"
                    : "Retirer"}{" "}
                  le stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Entrepots;
