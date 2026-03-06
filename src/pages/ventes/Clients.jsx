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
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
      return matchesSearch;
    });
  }, [clientsList, searchTerm]);

  const getTypeBadge = (type) => {
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

    const config = typeConfig[type] || typeConfig.particulier;
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Gestion des clients et prospects</p>
        </div>
        <button
          onClick={handleAddClient}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </button>
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
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
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
                {filteredClients.map((client, index) => {
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
                            onClick={() => handleDeleteClient(client.id_client)}
                            className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                  <div>{getTypeBadge(selectedClient.type)}</div>
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
