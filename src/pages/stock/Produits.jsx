import React, { useState, useEffect } from "react";
import { products, warehouses, categories } from "../../config/supabase";
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
  Upload,
  Download,
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

function Produits() {
  const [produits, setProduits] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    designation: "",
    prix_unitaire: "",
    id_categorie: "",
    id_entrepot: "",
    quantite_stock: "", // Ajout du champ quantité
  });

  // Générer une référence de produit au format PR000001
  const generateProductReference = async () => {
    return await products.generateReference(profile.id_entreprise);
  };

  // Générer un SKU aléatoire pour les produits
  const generateSKU = () => {
    const prefix = "PRD";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  // Formatter le prix en FCFA
  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Générer une référence à partir du produit pour affichage
  const getProductReference = (produit) => {
    // Si le SKU commence par PRD, c'est un SKU aléatoire, on génère une référence basée sur l'index
    if (produit.sku && produit.sku.startsWith("PRD-")) {
      const index =
        produits.findIndex((p) => p.id_produit === produit.id_produit) + 1;
      const paddedNumber = index.toString().padStart(6, "0");
      return `PR${paddedNumber}`;
    }
    // Si le SKU commence par PR, c'est une référence PR000001
    if (produit.sku && produit.sku.startsWith("PR")) {
      return produit.sku;
    }
    // Fallback
    return produit.sku || "N/A";
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

      // Charger les produits
      const { data: productsData, error: productsError } =
        await products.getAll(profile.id_entreprise);
      if (productsError) throw productsError;

      // Charger les catégories
      const { data: categoriesData, error: categoriesError } =
        await categories.getAll(profile.id_entreprise);
      if (categoriesError) throw categoriesError;

      // Charger les entrepôts
      const { data: warehousesData, error: warehousesError } =
        await warehouses.getAll(profile.id_entreprise);
      if (warehousesError) throw warehousesError;

      setProduits(productsData || []);
      setCategoriesList(categoriesData || []);
      setWarehousesList(warehousesData || []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des données");
      showError("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  };

  // Générer un SKU automatiquement lors de l'ouverture du modal
  useEffect(() => {
    if (showAddModal && !editingProduit) {
      // Le SKU sera généré automatiquement lors de la soumission
    }
  }, [showAddModal, editingProduit]);

  const filteredProduits = produits.filter(
    (produit) =>
      produit.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id_entreprise) {
      showError("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    if (!formData.designation?.trim()) {
      showError("La désignation est obligatoire");
      return;
    }

    if (!formData.prix_unitaire || formData.prix_unitaire <= 0) {
      showError("Le prix unitaire doit être supérieur à 0");
      return;
    }

    if (!formData.quantite_stock || formData.quantite_stock < 0) {
      showError("La quantité en stock doit être supérieure ou égale à 0");
      return;
    }

    if (!formData.id_entrepot) {
      showError("Veuillez sélectionner un entrepôt");
      return;
    }

    try {
      // Générer la référence du produit au format PR000001
      const productReference = await generateProductReference();

      // Sauvegarder l'ancienne catégorie pour la mise à jour des compteurs
      const oldCategoryId = editingProduit?.id_categorie;
      const newCategoryId = formData.id_categorie || null;

      const productData = {
        designation: formData.designation.trim(),
        // SKU aléatoire pour tous les produits (nouveaux et modifications)
        sku: editingProduit ? editingProduit.sku : generateSKU(),
        prix_unitaire: parseFloat(formData.prix_unitaire),
        quantite_stock: parseInt(formData.quantite_stock) || 0, // Ajout de la quantité
        id_categorie: newCategoryId,
        id_entrepot: formData.id_entrepot,
        id_entreprise: profile.id_entreprise,
      };

      let result;
      if (editingProduit) {
        result = await products.update(editingProduit.id_produit, productData);

        // Mettre à jour les compteurs de catégories si la catégorie a changé
        if (!result.error) {
          // Si l'ancienne catégorie est différente de la nouvelle
          if (oldCategoryId !== newCategoryId) {
            // Décrémenter l'ancienne catégorie
            if (oldCategoryId) {
              await categories.decrementProductCount(oldCategoryId);
            }
            // Incrémenter la nouvelle catégorie
            if (newCategoryId) {
              await categories.incrementProductCount(newCategoryId);
            }
          }
        }
      } else {
        result = await products.create(productData);

        // Incrémenter le compteur de produits dans la catégorie si une catégorie est spécifiée
        if (newCategoryId && !result.error) {
          await categories.incrementProductCount(newCategoryId);
        }
      }

      if (result.error) throw result.error;

      await loadData(); // Recharger les données
      resetForm();

      showSuccess(
        editingProduit
          ? "Produit modifié avec succès"
          : "Produit ajouté avec succès",
      );
    } catch (err) {
      showError(err.message || "Erreur lors de la sauvegarde du produit");
    }
  };

  const resetForm = () => {
    setFormData({
      designation: "",
      prix_unitaire: "",
      id_categorie: "",
      id_entrepot: "",
      quantite_stock: "", // Réinitialiser le champ quantité
    });
    setShowAddModal(false);
    setEditingProduit(null);
  };

  // Gestion de l'import CSV
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === "text/csv" ||
        file.type === "application/vnd.ms-excel" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) {
      setCsvFile(file);
    } else {
      showError("Veuillez sélectionner un fichier CSV ou Excel valide");
    }
  };

  const handleImportCSV = () => {
    if (!csvFile) {
      showError("Veuillez sélectionner un fichier");
      return;
    }

    // Simulation de l'importation
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const headers = lines[0].split(",");

      const newProducts = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(",");

          // Générer une référence pour chaque produit importé
          const productReference = await generateProductReference();

          newProducts.push({
            id_produit: `temp_import_${i}`,
            ref: produits.length + i,
            designation: values[0]?.trim() || "",
            sku: productReference, // Utiliser le nouveau format PR000001
            id_categorie: values[1]?.trim() || "",
            prix_unitaire: parseFloat(values[2]) || 0,
          });
        }
      }

      setProduits([...produits, ...newProducts]);
      setShowImportModal(false);
      setCsvFile(null);
      showSuccess(`${newProducts.length} produits importés avec succès`);
    };
    reader.readAsText(csvFile);
  };

  const exportToCSV = () => {
    const headers = ["Désignation", "SKU", "Catégorie", "Prix Unitaire (FCFA)"];
    const csvContent = [
      headers.join(","),
      ...produits.map((p) =>
        [p.designation, p.sku, p.id_categorie, p.prix_unitaire].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produits.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEdit = (produit) => {
    setEditingProduit(produit);
    setFormData({
      designation: produit.designation,
      prix_unitaire: produit.prix_unitaire,
      id_categorie: produit.id_categorie,
      id_entrepot: produit.id_entrepot,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_produit) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;

    try {
      // Récupérer le produit avant de le supprimer pour connaître sa catégorie
      const produitToDelete = produits.find((p) => p.id_produit === id_produit);

      const { error } = await products.delete(id_produit);
      if (error) throw error;

      // Décrémenter le compteur de produits dans la catégorie si le produit avait une catégorie
      if (produitToDelete?.id_categorie) {
        await categories.decrementProductCount(produitToDelete.id_categorie);
      }

      await loadData(); // Recharger les données
      showSuccess("Produit supprimé avec succès");
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression du produit");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Produits
          </h1>
          <p className="text-gray-600">Gérez votre catalogue de produits</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Importer
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Chargement des produits..." />
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
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      REF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrepôt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Unitaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProduits.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun produit trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProduits.map((produit) => (
                      <tr key={produit.id_produit} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getProductReference(produit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {produit.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {produit.designation}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {produit.categories?.nom_categorie || "Non classé"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {produit.entrepots?.nom_entrepot || "Non assigné"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">
                              {produit.quantite_stock || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPrice(produit.prix_unitaire)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(produit)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(produit.id_produit)}
                              className="text-red-600 hover:text-red-800"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingProduit ? "Modifier le produit" : "Ajouter un produit"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Désignation *
                </label>
                <input
                  type="text"
                  required
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.id_categorie}
                    onChange={(e) =>
                      setFormData({ ...formData, id_categorie: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categoriesList.map((cat) => (
                      <option key={cat.id_categorie} value={cat.id_categorie}>
                        {cat.nom_categorie}
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
                    {warehousesList.map((warehouse) => (
                      <option
                        key={warehouse.id_entrepot}
                        value={warehouse.id_entrepot}
                      >
                        {warehouse.nom_entrepot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité en Stock *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.quantite_stock}
                  onChange={(e) =>
                    setFormData({ ...formData, quantite_stock: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix Unitaire (FCFA) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.prix_unitaire}
                  onChange={(e) =>
                    setFormData({ ...formData, prix_unitaire: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="0"
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
                  {editingProduit ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Importer des produits</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un fichier CSV ou Excel
                </label>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Format attendu :</strong>
                  <br />
                  Désignation, Catégorie, Prix Unitaire
                  <br />
                  <em>Ex: Ordinateur Portable, Informatique, 750</em>
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImportCSV}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Importer
                </button>
              </div>
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

export default Produits;
