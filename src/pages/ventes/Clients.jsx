import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useNotification } from "../../hooks/useNotification";
import { clients } from "../../config/clients.js";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
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

const Clients = () => {
  const [clientsList, setClientsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("tous");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkClients, setBulkClients] = useState("");
  const [bulkClientType, setBulkClientType] = useState("particulier");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    type: "particulier",
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
  });

  // États pour la validation en temps réel
  const [fieldErrors, setFieldErrors] = useState({
    nom: false,
    prenom: false,
    telephone: false,
    email: false,
  });

  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  // Fonction de validation en temps réel
  const validateField = (fieldName, value) => {
    const trimmedValue = value.trim();
    let hasError = false;

    switch (fieldName) {
      case "nom":
        if (formData.type === "entreprise") {
          hasError = !trimmedValue;
        } else if (formData.type === "particulier") {
          hasError = !trimmedValue;
        }
        break;

      case "prenom":
        if (formData.type === "particulier") {
          hasError = !trimmedValue;
        }
        break;

      case "telephone":
        if (trimmedValue) {
          const phoneRegex = /^\+22901\d{8}$/;
          hasError = !phoneRegex.test(trimmedValue);
        } else if (
          formData.type === "entreprise" ||
          formData.type === "particulier"
        ) {
          hasError = true; // Obligatoire pour les deux types
        }
        break;

      case "email":
        if (trimmedValue) {
          const emailRegex =
            /^[A-Za-z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr)$/;
          hasError = !emailRegex.test(trimmedValue);
        } else if (
          formData.type === "entreprise" ||
          formData.type === "particulier"
        ) {
          hasError = true; // Obligatoire pour les deux types
        }
        break;

      default:
        break;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: hasError,
    }));

    return hasError;
  };

  // Gestionnaire de changement avec validation en temps réel
  const handleInputChange = (fieldName, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Valider le champ en temps réel
    validateField(fieldName, value);
  };

  const loadClients = useCallback(async () => {
    if (!profile?.entreprises?.id_entreprise) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { data, error } = await clients.getAll(
        profile.entreprises.id_entreprise,
      );

      if (error) {
        throw error;
      }

      setClientsList(data || []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des clients");
      showErrorRef.current(
        err.message || "Erreur lors du chargement des clients",
      );
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.entreprises?.id_entreprise) {
      loadClients();
    }
  }, [profile?.entreprises?.id_entreprise, loadClients]);

  // Statistiques calculées avec useMemo pour optimiser les performances
  const stats = useMemo(() => {
    const entreprises = clientsList.filter((c) => c.nom && !c.prenom).length;
    const particuliers = clientsList.filter((c) => c.prenom).length;
    const contactComplet = clientsList.filter(
      (c) => c.telephone && c.email,
    ).length;

    return {
      total: clientsList.length,
      entreprises,
      particuliers,
      contactComplet,
    };
  }, [clientsList]);

  const filteredClients = useMemo(() => {
    return clientsList.filter((client) => {
      const matchesSearch =
        (client.nom &&
          client.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.prenom &&
          client.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.email &&
          client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.telephone && client.telephone.includes(searchTerm));

      // Déterminer le type du client s'il n'est pas défini
      const clientType =
        client.type ||
        (client.nom && !client.prenom ? "entreprise" : "particulier");

      // Filtrer par type
      const matchesType = filterType === "tous" || clientType === filterType;

      return matchesSearch && matchesType;
    });
  }, [clientsList, searchTerm, filterType]);

  const getTypeBadge = (client) => {
    // Déterminer le type du client s'il n'est pas défini
    const clientType =
      client.type ||
      (client.nom && !client.prenom ? "entreprise" : "particulier");

    const typeConfig = {
      entreprise: {
        color: "bg-blue-100 text-blue-800",
        icon: Building,
        label: "Entreprise",
      },
      particulier: {
        color: "bg-green-100 text-green-800",
        icon: Users,
        label: "Particulier",
      },
    };

    const config = typeConfig[clientType] || typeConfig.particulier;
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

  const getStatusBadge = (statut) => {
    const statusConfig = {
      actif: { color: "bg-green-100 text-green-800", label: "Actif" },
      inactif: { color: "bg-gray-100 text-gray-800", label: "Inactif" },
    };

    const config = statusConfig[statut] || statusConfig.inactif;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const handleAddClient = () => {
    setShowAddModal(true);
  };

  const handleBulkAddClient = () => {
    setShowTypeSelectionModal(true);
  };

  const handleTypeSelection = (type) => {
    setBulkClientType(type);
    setBulkClients("");
    setShowTypeSelectionModal(false);
    setShowBulkAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.entreprises?.id_entreprise) {
      showError("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    // Au moins un champ doit être rempli (nom ou prenom ou telephone ou email)
    if (
      !formData.nom?.trim() &&
      !formData.prenom?.trim() &&
      !formData.telephone?.trim() &&
      !formData.email?.trim()
    ) {
      showError("Au moins un champ doit être rempli");
      return;
    }

    // Validation spécifique selon le type
    if (formData.type === "entreprise") {
      if (!formData.nom?.trim()) {
        showError("Le nom de l'entreprise est obligatoire");
        return;
      }
      if (!formData.telephone?.trim()) {
        showError("Le téléphone de l'entreprise est obligatoire");
        return;
      }
      if (!formData.email?.trim()) {
        showError("L'email de l'entreprise est obligatoire");
        return;
      }
      // Validation format téléphone entreprise
      const phoneRegex = /^\+22901\d{8}$/;
      if (!phoneRegex.test(formData.telephone.trim())) {
        showError("Format téléphone requis: +2290112345678");
        return;
      }
      // Validation format email entreprise
      const emailRegex =
        /^[A-Za-z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr)$/;
      if (!emailRegex.test(formData.email.trim())) {
        showError("Format email requis: nom@gmail.com/outlook.com/outlook.fr");
        return;
      }
    }

    if (formData.type === "particulier") {
      if (!formData.prenom?.trim()) {
        showError("Le prénom du particulier est obligatoire");
        return;
      }
      if (!formData.nom?.trim()) {
        showError("Le nom du particulier est obligatoire");
        return;
      }
      if (!formData.telephone?.trim()) {
        showError("Le téléphone du particulier est obligatoire");
        return;
      }
      if (!formData.email?.trim()) {
        showError("L'email du particulier est obligatoire");
        return;
      }
      // Validation format téléphone particulier
      const phoneRegex = /^\+22901\d{8}$/;
      if (!phoneRegex.test(formData.telephone.trim())) {
        showError("Format téléphone requis: +2290112345678");
        return;
      }
      // Validation format email particulier
      const emailRegex =
        /^[A-Za-z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr)$/;
      if (!emailRegex.test(formData.email.trim())) {
        showError("Format email requis: nom@gmail.com/outlook.com/outlook.fr");
        return;
      }
      // Transformer le nom en majuscules
      formData.nom = formData.nom.trim().toUpperCase();
    }

    try {
      const clientData = {
        ...(formData.nom?.trim() && { nom: formData.nom.trim() }),
        ...(formData.prenom?.trim() && { prenom: formData.prenom.trim() }),
        ...(formData.telephone?.trim() && {
          telephone: formData.telephone.trim(),
        }),
        ...(formData.email?.trim() && { email: formData.email.trim() }),
        id_entreprise: profile.entreprises.id_entreprise,
      };

      if (editingClient) {
        // Update
        const { data, error } = await clients.update(
          editingClient.id_client,
          clientData,
        );

        if (error) {
          throw error;
        }

        const updatedClients = clientsList.map((c) =>
          c.id_client === editingClient.id_client ? { ...c, ...data } : c,
        );
        setClientsList(updatedClients);
        showSuccess("Client modifié avec succès");
      } else {
        // Create
        const { data, error } = await clients.create(clientData);

        if (error) {
          throw error;
        }

        setClientsList([...clientsList, data]);
        showSuccess("Client ajouté avec succès");
      }

      resetForm();
    } catch (err) {
      showError(err.message || "Erreur lors de la sauvegarde du client");
    }
  };

  const resetForm = () => {
    setFormData({
      type: "particulier",
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
    });
    setFieldErrors({
      nom: false,
      prenom: false,
      telephone: false,
      email: false,
    });
    setShowAddModal(false);
    setEditingClient(null);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setFormData({
      type: client.nom && !client.prenom ? "entreprise" : "particulier",
      nom: client.nom || "",
      prenom: client.prenom || "",
      telephone: client.telephone || "",
      email: client.email || "",
    });
    // Réinitialiser les erreurs lors de l'édition
    setFieldErrors({
      nom: false,
      prenom: false,
      telephone: false,
      email: false,
    });
    setShowAddModal(true);
  };

  const handleDeleteClient = async (id_client) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;

    try {
      const { error } = await clients.delete(id_client);

      if (error) {
        throw error;
      }

      const updatedClients = clientsList.filter(
        (c) => c.id_client !== id_client,
      );
      setClientsList(updatedClients);
      showSuccess("Client supprimé avec succès");
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression du client");
    }
  };

  // Traiter l'ajout en masse de clients
  const handleBulkAddClients = async () => {
    if (!profile?.entreprises?.id_entreprise) {
      showError("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    if (!bulkClients.trim()) {
      showError("Veuillez entrer au moins un client");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const lines = bulkClients
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      const clientsToInsert = [];

      for (const line of lines) {
        // Parser la ligne selon le type de client
        let fields, nom, prenom, telephone, email;

        if (bulkClientType === "particulier") {
          // Format particulier: nom,prenom,telephone,email
          fields = line.split(",").map(field => field.trim());
          
          if (fields.length < 4) {
            showError(`Ligne invalide: ${line}. Format requis: nom,prenom,telephone,email`);
            return;
          }

          [nom, prenom, telephone, email] = fields;

          // Validation basique pour particulier
          if (!nom || !prenom || !telephone || !email) {
            showError(`Ligne invalide: ${line}. Tous les champs sont obligatoires pour un particulier`);
            return;
          }
        } else {
          // Format entreprise: nom,telephone,email
          fields = line.split(",").map(field => field.trim());
          
          if (fields.length < 3) {
            showError(`Ligne invalide: ${line}. Format requis: nom,telephone,email`);
            return;
          }

          [nom, telephone, email] = fields;
          prenom = null; // Pas de prénom pour une entreprise

          // Validation basique pour entreprise
          if (!nom || !telephone || !email) {
            showError(`Ligne invalide: ${line}. Tous les champs sont obligatoires pour une entreprise`);
            return;
          }
        }

        // Validation format téléphone (adapté pour le Bénin)
        const phoneRegex = /^\+22901\d{8}$/;
        if (!phoneRegex.test(telephone)) {
          showError(`Format de téléphone invalide: ${telephone}. Format attendu: +22901XXXXXXXX`);
          return;
        }

        // Validation email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showError(`Format d'email invalide: ${email}`);
          return;
        }

        clientsToInsert.push({
          id_entreprise: profile.entreprises.id_entreprise,
          nom: nom.trim(),
          prenom: prenom?.trim() || null,
          telephone: telephone.trim(),
          email: email.trim(),
        });
      }

      // Insérer tous les clients
      const { error } = await clients.bulkInsert(clientsToInsert);

      if (error) {
        console.error("Erreur lors de l'ajout en masse:", error);
        showError(`Erreur lors de l'ajout: ${error.message}`);
      } else {
        showSuccess(`${clientsToInsert.length} client(s) ajouté(s) avec succès`);
        // Fermer la modal et réinitialiser
        setShowBulkAddModal(false);
        setBulkClients("");
        setBulkClientType("particulier");
        setError("");
        loadClients(); // Rafraîchir la liste
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout en masse:", error);
      showError(`Erreur lors de l'ajout: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 mx-auto p-5">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Gestion des clients et prospects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddClient}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau client
          </button>
          <button
            onClick={handleBulkAddClient}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajout en masse
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Entreprises</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.entreprises}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Particuliers</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.particuliers}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avec contact complet</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {stats.contactComplet}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}

      <div className="flex gap-4 ">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
          >
            <option value="tous">Tous les types</option>
            <option value="entreprise">Entreprises</option>
            <option value="particulier">Particuliers</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Chargement des clients..." />
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadClients}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    REF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Aucun client trouvé</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client, index) => {
                    const isEntreprise = client.nom && !client.prenom;
                    // Générer la référence CLI000000
                    const clientRef = `CLI${String(index + 1).padStart(6, "0")}`;
                    return (
                      <tr key={client.id_client} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {clientRef}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {isEntreprise
                              ? client.nom
                              : `${client.prenom || ""} ${client.nom || ""}`.trim() ||
                                "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              isEntreprise
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {isEntreprise ? (
                              <>
                                <Building className="w-3 h-3" />
                                Entreprise
                              </>
                            ) : (
                              <>
                                <Users className="w-3 h-3" />
                                Particulier
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {client.telephone && (
                              <div className="flex items-center gap-1 text-sm text-gray-900">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {client.telephone}
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {client.email}
                              </div>
                            )}
                            {!client.telephone && !client.email && (
                              <div className="text-sm text-gray-400">-</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditClient(client)}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteClient(client.id_client)
                              }
                              className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                              title="Supprimer"
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
      )}

      {/* Modal Ajout/Modification */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingClient ? "Modifier le client" : "Nouveau client"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de client *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none"
                >
                  <option value="particulier">Particulier</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>

              {formData.type === "entreprise" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'entreprise *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => handleInputChange("nom", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        fieldErrors.nom
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-gray-300 focus:ring-gray-900"
                      }`}
                      placeholder="Ex: SARL Technologie"
                      required
                    />
                    {fieldErrors.nom && (
                      <p className="mt-1 text-sm text-red-600">
                        Le nom de l'entreprise est obligatoire
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) =>
                          handleInputChange("telephone", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.telephone
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-gray-300 focus:ring-gray-900"
                        }`}
                        placeholder="+2290112345678"
                        required
                      />
                      {fieldErrors.telephone && (
                        <p className="mt-1 text-sm text-red-600">
                          Format téléphone requis: +2290112345678
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.email
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-gray-300 focus:ring-gray-900"
                        }`}
                        placeholder="entreprise@outlook.com"
                        required
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          Format email requis:
                          nom@gmail.com/outlook.com/outlook.fr
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom du particulier *
                      </label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) =>
                          handleInputChange("prenom", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.prenom
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-gray-300 focus:ring-gray-900"
                        }`}
                        placeholder="Ex: Jean"
                        required
                      />
                      {fieldErrors.prenom && (
                        <p className="mt-1 text-sm text-red-600">
                          Le prénom du particulier est obligatoire
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du particulier *
                      </label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) =>
                          handleInputChange("nom", e.target.value.toUpperCase())
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.nom
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-gray-300 focus:ring-gray-900"
                        }`}
                        placeholder="Ex: DUPONT"
                        required
                      />
                      {fieldErrors.nom && (
                        <p className="mt-1 text-sm text-red-600">
                          Le nom du particulier est obligatoire
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) =>
                          handleInputChange("telephone", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.telephone
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-gray-300 focus:ring-gray-900"
                        }`}
                        placeholder="+2290112345678"
                        required
                      />
                      {fieldErrors.telephone && (
                        <p className="mt-1 text-sm text-red-600">
                          Format téléphone requis: +2290112345678
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                          fieldErrors.email
                            ? "border-red-500 ring-2 ring-red-200"
                            : "border-gray-300 focus:ring-gray-900"
                        }`}
                        placeholder="nom@gmail.com"
                        required
                      />
                      {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          Format email requis:
                          nom@gmail.com/outlook.com/outlook.fr
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
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
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {editingClient ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sélection du type de client */}
      {showTypeSelectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Sélectionner le type de clients
              </h2>
              <button
                onClick={() => setShowTypeSelectionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choisissez le type de clients que vous souhaitez ajouter en masse :
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleTypeSelection("particulier")}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Particuliers</h3>
                      <p className="text-sm text-gray-600">Format: nom,prenom,telephone,email</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleTypeSelection("entreprise")}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Entreprises</h3>
                      <p className="text-sm text-gray-600">Format: nom,telephone,email</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => setShowTypeSelectionModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout en masse de clients */}
      {showBulkAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Ajout en masse de clients
              </h2>
              <button
                onClick={() => {
                  setShowBulkAddModal(false);
                  setBulkClients("");
                  setBulkClientType("particulier");
                  setError("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type de client sélectionné */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Type de clients:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {bulkClientType === "particulier" ? "Particuliers" : "Entreprises"}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">
                  Instructions de formatage
                </h3>
                <p className="text-sm text-blue-800">
                  Entrez chaque client sur une ligne séparée au format :
                </p>
                {bulkClientType === "particulier" ? (
                  <>
                    <code className="block mt-2 text-xs bg-blue-100 p-2 rounded">
                      nom,prenom,telephone,email
                    </code>
                    <p className="text-xs text-blue-600 mt-2">
                      Exemple : "Dupont,Jean,+2290112345678,jean@email.com"
                    </p>
                  </>
                ) : (
                  <>
                    <code className="block mt-2 text-xs bg-blue-100 p-2 rounded">
                      nom,telephone,email
                    </code>
                    <p className="text-xs text-blue-600 mt-2">
                      Exemple : "Entreprise ABC,+2290112345678,contact@entreprise.com"
                    </p>
                  </>
                )}
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ Tous les champs sont obligatoires
                </p>
              </div>

              {/* Zone de texte pour la liste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liste des clients *
                </label>
                <textarea
                  value={bulkClients}
                  onChange={(e) => setBulkClients(e.target.value)}
                  placeholder="Entrez la liste des clients au format CSV..."
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {
                    bulkClients.split("\n").filter((line) => line.trim())
                      .length
                  }{" "}
                  client(s) détecté(s)
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowBulkAddModal(false);
                    setBulkClients("");
                    setBulkClientType("particulier");
                    setError("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleBulkAddClients}
                  disabled={loading || !bulkClients.trim() || !bulkClientType}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Ajouter{" "}
                      {
                        bulkClients.split("\n").filter((line) => line.trim())
                          .length
                      }{" "}
                      client(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {selectedClient && !showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Détails du client
              </h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Trash2 className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Référence</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.reference ||
                      `CLT-${String(selectedClient.id).padStart(3, "0")}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nom du client</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.nom}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <div>{getTypeBadge(selectedClient)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.contact}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <div>{getStatusBadge(selectedClient.statut)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.telephone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.email}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Adresse</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {selectedClient.adresse}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedClient.ville}, {selectedClient.pays}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.date_creation}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dernière commande</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.derniere_commande}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total des commandes</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.commandes_total}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="font-medium text-gray-900">
                    {selectedClient.montant_total.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
