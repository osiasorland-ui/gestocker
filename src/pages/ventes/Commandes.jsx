import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ShoppingCart,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useNotification } from "../../hooks/useNotification";
import { useDevise } from "../../hooks/useDevise.js";
import Notification from "../../components/Notification";
import {
  orders,
  clients,
  products as productsService,
  stocks,
  mouvementsUnifie,
  sortiesStock,
} from "../../config/auth";

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

const Commandes = () => {
  const { user } = useAuth();
  const { formatMontant } = useDevise();
  const { showSuccess, showError, showWarning } = useNotification();
  
  // États principaux
  const [commandes, setCommandes] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("tous");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // États pour la gestion du choix nouveau/ancien client
  const [clientChoice, setClientChoice] = useState("existing");
  const [showClientModal, setShowClientModal] = useState(false);
  const [returnToCommandAfterClient, setReturnToCommandAfterClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: ""
  });
  const [errors, setErrors] = useState({});
  const [clientSubmitting, setClientSubmitting] = useState(false);
  const [currentReference, setCurrentReference] = useState("");
  const [formData, setFormData] = useState({
    id_client: "",
    statut: "EN_ATTENTE",
    produits: [],
    montant_total: 0,
    remarques: "",
    date_livraison: "",
  });
  
  // État pour la gestion des produits dans la commande
  const [commandeProducts, setCommandeProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Charger les données depuis la base de données
  const loadData = useCallback(async () => {
    if (!user?.id_entreprise) return;

    try {
      setLoading(true);
      setError("");

      const [commandesData, clientsData, productsData] = await Promise.all([
        orders.getAll(user.id_entreprise),
        clients.getAll(user.id_entreprise),
        productsService.getAll(user.id_entreprise),
      ]);

      if (commandesData.error) throw commandesData.error;
      if (clientsData.error) throw clientsData.error;
      if (productsData.error) throw productsData.error;

      setCommandes(commandesData.data || []);
      setClientsList(clientsData.data || []);
      setProductsList(productsData.data || []);
    } catch (err) {
      const errorMessage = err.message || "Erreur lors du chargement des données";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id_entreprise]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrer les commandes
  const filteredCommandes = useMemo(() => {
    return commandes.filter((commande) => {
      const matchesSearch =
        commande.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.clients?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        commande.clients?.prenom?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "tous" || commande.statut === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [commandes, searchTerm, filterStatus]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    return {
      total: commandes.length,
      en_attente: commandes.filter(c => c.statut === "EN_ATTENTE").length,
      valide: commandes.filter(c => c.statut === "VALIDE").length,
      annule: commandes.filter(c => c.statut === "ANNULE").length,
    };
  }, [commandes]);

  // Générer une référence de commande
  const generateReference = async () => {
    const date = new Date();
    const count = commandes.length + 1;
    return `CMD${String(count).padStart(6, '0')}`;
  };

  // Valider le numéro de téléphone
  const validatePhone = (phone) => {
    const phoneRegex = /^\+2290\d{8}$/;
    return phoneRegex.test(phone);
  };

  // Gérer l'ajout de produit à la commande
  const addProductToCommande = (product) => {
    const existingProduct = commandeProducts.find(p => p.id_produit === product.id_produit);
    
    if (existingProduct) {
      // Augmenter la quantité si le produit existe déjà
      const maxQuantity = product.quantite_stock || 0;
      const newQuantity = existingProduct.quantite + 1;
      
      if (newQuantity > maxQuantity) {
        showWarning(`Stock insuffisant. Maximum disponible: ${maxQuantity}`);
        return;
      }
      
      setCommandeProducts(prev => 
        prev.map(p => 
          p.id_produit === product.id_produit 
            ? { ...p, quantite: newQuantity, total: newQuantity * p.prix_unitaire }
            : p
        )
      );
    } else {
      // Ajouter le produit avec quantité 1
      if ((product.quantite_stock || 0) < 1) {
        showWarning("Produit en rupture de stock");
        return;
      }
      
      setCommandeProducts(prev => [...prev, {
        id_produit: product.id_produit,
        designation: product.designation,
        sku: product.sku,
        prix_unitaire: product.prix_unitaire,
        quantite: 1,
        total: product.prix_unitaire,
        stock_disponible: product.quantite_stock || 0,
      }]);
    }
  };

  // Gérer la suppression de produit de la commande
  const removeProductFromCommande = (productId) => {
    setCommandeProducts(prev => prev.filter(p => p.id_produit !== productId));
  };

  // Mettre à jour la quantité d'un produit
  const updateProductQuantity = (productId, newQuantity) => {
    const product = commandeProducts.find(p => p.id_produit === productId);
    if (!product) return;

    const maxQuantity = product.stock_disponible;
    const quantity = Math.min(Math.max(0, newQuantity), maxQuantity);

    if (quantity === 0) {
      removeProductFromCommande(productId);
    } else {
      setCommandeProducts(prev =>
        prev.map(p =>
          p.id_produit === productId
            ? { ...p, quantite: quantity, total: quantity * p.prix_unitaire }
            : p
        )
      );
    }
  };

  // Calculer le montant total
  const montantTotal = useMemo(() => {
    return commandeProducts.reduce((sum, product) => sum + product.total, 0);
  }, [commandeProducts]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      id_client: "",
      statut: "EN_ATTENTE",
      produits: [],
      montant_total: 0,
      remarques: "",
      date_livraison: "",
    });
    setCommandeProducts([]);
    setSelectedCommande(null);
    setShowAddModal(false);
    setShowDetailsModal(false);
    setClientChoice("existing");
    setNewClientForm({
      nom: "",
      prenom: "",
      telephone: "",
      email: ""
    });
    setErrors({});
    setCurrentReference("");
  };

  // Soumettre la commande
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id_entreprise) {
      showError("Utilisateur non connecté");
      return;
    }

    if (!formData.id_client) {
      showError("Veuillez sélectionner un client");
      return;
    }

    if (commandeProducts.length === 0) {
      showError("Veuillez ajouter au moins un produit");
      return;
    }

    try {
      setSubmitting(true);

      const orderData = {
        ...formData,
        reference: await generateReference(),
        id_user: user.id_user,
        id_entreprise: user.id_entreprise,
        montant_total: montantTotal,
        produits: commandeProducts.map(p => ({
          id_produit: p.id_produit,
          quantite: p.quantite,
          prix_unitaire: p.prix_unitaire,
          total: p.total,
        })),
      };

      const { data, error } = await orders.create(orderData);
      
      if (error) throw error;

      showSuccess("Commande créée avec succès");
      await loadData();
      resetForm();
    } catch (err) {
      showError(err.message || "Erreur lors de la création de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Si la commande est confirmée, créer les mouvements de stock
      if (newStatus === "confirmee") {
        const order = commandes.find(c => c.id_commande === orderId);
        if (order && order.produits) {
          for (const product of order.produits) {
            const sortieData = {
              id_produit: product.id_produit,
              id_entrepot: product.id_entrepot,
              quantite: product.quantite,
              motif: `Vente - Commande ${order.reference}`,
              id_client: order.id_client,
              id_user: user.id_user,
              id_entreprise: user.id_entreprise,
            };

            await sortiesStock.create(sortieData);
          }
        }
      }

      const { error } = await orders.update(orderId, { statut: newStatus });
      
      if (error) throw error;

      showSuccess("Statut de la commande mis à jour");
      await loadData();
    } catch (err) {
      showError(err.message || "Erreur lors de la mise à jour du statut");
    }
  };

  // Supprimer une commande
  const deleteOrder = async (orderId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      return;
    }

    try {
      const { error } = await orders.delete(orderId);
      
      if (error) throw error;

      showSuccess("Commande supprimée avec succès");
      await loadData();
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression de la commande");
    }
  };

  const getStatusBadge = (statut) => {
    const statusConfig = {
      EN_ATTENTE: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "En attente",
      },
      VALIDE: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Validée",
      },
      ANNULE: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Annulée",
      },
    };

    const config = statusConfig[statut] || statusConfig.EN_ATTENTE;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Gérer l'ouverture du modal
  const handleAddCommande = async () => {
    const ref = await generateReference();
    setCurrentReference(ref);
    setShowAddModal(true);
  };

  // Créer un nouveau client
  const createNewClient = async () => {
    const newErrors = {};
    
    if (!newClientForm.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }
    if (!newClientForm.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis";
    } else if (!validatePhone(newClientForm.telephone)) {
      newErrors.telephone = "Format invalide. Ex: +2290112345678";
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    try {
      setClientSubmitting(true);
      
      const clientData = {
        ...newClientForm,
        id_entreprise: user.id_entreprise
      };
      
      const { data, error } = await clients.create(clientData);
      if (error) throw error;
      
      // Ajouter le client à la liste
      setClientsList(prev => [...prev, data]);
      
      // Sélectionner le nouveau client
      setFormData(prev => ({ ...prev, id_client: data.id_client }));
      
      // Réinitialiser et fermer le formulaire client
      setNewClientForm({ nom: "", prenom: "", telephone: "", email: "" });
      setShowClientModal(false);
      setClientChoice("existing");
      
      showSuccess("Client créé avec succès");
      
      // Retour au formulaire de commande si nécessaire
      if (returnToCommandAfterClient) {
        setReturnToCommandAfterClient(false);
      }
      
    } catch (error) {
      showError(error.message || "Erreur lors de la création du client");
    } finally {
      setClientSubmitting(false);
    }
  };

  // Gérer le choix nouveau client
  const handleNewClientChoice = () => {
    setReturnToCommandAfterClient(true);
    setShowAddModal(false);
    setShowClientModal(true);
  };

  const handleEditCommande = (commande) => {
    setSelectedCommande(commande);
    setShowAddModal(true);
  };

  const handleDeleteCommande = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      setCommandes(commandes.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 mx-auto p-5">
      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">  
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-600 mt-1">Gestion des commandes clients</p>
        </div>
        <button
          onClick={handleAddCommande}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle commande
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.en_attente}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validées</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.valide}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Annulées</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.annule}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          >
            <option value="tous">Tous les statuts</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="VALIDE">Validée</option>
            <option value="ANNULE">Annulée</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
      </div>

      {/* Tableau des commandes */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des commandes...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCommandes.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucune commande trouvée</p>
                    </td>
                  </tr>
                ) : (
                  filteredCommandes.map((commande) => (
                    <tr key={commande.id_commande} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {commande.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {commande.clients?.nom} {commande.clients?.prenom}
                          </div>
                          <div className="text-xs text-gray-500">
                            {commande.clients?.telephone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          {formatMontant(commande.montant_total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Package className="w-4 h-4 text-gray-400" />
                          {commande.produits?.length || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(commande.statut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCommande(commande);
                              setShowDetailsModal(true);
                            }}
                            className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {commande.statut === "en_attente" && (
                            <button
                              onClick={() => updateOrderStatus(commande.id_commande, "confirmee")}
                              className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                              title="Confirmer"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteOrder(commande.id_commande)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
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

      {/* Modal Ajout/Modification */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedCommande ? "Modifier la commande" : "Nouvelle commande"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Référence
                </label>
                <input
                  type="text"
                  value={currentReference}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  placeholder="CMD000001"
                />
                <p className="mt-1 text-xs text-gray-500">Générée automatiquement</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client *
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={formData.id_client}
                      onChange={(e) => setFormData(prev => ({ ...prev, id_client: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      required
                    >
                      <option value="">Sélectionner un client</option>
                      {clientsList.map((client) => (
                        <option key={client.id_client} value={client.id_client}>
                          {client.nom} {client.prenom} - {client.telephone}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleNewClientChoice}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 whitespace-nowrap flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (FCFA) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.montant_total || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, montant_total: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 pl-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    FCFA
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Le montant doit être supérieur à 0</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="VALIDE">Validée</option>
                  <option value="ANNULE">Annulée</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouveau Client */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nouveau Client</h2>
            <form onSubmit={(e) => { e.preventDefault(); createNewClient(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={newClientForm.nom}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, nom: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nom du client"
                  required
                />
                {errors.nom && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.nom}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={newClientForm.prenom}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, prenom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="Prénom du client"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={newClientForm.telephone}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, telephone: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                    errors.telephone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+2290112345678"
                  required
                />
                {errors.telephone && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.telephone}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Format: +2290112345678</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newClientForm.email}
                  onChange={(e) => setNewClientForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientModal(false);
                    if (returnToCommandAfterClient) {
                      setShowAddModal(true);
                      setReturnToCommandAfterClient(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={clientSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {clientSubmitting ? 'Création...' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {selectedCommande && !showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Détails de la commande
              </h2>
              <button
                onClick={() => setSelectedCommande(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence</p>
                  <p className="font-medium text-gray-900">
                    {selectedCommande.reference}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {selectedCommande.date}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Client</p>
                  <p className="font-medium text-gray-900">
                    {selectedCommande.client}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-900">
                    {selectedCommande.telephone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant</p>
                  <p className="font-medium text-gray-900">
                    {selectedCommande.montant.toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <div>{getStatusBadge(selectedCommande.statut)}</div>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Produits commandés</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Nombre de produits: {selectedCommande.produits}
                  </p>
                  {/* Ici vous pourriez afficher la liste des produits */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commandes;
