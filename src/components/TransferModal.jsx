import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Package,
  Building2,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
import { transfers } from "../config/transfers";
import { products } from "../config/products";
import { warehouses } from "../config/warehouses";
import { categories } from "../config/categories";
import { useAuth } from "../hooks/useAuthHook.js";

// Import des composants UI
import Button from "./ui/Button";
import Input from "./ui/Input";
import Loader from "./ui/Loader";

const TransferModal = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [warehousesList, setWarehousesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    id_produit: "",
    id_entrepot_source: "",
    id_entrepot_dest: "",
    quantite: "",
  });

  const [availableStock, setAvailableStock] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryExistsInDest, setCategoryExistsInDest] = useState(true);
  const [productExistsInDest, setProductExistsInDest] = useState(true);

  // Charger les produits, entrepôts et catégories
  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id_entreprise || !isOpen) return;

      try {
        const [productsResult, warehousesResult, categoriesResult] =
          await Promise.all([
            products.getAll(profile.id_entreprise),
            warehouses.getAll(profile.id_entreprise),
            categories.getAll(profile.id_entreprise),
          ]);

        if (!productsResult.error) {
          setProductsList(productsResult.data || []);
        }
        if (!warehousesResult.error) {
          setWarehousesList(warehousesResult.data || []);
        }
        if (!categoriesResult.error) {
          setCategoriesList(categoriesResult.data || []);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
      }
    };

    loadData();
  }, [profile?.id_entreprise, isOpen]);

  // Vérifier le stock disponible quand le produit et l'entrepôt source changent
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.id_produit || !profile?.id_entreprise) {
        setAvailableStock(0);
        setSelectedProduct(null);
        return;
      }

      try {
        // Lire le produit et vérifier sa disponibilité
        const product = productsList.find(
          (p) => p.id_produit === formData.id_produit,
        );

        if (product) {
          setSelectedProduct(product);
          setAvailableStock(product.quantite_stock || 0);
        } else {
          setAvailableStock(0);
          setSelectedProduct(null);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification du stock:", err);
        setAvailableStock(0);
        setSelectedProduct(null);
      }
    };

    checkAvailability();
  }, [formData.id_produit, productsList, profile?.id_entreprise]);

  // Vérifier si la catégorie et le produit existent dans l'entrepôt de destination
  useEffect(() => {
    const checkDestinationAvailability = () => {
      if (!selectedProduct || !formData.id_entrepot_dest) {
        setCategoryExistsInDest(true);
        setProductExistsInDest(true);
        return;
      }

      // Vérifier si la catégorie existe dans l'entrepôt de destination
      const categoryInDest = categoriesList.find(
        (cat) =>
          cat.id_categorie === selectedProduct.id_categorie &&
          cat.id_entrepot === formData.id_entrepot_dest,
      );
      setCategoryExistsInDest(!!categoryInDest);

      // Vérifier si le produit existe dans l'entrepôt de destination
      const productInDest = productsList.find(
        (p) =>
          p.designation === selectedProduct.designation &&
          p.id_entrepot === formData.id_entrepot_dest,
      );
      setProductExistsInDest(!!productInDest);
    };

    checkDestinationAvailability();
  }, [
    selectedProduct,
    formData.id_entrepot_dest,
    categoriesList,
    productsList,
  ]);

  // Réinitialiser l'entrepôt source quand le produit change
  useEffect(() => {
    if (formData.id_produit) {
      setFormData((prev) => ({
        ...prev,
        id_entrepot_source: "",
        id_entrepot_dest: "",
      }));
    }
  }, [formData.id_produit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validation
      if (
        !formData.id_produit ||
        !formData.id_entrepot_source ||
        !formData.id_entrepot_dest ||
        !formData.quantite
      ) {
        setError("Veuillez remplir tous les champs obligatoires");
        return;
      }

      if (formData.id_entrepot_source === formData.id_entrepot_dest) {
        setError("L'entrepôt source et destination doivent être différents");
        return;
      }

      const quantity = parseInt(formData.quantite);
      if (quantity <= 0) {
        setError("La quantité doit être supérieure à 0");
        return;
      }

      if (quantity > availableStock) {
        setError(`Stock insuffisant. Stock disponible: ${availableStock}`);
        return;
      }

      // Créer le transfert
      const transferData = {
        id_produit: formData.id_produit,
        id_entrepot_source: formData.id_entrepot_source,
        id_entrepot_dest: formData.id_entrepot_dest,
        quantite: quantity,
        id_user: profile.id_user,
        id_entreprise: profile.id_entreprise,
      };

      const { data, error } = await transfers.create(transferData);

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(`Transfert de ${quantity} unités effectué avec succès!`);

      // Réinitialiser le formulaire
      setFormData({
        id_produit: "",
        id_entrepot_source: "",
        id_entrepot_dest: "",
        quantite: "",
      });

      // Notifier le parent
      console.log("Appel de onSuccess avec les données:", data);
      if (onSuccess) {
        onSuccess(data);
      }

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Transférer du stock
              </h2>
              <p className="text-sm text-gray-600">
                Déplacez des produits entre vos entrepôts
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Produit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Produit à transférer *
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={formData.id_produit}
                onChange={(e) =>
                  setFormData({ ...formData, id_produit: e.target.value })
                }
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Sélectionner un produit</option>
                {productsList.map((product) => (
                  <option key={product.id_produit} value={product.id_produit}>
                    {product.designation} - Stock: {product.quantite_stock || 0}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Entrepôts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Entrepôt source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrepôt source *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.id_entrepot_source}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_entrepot_source: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={!formData.id_produit}
                >
                  <option value="">
                    {formData.id_produit
                      ? "Entrepôt source"
                      : "Sélectionnez d'abord un produit"}
                  </option>
                  {warehousesList
                    .filter((warehouse) => {
                      // Filtrer pour n'afficher que les entrepôts où le produit sélectionné existe avec un stock > 0
                      const productInWarehouse = productsList.find(
                        (p) =>
                          p.id_produit === formData.id_produit &&
                          p.id_entrepot === warehouse.id_entrepot,
                      );
                      return (
                        productInWarehouse &&
                        productInWarehouse.quantite_stock > 0
                      );
                    })
                    .map((warehouse) => (
                      <option
                        key={warehouse.id_entrepot}
                        value={warehouse.id_entrepot}
                      >
                        {warehouse.nom_entrepot}
                      </option>
                    ))}
                </select>
              </div>
              {formData.id_produit &&
                warehousesList.filter((warehouse) => {
                  const productInWarehouse = productsList.find(
                    (p) =>
                      p.id_produit === formData.id_produit &&
                      p.id_entrepot === warehouse.id_entrepot,
                  );
                  return (
                    productInWarehouse && productInWarehouse.quantite_stock > 0
                  );
                }).length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    ⚠️ Ce produit n'existe dans aucun entrepôt avec un stock
                    disponible
                  </p>
                )}
            </div>

            {/* Entrepôt destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entrepôt destination *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.id_entrepot_dest}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id_entrepot_dest: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Entrepôt destination</option>
                  {warehousesList
                    .filter(
                      (w) => w.id_entrepot !== formData.id_entrepot_source,
                    )
                    .map((warehouse) => (
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
          </div>

          {/* Informations de stock et validation de destination */}
          {formData.id_produit && formData.id_entrepot_source && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Stock disponible
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {availableStock} unités
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Dans l'entrepôt source sélectionné
                </p>
              </div>

              {formData.id_entrepot_dest && (
                <div
                  className={`border rounded-lg p-4 ${
                    categoryExistsInDest && productExistsInDest
                      ? "bg-green-50 border-green-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Info
                      className={`w-5 h-5 ${
                        categoryExistsInDest && productExistsInDest
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        categoryExistsInDest && productExistsInDest
                          ? "text-green-900"
                          : "text-amber-900"
                      }`}
                    >
                      Validation de la destination
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          categoryExistsInDest ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          categoryExistsInDest
                            ? "text-green-800"
                            : "text-amber-800"
                        }`}
                      >
                        Catégorie:{" "}
                        {categoryExistsInDest
                          ? "✓ Existe dans l'entrepôt de destination"
                          : "⚠ Sera créée dans l'entrepôt de destination"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          productExistsInDest ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          productExistsInDest
                            ? "text-green-800"
                            : "text-amber-800"
                        }`}
                      >
                        Produit:{" "}
                        {productExistsInDest
                          ? "✓ Existe dans l'entrepôt de destination (stock sera ajouté)"
                          : "⚠ Sera créé dans l'entrepôt de destination"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantité à transférer *
            </label>
            <Input
              type="number"
              min="1"
              max={availableStock}
              value={formData.quantite}
              onChange={(e) =>
                setFormData({ ...formData, quantite: e.target.value })
              }
              placeholder="Entrez la quantité"
              required
            />
            {availableStock > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Maximum: {availableStock} unités disponibles
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading} loading={loading}>
              {loading ? "Transfert en cours..." : "Effectuer le transfert"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
