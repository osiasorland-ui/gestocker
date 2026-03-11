import React, { useState, useEffect, useCallback } from "react";
import { categories } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuthHook.js";
import Notification from "../../components/Notification";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Folder,
  Package,
  Tag,
} from "lucide-react";

import Loader, {
  PageLoader,
  TableLoader,
  InlineLoader,
  CardLoader,
} from "../../components/ui/Loader";

function Categories() {
  const [categoriesList, setCategoriesList] = useState([]);
  const [entrepotsList, setEntrepotsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterNom, setFilterNom] = useState("");
  const [filterEntrepot, setFilterEntrepot] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nom_categorie: "",
    id_entrepot: "",
  });

  const loadData = useCallback(async () => {
    if (!profile?.id_entreprise) return;

    try {
      setLoading(true);
      setError("");

      const { data, error } = await categories.getAll(profile.id_entreprise);
      if (error) throw error;

      setCategoriesList(data || []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des catégories");
      setNotification({
        type: "error",
        message: "Erreur lors du chargement des catégories",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.id_entreprise]);

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

  // Charger les entrepôts pour le formulaire
  const loadEntrepots = useCallback(async () => {
    if (!profile?.id_entreprise) return;

    try {
      // Importer warehouses depuis supabase
      const { warehouses } = await import("../../config/supabase.js");
      const { data, error } = await warehouses.getAll(profile.id_entreprise);
      if (error) throw error;
      setEntrepotsList(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des entrepôts:", err);
    }
  }, [profile]);

  // Charger les données depuis la base de données
  useEffect(() => {
    if (profile?.id_entreprise) {
      loadData();
      loadEntrepots();
    }
  }, [profile?.id_entreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredCategories = categoriesList.filter((category) => {
    // Filtre par nom (si renseigné)
    const nomMatch =
      !filterNom ||
      category.nom_categorie.toLowerCase().includes(filterNom.toLowerCase());

    // Filtre par entrepôt (si renseigné)
    const entrepotMatch =
      !filterEntrepot || category.id_entrepot === filterEntrepot;

    // Filtre par recherche globale (si renseignée)
    const searchMatch =
      !searchTerm ||
      category.nom_categorie.toLowerCase().includes(searchTerm.toLowerCase());

    return nomMatch && entrepotMatch && searchMatch;
  });

  // Fonction pour vérifier si une catégorie existe déjà dans un entrepôt
  const checkCategoryWarehouseDuplicate = async (
    nomCategorie,
    idEntrepot,
    editingId = null,
  ) => {
    try {
      const { data, error } = await categories.getAll(profile.id_entreprise);
      if (error) throw error;

      const duplicate = data?.find(
        (cat) =>
          cat.nom_categorie.toLowerCase() === nomCategorie.toLowerCase() &&
          cat.id_entrepot === idEntrepot &&
          cat.id_categorie !== editingId, // Exclure la catégorie en cours de modification
      );

      return { exists: !!duplicate, duplicate };
    } catch (error) {
      console.error("Erreur vérification doublon catégorie:", error);
      return { exists: false, duplicate: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile?.id_entreprise) return;

    try {
      // Vérifier les doublons de catégorie dans le même entrepôt
      const { exists, duplicate } = await checkCategoryWarehouseDuplicate(
        formData.nom_categorie,
        formData.id_entrepot,
        editingCategory?.id_categorie,
      );

      if (exists) {
        const ref = getCategoryReference(duplicate);
        setNotification({
          type: "error",
          message: `La catégorie "${formData.nom_categorie}" existe déjà dans cet entrepôt (${ref}). Veuillez utiliser un nom différent ou un autre entrepôt.`,
        });
        return;
      }

      const categoryData = {
        nom_categorie: formData.nom_categorie,
        id_entrepot: formData.id_entrepot,
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

      setNotification({
        type: "success",
        message: editingCategory
          ? "Catégorie modifiée avec succès"
          : "Catégorie ajoutée avec succès",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Erreur lors de la sauvegarde de la catégorie",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nom_categorie: "",
      id_entrepot: "",
    });
    setShowAddModal(false);
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      nom_categorie: category.nom_categorie,
      id_entrepot: category.id_entrepot,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_categorie) => {
    // Trouver la catégorie à supprimer
    const category = categoriesList.find(
      (c) => c.id_categorie === id_categorie,
    );
    if (!category) return;

    // Si des produits sont associés, afficher une notification informative
    if (category.nombre_produits > 0) {
      setNotification({
        type: "error",
        message: `Impossible de supprimer la catégorie "${category.nom_categorie}" car elle contient ${category.nombre_produits} produit(s) associé(s). Veuillez d'abord supprimer ou déplacer ces produits.`,
      });
      return;
    }

    // Si aucun produit associé, supprimer directement sans confirmation
    try {
      const { error } = await categories.delete(category.id_categorie);
      if (error) throw error;

      await loadData(); // Recharger les données
      setNotification({
        type: "success",
        message: `Catégorie "${category.nom_categorie}" supprimée avec succès`,
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Erreur lors de la suppression de la catégorie",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;

    try {
      const { error } = await categories.delete(deletingCategory.id_categorie);
      if (error) throw error;

      await loadData(); // Recharger les données
      setNotification({
        type: "success",
        message: "Catégorie supprimée avec succès",
      });
      setShowDeleteModal(false);
      setDeletingCategory(null);
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Erreur lors de la suppression de la catégorie",
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingCategory(null);
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
    <div className="space-y-6 mx-auto p-10">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <Tag className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Catégories
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {categoriesList.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Produits
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {categoriesList.reduce(
                  (total, cat) => total + (cat.nombre_produits || 0),
                  0,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Chargement des catégories..." />
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
          {/* Search et Filtres */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Barre de recherche globale */}
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

              {/* Filtre par nom */}
              <div>
                <input
                  type="text"
                  placeholder="Filtrer par nom..."
                  value={filterNom}
                  onChange={(e) => setFilterNom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {/* Filtre par entrepôt */}
              <div>
                <select
                  value={filterEntrepot}
                  onChange={(e) => setFilterEntrepot(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Tous les entrepôts</option>
                  {entrepotsList.map((entrepot) => (
                    <option
                      key={entrepot.id_entrepot}
                      value={entrepot.id_entrepot}
                    >
                      {entrepot.nom_entrepot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton de réinitialisation */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilterNom("");
                    setFilterEntrepot("");
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
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
                      Entrepôt
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
                        colSpan="6"
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
                          {entrepotsList.find(
                            (e) => e.id_entrepot === category.id_entrepot,
                          )?.nom_entrepot || "Non spécifié"}
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
                  placeholder="Ex: Électronique, Vêtements..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entrepôt associé *
                </label>
                <select
                  value={formData.id_entrepot}
                  onChange={(e) =>
                    setFormData({ ...formData, id_entrepot: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Sélectionner un entrepôt</option>
                  {entrepotsList.map((entrepot) => (
                    <option
                      key={entrepot.id_entrepot}
                      value={entrepot.id_entrepot}
                    >
                      {entrepot.nom_entrepot}
                    </option>
                  ))}
                </select>
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

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">
                ⚠️ Confirmation de suppression
              </h3>
              <button
                onClick={cancelDelete}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Êtes-vous sûr de vouloir supprimer cette catégorie ?
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-900">
                  {deletingCategory.nom_categorie}
                </p>
                <p className="text-sm text-gray-600">
                  Référence: {getCategoryReference(deletingCategory)}
                </p>
                {deletingCategory.nombre_produits > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ {deletingCategory.nombre_produits} produit(s) associé(s)
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
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

export default Categories;
