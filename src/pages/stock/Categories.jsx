import React, { useState, useEffect } from "react";
import { categories } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../components/Notification";
import { Plus, Search, Edit2, Trash2, Folder, Package } from "lucide-react";

function Categories() {
  const [categoriesList, setCategoriesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nom_categorie: "",
  });

  // Générer une référence à partir de la catégorie pour affichage
  const getCategoryReference = (category) => {
    // Générer une référence basée sur l'index
    const index =
      categoriesList.findIndex(
        (c) => c.id_categorie === category.id_categorie,
      ) + 1;
    const paddedNumber = index.toString().padStart(6, "0");
    return `CAT${paddedNumber}`;
  };

  // Charger les données depuis la base de données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!profile?.id_entreprise) return;

    try {
      setLoading(true);
      setError("");

      const { data, error } = await categories.getAll(profile.id_entreprise);
      if (error) throw error;

      setCategoriesList(data || []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des catégories");
      showError("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categoriesList.filter((category) =>
    category.nom_categorie.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id_entreprise) return;

    try {
      const categoryData = {
        nom_categorie: formData.nom_categorie,
        id_entreprise: profile.id_entreprise,
      };

      let result;
      if (editingCategory) {
        result = await categories.update(
          editingCategory.id_categorie,
          categoryData,
        );
      } else {
        result = await categories.create(categoryData);
      }

      if (result.error) throw result.error;

      await loadData(); // Recharger les données
      resetForm();

      showSuccess(
        editingCategory
          ? "Catégorie modifiée avec succès"
          : "Catégorie ajoutée avec succès",
      );
    } catch (err) {
      showError(err.message || "Erreur lors de la sauvegarde de la catégorie");
    }
  };

  const resetForm = () => {
    setFormData({
      nom_categorie: "",
    });
    setShowAddModal(false);
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      nom_categorie: category.nom_categorie,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_categorie) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?"))
      return;

    try {
      const { error } = await categories.delete(id_categorie);
      if (error) throw error;

      await loadData(); // Recharger les données
      showSuccess("Catégorie supprimée avec succès");
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression de la catégorie");
    }
  };

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#14B8A6",
    "#F97316",
    "#6366F1",
    "#84CC16",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Catégories
          </h1>
          <p className="text-gray-600">Organisez vos produits par catégories</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Chargement des catégories...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 mx-auto mb-4 text-red-300" />
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
              placeholder="Rechercher une catégorie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Categories Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom de la catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre de produits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucune catégorie trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((category, index) => (
                      <tr
                        key={category.id_categorie}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getCategoryReference(category)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{
                                backgroundColor: `${colors[index % colors.length]}20`,
                              }}
                            >
                              <Folder
                                className="w-5 h-5"
                                style={{ color: colors[index % colors.length] }}
                              />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {category.nom_categorie}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString(
                            "fr-FR",
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">
                              {category.nombre_produits || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(category.id_categorie)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                              disabled={category.nombre_produits > 0}
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
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCategory
                ? "Modifier la catégorie"
                : "Ajouter une catégorie"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_categorie}
                  onChange={(e) =>
                    setFormData({ ...formData, nom_categorie: e.target.value })
                  }
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
                  {editingCategory ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
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

export default Categories;
