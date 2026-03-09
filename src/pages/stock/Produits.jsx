import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { products, warehouses, categories } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useDevise } from "../../hooks/useDevise.js";
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
  TrendingUp,
  Building,
  Tag,
  X,
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
  const { profile } = useAuth();
  const { formatMontant } = useDevise();
  const { notify } = useNotification();
  const [produits, setProduits] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState("");
  const [selectedBulkWarehouse, setSelectedBulkWarehouse] = useState("");
  const [bulkProducts, setBulkProducts] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const showErrorRef = useRef(notify);
  showErrorRef.current = notify;

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

  // Générer un SKU aléatoire pour la colonne SKU
  const generateSKU = () => {
    const prefix = "PRD";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
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
    // Si le SKU commence par PR et est au bon format, l'utiliser directement
    if (
      produit.sku &&
      produit.sku.startsWith("PR") &&
      produit.sku.length === 7
    ) {
      return produit.sku;
    }
    // Fallback pour les anciens formats
    return produit.sku || "N/A";
  };

  // Charger les données depuis la base de données
  const loadData = useCallback(async () => {
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
      const errorMessage =
        err.message || "Erreur lors du chargement des données";
      setError(errorMessage);
      // Utiliser la référence pour éviter la dépendance cyclique
      showErrorRef.current("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, [profile?.id_entreprise]); // ❌ Retirer notify.error des dépendances

  // Charger les données depuis la base de données
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Générer un SKU automatiquement lors de l'ouverture du modal
  useEffect(() => {
    if (showAddModal && !editingProduit) {
      // Le SKU sera généré automatiquement lors de la soumission
    }
  }, [showAddModal, editingProduit]);

  const filteredProduits = useMemo(() => {
    return produits.filter(
      (produit) =>
        produit.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        produit.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [produits, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id_entreprise) {
      notify.error("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    if (!formData.designation?.trim()) {
      notify.error("La désignation est obligatoire");
      return;
    }

    if (!formData.prix_unitaire || formData.prix_unitaire <= 0) {
      notify.error("Le prix unitaire doit être supérieur à 0");
      return;
    }

    if (!formData.quantite_stock || formData.quantite_stock < 0) {
      notify.error("La quantité en stock doit être supérieure ou égale à 0");
      return;
    }

    if (!formData.id_entrepot) {
      notify.error("Veuillez sélectionner un entrepôt");
      return;
    }

    try {
      // Générer le SKU aléatoire pour la colonne SKU
      const sku = generateSKU();

      // Sauvegarder l'ancienne catégorie pour la mise à jour des compteurs
      const oldCategoryId = editingProduit?.id_categorie;
      const newCategoryId = formData.id_categorie || null;

      const productData = {
        designation: formData.designation.trim(),
        // SKU aléatoire pour la colonne SKU
        sku: editingProduit ? editingProduit.sku : sku,
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

      notify.success(
        editingProduit
          ? "Produit modifié avec succès"
          : "Produit ajouté avec succès",
      );
    } catch (err) {
      notify.error(err.message || "Erreur lors de la sauvegarde du produit");
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

  // Traiter l'ajout en masse de produits
  const handleBulkAddProducts = async () => {
    if (!selectedBulkCategory) {
      notify.error("Veuillez sélectionner une catégorie pour les produits");
      return;
    }

    if (!selectedBulkWarehouse) {
      notify.error("Veuillez sélectionner un entrepôt pour les produits");
      return;
    }

    if (!bulkProducts.trim()) {
      notify.error("Veuillez entrer au moins un produit");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const lines = bulkProducts
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      const productsToInsert = [];

      for (const line of lines) {
        // Format: designation,prix_unitaire,quantite_stock
        const parts = line.split(",").map((part) => part.trim());

        if (parts.length < 2) {
          console.warn(`Ligne ignorée (format incorrect): ${line}`);
          continue;
        }

        const designation = parts[0];
        const prix_unitaire = parseFloat(parts[1]) || 0;
        const quantite_stock = parts[2] ? parseInt(parts[2]) || 0 : 0;

        if (!designation) {
          console.warn(`Ligne ignorée (désignation vide): ${line}`);
          continue;
        }

        // Générer un SKU aléatoire pour la colonne SKU
        const sku = generateSKU();

        productsToInsert.push({
          sku: sku,
          designation: designation,
          prix_unitaire: prix_unitaire,
          id_categorie: selectedBulkCategory,
          id_entrepot: selectedBulkWarehouse,
          quantite_stock: quantite_stock,
          id_entreprise: profile.id_entreprise,
        });
      }

      if (productsToInsert.length === 0) {
        notify.error("Aucun produit valide à ajouter");
        return;
      }

      // Insérer les produits en masse
      const { error } = await products.bulkInsert(productsToInsert);

      if (error) {
        console.error("Erreur lors de l'ajout en masse:", error);
        notify.error(`Erreur lors de l'ajout: ${error.message}`);
      } else {
        notify.success(
          `${productsToInsert.length} produit(s) ajouté(s) avec succès!`,
        );
        setShowBulkAddModal(false);
        setSelectedBulkCategory("");
        setSelectedBulkWarehouse("");
        setBulkProducts("");
        loadData(); // Rafraîchir la liste
      }
    } catch (error) {
      console.error("Erreur dans handleBulkAddProducts:", error);
      notify.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
      notify.error("Veuillez sélectionner un fichier CSV ou Excel valide");
    }
  };

  const handleImportCSV = () => {
    if (!csvFile) {
      notify.error("Veuillez sélectionner un fichier");
      return;
    }

    // Simulation de l'importation
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      // const headers = lines[0].split(",");

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
      notify.success(`${newProducts.length} produits importés avec succès`);
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
      notify.success("Produit supprimé avec succès");
    } catch (err) {
      notify.error(err.message || "Erreur lors de la suppression du produit");
    }
  };

  return (
    <div className="space-y-6 mx-auto p-10">
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
            onClick={() => setShowBulkAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Package className="w-4 h-4" />
            Ajout en masse
          </button>
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                    {produits.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <Tag className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Catégories
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {categoriesList.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Building className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Entrepôts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {warehousesList.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                          {formatMontant(produit.prix_unitaire)}
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

      {/* Modal Ajout en masse de produits */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Ajout en masse de produits
              </h2>
              <button
                onClick={() => {
                  setShowBulkAddModal(false);
                  setSelectedBulkCategory("");
                  setSelectedBulkWarehouse("");
                  setBulkProducts("");
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Sélection de la catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie des produits *
                </label>
                <select
                  value={selectedBulkCategory}
                  onChange={(e) => setSelectedBulkCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categoriesList.map((category) => (
                    <option
                      key={category.id_categorie}
                      value={category.id_categorie}
                    >
                      {category.nom_categorie}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection de l'entrepôt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entrepôt des produits *
                </label>
                <select
                  value={selectedBulkWarehouse}
                  onChange={(e) => setSelectedBulkWarehouse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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

              {/* Instructions */}
              {selectedBulkCategory && selectedBulkWarehouse && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Instructions de formatage
                  </h3>
                  <p className="text-sm text-blue-800">
                    Entrez chaque produit sur une ligne séparée au format :
                  </p>
                  <code className="block mt-2 text-xs bg-blue-100 p-2 rounded">
                    designation,prix_unitaire,quantite_stock
                  </code>
                  <p className="text-xs text-blue-600 mt-2">
                    Exemple : "Ordinateur Portable,750000,10"
                  </p>
                </div>
              )}

              {/* Zone de texte pour la liste */}
              {selectedBulkCategory && selectedBulkWarehouse && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Liste des produits *
                  </label>
                  <textarea
                    value={bulkProducts}
                    onChange={(e) => setBulkProducts(e.target.value)}
                    placeholder="Entrez la liste des produits au format CSV..."
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {
                      bulkProducts.split("\n").filter((line) => line.trim())
                        .length
                    }{" "}
                    produit(s) détecté(s)
                  </p>
                </div>
              )}

              {/* Boutons d'action */}
              {selectedBulkCategory && selectedBulkWarehouse && (
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setSelectedBulkCategory("");
                      setSelectedBulkWarehouse("");
                      setBulkProducts("");
                      setError("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBulkAddProducts}
                    disabled={loading || !bulkProducts.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <Package className="w-4 h-4 mr-2" />
                        Ajouter{" "}
                        {
                          bulkProducts.split("\n").filter((line) => line.trim())
                            .length
                        }{" "}
                        produit(s)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Notification />
    </div>
  );
}

export default Produits;
