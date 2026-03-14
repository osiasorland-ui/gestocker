import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from "lucide-react";
import {
  mouvementsUnifie,
  entreesStock,
  sortiesStock,
  ajustementsStock,
  products as productsService,
  warehouses as warehousesService,
  stocks,
  clients,
  fournisseurs,
  categories as categoriesService,
  transfers,
} from "../../config/auth";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../components/Notification";

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

// Import des composants d'onglets
import EntreeStock from './components/EntreeStock';
import SortieStock from './components/SortieStock';
import AjustementStock from './components/AjustementStock';
import TransfertStock from './components/TransfertStock';

function Mouvements() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [mouvements, setMouvements] = useState([]);
  const [entrees, setEntrees] = useState([]);
  const [sorties, setSorties] = useState([]);
  const [ajustements, setAjustements] = useState([]);
  const [transferts, setTransferts] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalEntrees: 0,
    totalSorties: 0,
    totalAjustements: 0,
    totalTransferts: 0,
    nombreMouvements: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("ENTREE"); // État pour les onglets
  const [filterType, setFilterType] = useState("tous");
  const [dateFilter, setDateFilter] = useState("");

  // Fonction de validation pour les champs numériques
  const validateNumberInput = (value) => {
    // Supprimer tous les caractères non numériques sauf le point décimal
    let numericValue = value.replace(/[^0-9.]/g, '');
    
    // S'assurer qu'il n'y a qu'un seul point décimal
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      numericValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // S'assurer que la valeur est positive
    if (numericValue.startsWith('-')) {
      numericValue = numericValue.substring(1);
    }
    
    return numericValue;
  };
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [warning, setWarning] = useState("");
  const [formData, setFormData] = useState({
    id_produit: "",
    id_entrepot: "",
    type_mvt: "ENTREE",
    quantite: "",
    motif: "",
    fournisseur_id: "",
    client_id: "",
    id_entrepot_dest: "", // Pour les transferts
  });

  // États pour la gestion du choix nouveau/ancien produit
  const [productChoice, setProductChoice] = useState("existing"); // "new" ou "existing"
  const [showProductModal, setShowProductModal] = useState(false);
  const [returnToMovementAfterProduct, setReturnToMovementAfterProduct] =
    useState(false);
  const [newProductForm, setNewProductForm] = useState({
    designation: "",
    prix_unitaire: "",
    id_categorie: "",
    id_entrepot: "",
    quantite_stock: "",
  });
  const [categories, setCategories] = useState([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!user?.id_entreprise) {
        throw new Error("Informations d'entreprise non disponibles");
      }

      const [
        mouvementsData,
        productsData,
        warehousesData,
        suppliersData,
        customersData,
        statsData,
        categoriesData,
      ] = await Promise.all([
        mouvementsUnifie.getAll(user.id_entreprise),
        productsService.getAll(user.id_entreprise),
        warehousesService.getAll(user.id_entreprise),
        fournisseurs.getAll(user.id_entreprise),
        clients.getAll(user.id_entreprise),
        mouvementsUnifie.getStats(user.id_entreprise, "month"),
        categoriesService.getAll(user.id_entreprise),
      ]);

      if (mouvementsData.error) throw mouvementsData.error;
      if (productsData.error) throw productsData.error;
      if (warehousesData.error) throw warehousesData.error;
      if (suppliersData.error) throw suppliersData.error;
      if (customersData.error) throw customersData.error;
      if (statsData.error) throw statsData.error;
      if (categoriesData.error) throw categoriesData.error;

      setMouvements(mouvementsData.data || []);
      // Séparer les mouvements par type
      const allMovements = mouvementsData.data || [];
      setEntrees(allMovements.filter(m => m.type_mvt === 'ENTREE'));
      setSorties(allMovements.filter(m => m.type_mvt === 'SORTIE'));
      setAjustements(allMovements.filter(m => m.type_mvt === 'AJUSTEMENT'));
      setTransferts(allMovements.filter(m => m.type_mvt === 'TRANSFERT'));
      setProducts(productsData.data || []);
      setWarehouses(warehousesData.data || []);
      setSuppliers(suppliersData.data || []);
      setCustomers(customersData.data || []);
      setCategories(categoriesData.data || []);
      setStats(
        statsData.data || {
          totalEntrees: 0,
          totalSorties: 0,
          totalAjustements: 0,
          totalTransferts: 0,
          nombreMouvements: 0,
        },
      );
    } catch (err) {
      setError(err.message);
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id_entreprise]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les produits par entrepôt sélectionné avec vérification de sécurité
  const filteredProducts = useMemo(() => {
    if (!formData.id_entrepot) {
      return []; // Si aucun entrepôt sélectionné, retourner une liste vide
    }
    return products.filter(product => {
      // Vérifier que le produit a bien un entrepôt valide
      if (!product.id_entrepot) return false;
      return product.id_entrepot === formData.id_entrepot;
    });
  }, [products, formData.id_entrepot]);

  // Filtrer les mouvements par type et par onglet actif
  const filteredMouvements = useMemo(() => {
    const relevantMovements = activeTab === 'ENTREE' ? entrees :
                           activeTab === 'SORTIE' ? sorties :
                           activeTab === 'AJUSTEMENT' ? ajustements :
                           transferts;
    
    return relevantMovements.filter((mouvement) => {
      const matchesSearch =
        mouvement.produits?.designation
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        mouvement.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mouvement.produits?.sku
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const dateField = mouvement.date_entree || mouvement.date_sortie || 
                       mouvement.date_ajustement || mouvement.date_transfert;
      const matchesDate =
        !dateFilter ||
        new Date(dateField).toISOString().split("T")[0] === dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [entrees, sorties, ajustements, transferts, searchTerm, activeTab, dateFilter]);

  // Gérer le changement d'onglet
  const handleTabChange = (tabType) => {
    setActiveTab(tabType);
    setFormData(prev => ({ ...prev, type_mvt: tabType }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!user?.id_entreprise) {
        throw new Error("Informations d'entreprise non disponibles");
      }

      // Utiliser le type de mouvement de l'onglet actif
      const movementType = activeTab;
      let result;

      // Validation spécifique selon le type de mouvement
      if (movementType === "TRANSFERT" && !formData.id_entrepot_dest) {
        throw new Error("L'entrepôt destination est requis pour les transferts");
      }

      if ((movementType === "SORTIE" || movementType === "ENTREE") && !formData.id_produit) {
        throw new Error("Le produit est requis pour les mouvements");
      }

      // Préparer les données selon le type de mouvement
      switch (movementType) {
        case "ENTREE":
          const entreeData = {
            id_produit: formData.id_produit,
            id_entrepot: formData.id_entrepot,
            quantite: parseInt(formData.quantite),
            motif: formData.motif,
            id_entreprise: user.id_entreprise,
            id_user: user.id_user,
            ...(formData.fournisseur_id && { id_fournisseur: formData.fournisseur_id }),
            ...(formData.prix_unitaire && { prix_unitaire: parseFloat(formData.prix_unitaire) })
          };
          result = await entreesStock.create(entreeData);
          break;

        case "SORTIE":
          const sortieData = {
            id_produit: formData.id_produit,
            id_entrepot: formData.id_entrepot,
            quantite: parseInt(formData.quantite),
            motif: formData.motif,
            id_entreprise: user.id_entreprise,
            id_user: user.id_user,
            ...(formData.client_id && { id_client: formData.client_id }),
            ...(formData.prix_unitaire && { prix_unitaire: parseFloat(formData.prix_unitaire) })
          };
          result = await sortiesStock.create(sortieData);
          break;

        case "AJUSTEMENT":
          const quantite = parseInt(formData.quantite);
          const ajustementData = {
            id_produit: formData.id_produit,
            id_entrepot: formData.id_entrepot,
            type_ajustement: quantite > 0 ? "AUGMENTATION" : "DIMINUTION",
            quantite: quantite,
            quantite_absolue: Math.abs(quantite),
            motif: formData.motif,
            id_entreprise: user.id_entreprise,
            id_user: user.id_user
          };
          result = await ajustementsStock.create(ajustementData);
          break;

        case "TRANSFERT":
          const transfertData = {
            id_produit: formData.id_produit,
            id_entrepot_source: formData.id_entrepot,
            id_entrepot_dest: formData.id_entrepot_dest,
            quantite: parseInt(formData.quantite),
            id_entreprise: user.id_entreprise,
            id_user: user.id_user,
            date_transfert: new Date().toISOString()
          };
          result = await transfers.create(transfertData);
          break;

        default:
          throw new Error("Type de mouvement non valide");
      }

      if (result.error) {
        throw new Error(result.error.message || "Erreur lors de la création du mouvement");
      }

      showSuccess(`${movementType === "ENTREE" ? "Entrée" : movementType === "SORTIE" ? "Sortie" : movementType === "AJUSTEMENT" ? "Ajustement" : "Transfert"} créé avec succès`);
      
      // Réinitialiser le formulaire
      resetForm();
      setShowAddModal(false);

      // Recharger les données
      loadData();
    } catch (err) {
      setError(err.message || "Erreur lors de l'enregistrement du mouvement");
      console.error("Erreur lors de l'enregistrement du mouvement:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Fonction pour créer un nouveau produit
  const createNewProduct = async () => {
    try {
      if (!user?.id_entreprise) {
        throw new Error("Informations d'entreprise non disponibles");
      }

      // Validation du formulaire du nouveau produit
      if (!newProductForm.designation || !newProductForm.id_entrepot) {
        throw new Error(
          "Veuillez remplir tous les champs obligatoires du produit",
        );
      }

      // Générer SKU uniquement
      const sku = `PRD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const productData = {
        designation: newProductForm.designation,
        prix_unitaire: parseFloat(newProductForm.prix_unitaire) || 0,
        id_categorie: newProductForm.id_categorie || null,
        id_entrepot: newProductForm.id_entrepot,
        sku: sku,
        id_entreprise: user.id_entreprise,
        quantite_stock: parseInt(newProductForm.quantite_stock) || 0,
      };

      const { data, error } = await productsService.create(productData);
      if (error) throw error;

      // Ajouter le nouveau produit à la liste locale
      setProducts((prev) => [...prev, data]);

      // Réinitialiser le formulaire du nouveau produit
      setNewProductForm({
        designation: "",
        prix_unitaire: "",
        id_categorie: "",
        id_entrepot: "",
        quantite_stock: "",
      });

      setShowProductModal(false);

      // Si on doit retourner au mouvement, pré-sélectionner le produit et rouvrir le modal
      if (returnToMovementAfterProduct) {
        setFormData((prev) => ({ ...prev, id_produit: data.id_produit }));
        setProductChoice("existing");
        setReturnToMovementAfterProduct(false);
        setShowAddModal(true);
      }

      showSuccess("Nouveau produit créé avec succès!");
      return data;
    } catch (err) {
      showError(err.message || "Erreur lors de la création du produit");
      throw err;
    }
  };

  // Gérer le choix de nouveau produit
  const handleNewProductChoice = () => {
    setReturnToMovementAfterProduct(true);
    setShowAddModal(false);
    setShowProductModal(true);
  };

  const resetForm = () => {
    setFormData({
      id_produit: "",
      id_entrepot: "",
      type_mvt: activeTab, // Utiliser l'onglet actif
      quantite: "",
      motif: "",
      fournisseur_id: "",
      client_id: "",
      id_entrepot_dest: "",
    });
    setProductChoice("existing");
    setReturnToMovementAfterProduct(false);
    setNewProductForm({
      designation: "",
      prix_unitaire: "",
      id_categorie: "",
      id_entrepot: "",
      quantite_stock: "",
    });
    setShowAddModal(false);
    setShowProductModal(false);
    setError("");
    setWarning("");
  };

  const getTypeIcon = (type) => {
    return type === "ENTREE" ? (
      <ArrowDownLeft className="w-4 h-4 text-green-600" />
    ) : type === "SORTIE" ? (
      <ArrowUpRight className="w-4 h-4 text-red-600" />
    ) : type === "TRANSFERT" ? (
      <ArrowRightLeft className="w-4 h-4 text-purple-600" />
    ) : (
      <Package className="w-4 h-4 text-blue-600" />
    );
  };

  const getTypeColor = (type) => {
    return type === "ENTREE"
      ? "text-green-600 bg-green-50"
      : type === "SORTIE"
        ? "text-red-600 bg-red-50"
        : type === "TRANSFERT"
          ? "text-purple-600 bg-purple-50"
          : "text-blue-600 bg-blue-50";
  };

  return (
    <div className="space-y-6 mx-auto p-5">
      {/* Messages d'alerte */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">  
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {warning && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">  
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">{warning}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-5 text-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mouvements de Stock
          </h1>
          <p className="text-gray-600">
            Suivez les entrées et sorties de produits
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex w-full">
          <button
            onClick={() => handleTabChange("ENTREE")}
            className={`flex-1 py-2 px-1 border-b-4 font-medium text-sm ${
              activeTab === "ENTREE"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowDownLeft className="w-4 h-4" />
              Entrée de stock
            </div>
          </button>

          <button
            onClick={() => handleTabChange("SORTIE")}
            className={`flex-1 py-2 px-1 border-b-4 font-medium text-sm ${
              activeTab === "SORTIE"
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Sortie de stock
            </div>
          </button>

          <button
            onClick={() => handleTabChange("AJUSTEMENT")}
            className={`flex-1 py-2 px-1 border-b-4 font-medium text-sm ${
              activeTab === "AJUSTEMENT"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              Ajustement de stock
            </div>
          </button>

          <button
            onClick={() => handleTabChange("TRANSFERT")}
            className={`flex-1 py-2 px-1 border-b-4 font-medium text-sm ${
              activeTab === "TRANSFERT"
                ? "border-purple-500 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Transfert de stock
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
        {activeTab === "ENTREE" && (
          <EntreeStock
            movements={entrees}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            stats={stats}
            filteredMouvements={filteredMouvements}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
          />
        )}

        {activeTab === "SORTIE" && (
          <SortieStock
            movements={sorties}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            stats={stats}
            filteredMouvements={filteredMouvements}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
          />
        )}

        {activeTab === "AJUSTEMENT" && (
          <AjustementStock
            movements={ajustements}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            stats={stats}
            filteredMouvements={filteredMouvements}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
          />
        )}

        {activeTab === "TRANSFERT" && (
          <TransfertStock
            movements={transferts}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            stats={stats}
            filteredMouvements={filteredMouvements}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
          />
        )}

      {/* Add Movement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === "ENTREE" && "Nouvelle Entrée de Stock"}
                {activeTab === "SORTIE" && "Nouvelle Sortie de Stock"}
                {activeTab === "AJUSTEMENT" && "Nouvel Ajustement de Stock"}
                {activeTab === "TRANSFERT" && "Nouveau Transfert de Stock"}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <form
                id="movement-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {activeTab === "ENTREE" && (
                  <>
                    {/* Entrepôt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrepôt *
                      </label>
                      <select
                        required
                        value={formData.id_entrepot}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_entrepot: e.target.value,
                            id_produit: "", // Réinitialiser le produit quand on change d'entrepôt
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner un entrepôt</option>
                        {warehouses.map((warehouse) => (
                          <option
                            key={warehouse.id_entrepot}
                            value={warehouse.id_entrepot}
                          >
                            {warehouse.nom_entrepot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Produit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produit *
                      </label>
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <select
                            required
                            value={formData.id_produit}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                id_produit: e.target.value,
                              })
                            }
                            disabled={!formData.id_entrepot}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              {!formData.id_entrepot ? "Sélectionnez d'abord un entrepôt" : "Sélectionner un produit"}
                            </option>
                            {filteredProducts.map((product) => (
                              <option
                                key={product.id_produit}
                                value={product.id_produit}
                              >
                                {product.designation} ({product.sku})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleNewProductChoice}
                            disabled={!formData.id_entrepot}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Nouveau
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formData.id_entrepot 
                            ? `Affichage des produits de l'entrepôt sélectionné (${filteredProducts.length} produit(s))`
                            : "Sélectionnez d'abord un entrepôt pour voir les produits disponibles"
                          } ou créez un nouveau produit avec le bouton "Nouveau"
                        </p>
                      </div>
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantite}
                        onChange={(e) => {
                          const validatedValue = validateNumberInput(e.target.value);
                          setFormData({
                            ...formData,
                            quantite: validatedValue,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Quantité à entrer"
                      />
                    </div>

                    {/* Fournisseur */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fournisseur
                      </label>
                      <select
                        value={formData.fournisseur_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fournisseur_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Sélectionner un fournisseur</option>
                        {suppliers.map((supplier) => (
                          <option
                            key={supplier.id_fournisseur}
                            value={supplier.id_fournisseur}
                          >
                            {supplier.nom_fournisseur}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Motif */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motif *
                      </label>
                      <textarea
                        required
                        value={formData.motif}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motif: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        rows="3"
                        placeholder="Motif de l'entrée de stock"
                      />
                    </div>
                  </>
                )}

                {activeTab === "SORTIE" && (
                  <>
                    {/* Entrepôt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrepôt *
                      </label>
                      <select
                        required
                        value={formData.id_entrepot}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_entrepot: e.target.value,
                            id_produit: "", // Réinitialiser le produit quand on change d'entrepôt
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Sélectionner un entrepôt</option>
                        {warehouses.map((warehouse) => (
                          <option
                            key={warehouse.id_entrepot}
                            value={warehouse.id_entrepot}
                          >
                            {warehouse.nom_entrepot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Produit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produit *
                      </label>
                      <select
                        required
                        value={formData.id_produit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_produit: e.target.value,
                          })
                        }
                        disabled={!formData.id_entrepot}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.id_entrepot ? "Sélectionnez d'abord un entrepôt" : "Sélectionner un produit"}
                        </option>
                        {formData.id_entrepot && products.filter(product => product.id_entrepot === formData.id_entrepot).map((product) => (
                          <option
                            key={product.id_produit}
                            value={product.id_produit}
                          >
                            {product.designation} ({product.sku}) - Stock: {product.quantite_disponible || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantite}
                        onChange={(e) => {
                          const validatedValue = validateNumberInput(e.target.value);
                          setFormData({
                            ...formData,
                            quantite: validatedValue,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Quantité à sortir"
                      />
                    </div>

                    {/* Client */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client
                      </label>
                      <select
                        value={formData.client_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            client_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Sélectionner un client</option>
                        {customers.map((customer) => (
                          <option
                            key={customer.id_client}
                            value={customer.id_client}
                          >
                            {customer.nom} {customer.prenom}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Motif */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motif *
                      </label>
                      <textarea
                        required
                        value={formData.motif}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motif: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        rows="3"
                        placeholder="Motif de la sortie de stock"
                      />
                    </div>
                  </>
                )}

                {activeTab === "AJUSTEMENT" && (
                  <>
                    {/* Entrepôt */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrepôt *
                      </label>
                      <select
                        required
                        value={formData.id_entrepot}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_entrepot: e.target.value,
                            id_produit: "", // Réinitialiser le produit quand on change d'entrepôt
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner un entrepôt</option>
                        {warehouses.map((warehouse) => (
                          <option
                            key={warehouse.id_entrepot}
                            value={warehouse.id_entrepot}
                          >
                            {warehouse.nom_entrepot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Produit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produit *
                      </label>
                      <select
                        required
                        value={formData.id_produit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_produit: e.target.value,
                          })
                        }
                        disabled={!formData.id_entrepot}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.id_entrepot ? "Sélectionnez d'abord un entrepôt" : "Sélectionner un produit"}
                        </option>
                        {formData.id_entrepot && products.filter(product => product.id_entrepot === formData.id_entrepot).map((product) => (
                          <option
                            key={product.id_produit}
                            value={product.id_produit}
                          >
                            {product.designation} ({product.sku}) - Stock: {product.quantite_disponible || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type d'ajustement */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type d'ajustement *
                      </label>
                      <select
                        required
                        value={formData.quantite > 0 ? "PLUS" : "MOINS"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            quantite: e.target.value === "PLUS" ? "1" : "-1",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="PLUS">Augmentation (+)</option>
                        <option value="MOINS">Diminution (-)</option>
                      </select>
                    </div>

                    {/* Quantité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={Math.abs(formData.quantite)}
                        onChange={(e) => {
                          const validatedValue = validateNumberInput(e.target.value);
                          setFormData({
                            ...formData,
                            quantite: validatedValue,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Quantité à ajuster"
                      />
                    </div>

                    {/* Motif */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motif *
                      </label>
                      <textarea
                        required
                        value={formData.motif}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motif: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows="3"
                        placeholder="Motif de l'ajustement de stock"
                      />
                    </div>
                  </>
                )}

                {activeTab === "TRANSFERT" && (
                  <>
                    {/* Entrepôt source */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrepôt source *
                      </label>
                      <select
                        required
                        value={formData.id_entrepot}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_entrepot: e.target.value,
                            id_produit: "", // Réinitialiser le produit quand on change d'entrepôt
                            id_entrepot_dest: "", // Réinitialiser aussi la destination
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Sélectionner l'entrepôt source</option>
                        {warehouses.map((warehouse) => (
                          <option
                            key={warehouse.id_entrepot}
                            value={warehouse.id_entrepot}
                          >
                            {warehouse.nom_entrepot}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Produit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Produit *
                      </label>
                      <select
                        required
                        value={formData.id_produit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_produit: e.target.value,
                          })
                        }
                        disabled={!formData.id_entrepot}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.id_entrepot ? "Sélectionnez d'abord l'entrepôt source" : "Sélectionner un produit"}
                        </option>
                        {formData.id_entrepot && products.filter(product => product.id_entrepot === formData.id_entrepot).map((product) => (
                          <option
                            key={product.id_produit}
                            value={product.id_produit}
                          >
                            {product.designation} ({product.sku}) - Stock: {product.quantite_disponible || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Entrepôt destination */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrepôt destination *
                      </label>
                      <select
                        required
                        value={formData.id_entrepot_dest}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_entrepot_dest: e.target.value,
                          })
                        }
                        disabled={!formData.id_entrepot}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {!formData.id_entrepot ? "Sélectionnez d'abord l'entrepôt source" : "Sélectionner l'entrepôt destination"}
                        </option>
                        {warehouses
                          .filter(w => w.id_entrepot !== formData.id_entrepot)
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

                    {/* Quantité */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.quantite}
                        onChange={(e) => {
                          const validatedValue = validateNumberInput(e.target.value);
                          setFormData({
                            ...formData,
                            quantite: validatedValue,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Quantité à transférer"
                      />
                    </div>

                    {/* Motif */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motif *
                      </label>
                      <textarea
                        required
                        value={formData.motif}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            motif: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows="3"
                        placeholder="Motif du transfert de stock"
                      />
                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Boutons d'action fixes en bas */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  form="movement-form"
                  disabled={submitting}
                  className={`px-4 py-2 text-sm text-white rounded hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                    activeTab === "ENTREE" ? "bg-green-600 hover:bg-green-700" :
                    activeTab === "SORTIE" ? "bg-red-600 hover:bg-red-700" :
                    activeTab === "AJUSTEMENT" ? "bg-blue-600 hover:bg-blue-700" :
                    "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      {activeTab === "ENTREE" && "Enregistrer l'entrée"}
                      {activeTab === "SORTIE" && "Enregistrer la sortie"}
                      {activeTab === "AJUSTEMENT" && "Enregistrer l'ajustement"}
                      {activeTab === "TRANSFERT" && "Enregistrer le transfert"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour créer un nouveau produit */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Ajouter un produit</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createNewProduct();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Désignation *
                </label>
                <input
                  type="text"
                  required
                  value={newProductForm.designation}
                  onChange={(e) =>
                    setNewProductForm({
                      ...newProductForm,
                      designation: e.target.value,
                    })
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
                    value={newProductForm.id_categorie}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        id_categorie: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
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
                    value={newProductForm.id_entrepot || ""}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        id_entrepot: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un entrepôt</option>
                    {warehouses.map((warehouse) => (
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
                  value={newProductForm.quantite_stock}
                  onChange={(e) => {
                    const validatedValue = validateNumberInput(e.target.value);
                    setNewProductForm({
                      ...newProductForm,
                      quantite_stock: validatedValue,
                    });
                  }}
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
                  value={newProductForm.prix_unitaire}
                  onChange={(e) => {
                    const validatedValue = validateNumberInput(e.target.value);
                    setNewProductForm({
                      ...newProductForm,
                      prix_unitaire: validatedValue,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    setNewProductForm({
                      designation: "",
                      prix_unitaire: "",
                      id_categorie: "",
                      id_entrepot: "",
                      quantite_stock: "",
                    });
                    // Retourner au formulaire de mouvement si on vient de là
                    if (returnToMovementAfterProduct) {
                      setReturnToMovementAfterProduct(false);
                      setShowAddModal(true);
                    }
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mouvements;
