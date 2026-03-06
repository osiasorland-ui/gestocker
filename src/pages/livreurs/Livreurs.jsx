import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Car,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  UserPlus,
  AlertCircle,
  Truck,
  Bike,
  Package,
} from "lucide-react";
import { livreurs } from "../../config/supabase";
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
} from "../../components/ui/Loader";

const Livreurs = () => {
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);
  const [livreursList, setLivreursList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLivreur, setEditingLivreur] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [entrepriseId, setEntrepriseId] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    vehicule_type: "",
    immatriculation: "",
    statut: "ACTIF",
  });

  // État pour les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    vehicule_type: "",
    immatriculation: "",
  });

  // Mettre à jour l'ID d'entreprise quand le profil change
  useEffect(() => {
    if (profile?.id_entreprise && profile.id_entreprise !== entrepriseId) {
      setEntrepriseId(profile.id_entreprise);
    }
  }, [profile?.id_entreprise, entrepriseId]);

  // Stabiliser la fonction de chargement pour éviter les boucles infinies
  const loadLivreurs = useCallback(async () => {
    if (!entrepriseId) return;

    setLoading(true);
    try {
      // Vérifier si l'utilisateur est authentifié via le contexte
      if (!profile) {
        showError("Utilisateur non authentifié");
        setLoading(false);
        return;
      }

      const { data, error } = await livreurs.getAll(entrepriseId);

      if (error) throw error;
      setLivreursList(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des livreurs:", error);
      showError("Erreur lors du chargement des livreurs");
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, profile, showError]);

  useEffect(() => {
    if (entrepriseId) {
      loadLivreurs();
    }
  }, [entrepriseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
      showError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    if (!entrepriseId) {
      showError("Utilisateur non connecté");
      return;
    }

    setSubmitting(true);
    try {
      // Vérifier si l'utilisateur est authentifié via le contexte
      if (!profile) {
        showError("Utilisateur non authentifié");
        return;
      }

      // Validation des doublons
      const { exists: phoneExists } = await livreurs.checkPhoneExists(
        entrepriseId,
        formData.telephone,
        editingLivreur?.id_livreur,
      );

      if (phoneExists) {
        setFieldErrors((prev) => ({
          ...prev,
          telephone: "Ce numéro de téléphone existe déjà",
        }));
        showError("Ce numéro de téléphone existe déjà");
        return;
      }

      if (formData.email) {
        const { exists: emailExists } = await livreurs.checkEmailExists(
          entrepriseId,
          formData.email,
          editingLivreur?.id_livreur,
        );

        if (emailExists) {
          setFieldErrors((prev) => ({
            ...prev,
            email: "Cet email existe déjà",
          }));
          showError("Cet email existe déjà");
          return;
        }
      }

      const livreurData = {
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        email: formData.email,
        vehicule_type: formData.vehicule_type,
        immatriculation: formData.immatriculation,
        statut: formData.statut,
        id_entreprise: entrepriseId,
        id_user: profile?.id_user,
      };

      let result;
      if (editingLivreur) {
        // Mise à jour
        result = await livreurs.update(editingLivreur.id_livreur, livreurData);
        if (!result.error) {
          showSuccess("Livreur mis à jour avec succès");
        }
      } else {
        // Création
        result = await livreurs.create(livreurData, profile);
        if (!result.error) {
          showSuccess("Livreur ajouté avec succès");
        }
      }

      if (result.error) {
        console.error("Erreur complète:", result.error);
        throw result.error;
      }

      setShowModal(false);
      setEditingLivreur(null);
      resetForm();
      await loadLivreurs();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      if (error.code === "42501") {
        showError(
          "Erreur de sécurité: Vous n'avez pas les permissions pour ajouter des livreurs",
        );
      } else {
        showError("Erreur lors de l'enregistrement du livreur");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (livreur) => {
    setFormData({
      nom: livreur.nom,
      prenom: livreur.prenom,
      telephone: livreur.telephone,
      email: livreur.email,
      vehicule_type: livreur.vehicule_type,
      immatriculation: livreur.immatriculation,
      statut: livreur.statut,
    });
    setFieldErrors({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      vehicule_type: "",
      immatriculation: "",
    });
    setEditingLivreur(livreur);
    setShowModal(true);
  };

  const handleDelete = async (id, nom) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${nom} ?`)) {
      return;
    }

    try {
      const { error } = await livreurs.delete(id);

      if (error) throw error;
      showSuccess("Livreur supprimé avec succès");
      await loadLivreurs();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showError("Erreur lors de la suppression du livreur");
    }
  };

  // Fonction de validation des champs
  const validateField = (fieldName, value) => {
    let error = "";

    switch (fieldName) {
      case "nom":
        if (!value || value.trim() === "") {
          error = "Le nom est obligatoire";
        } else if (value !== value.toUpperCase()) {
          error = "Le nom doit être en majuscules";
        } else if (value.length < 2) {
          error = "Le nom doit contenir au moins 2 caractères";
        }
        break;

      case "prenom":
        if (!value || value.trim() === "") {
          error = "Le prénom est obligatoire";
        } else if (value.length < 2) {
          error = "Le prénom doit contenir au moins 2 caractères";
        }
        break;

      case "telephone":
        if (!value || value.trim() === "") {
          error = "Le téléphone est obligatoire";
        } else if (!/^\+22901\d{8}$/.test(value)) {
          error = "Format requis: +2290112345678";
        }
        break;

      case "email":
        if (value && value.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            error = "Format d'email invalide";
          }
        }
        break;

      case "vehicule_type":
        if (!value || value.trim() === "") {
          error = "Le type de véhicule est obligatoire";
        }
        break;

      case "immatriculation":
        if (!value || value.trim() === "") {
          error = "L'immatriculation est obligatoire";
        }

        break;

      default:
        break;
    }

    return error;
  };

  // Gérer le changement des champs avec validation
  const handleInputChange = (fieldName, value) => {
    // Mettre à jour le formData
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Valider le champ et mettre à jour les erreurs
    const error = validateField(fieldName, value);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  // Valider tous les champs
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Valider chaque champ
    Object.keys(formData).forEach((fieldName) => {
      if (fieldName !== "statut") {
        // Le statut est géré différemment
        const error = validateField(fieldName, formData[fieldName]);
        if (error) {
          errors[fieldName] = error;
          isValid = false;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  // Obtenir l'icône selon le type de véhicule
  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType?.toLowerCase()) {
      case "moto":
      default:
        return <Bike className="h-4 w-4 text-blue-600" />;
      case "tricycle":
        return <Package className="h-4 w-4 text-green-600" />;
      case "camion":
        return <Truck className="h-4 w-4 text-orange-600" />;
      case "camionnette":
        return <Truck className="h-4 w-4 text-yellow-600" />;
    }
  };

  // Gérer le changement du type de véhicule
  const handleVehiculeTypeChange = (e) => {
    const newVehiculeType = e.target.value;

    setFormData({
      ...formData,
      vehicule_type: newVehiculeType,
    });

    // Valider le champ véhicule
    const error = validateField("vehicule_type", newVehiculeType);
    setFieldErrors((prev) => ({ ...prev, vehicule_type: error }));
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      vehicule_type: "",
      immatriculation: "",
      statut: "ACTIF",
    });
    setFieldErrors({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      vehicule_type: "",
      immatriculation: "",
    });
    setEditingLivreur(null);
  };

  const filteredLivreurs = livreursList.filter(
    (livreur) =>
      livreur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (livreur.prenom &&
        livreur.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      livreur.telephone.includes(searchTerm) ||
      (livreur.email &&
        livreur.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des livreurs
              </h1>
              <p className="mt-2 text-gray-600">
                Gérez vos livreurs et leurs informations
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={() => setShowModal(true)}
                icon={Plus}
                className="w-full sm:w-auto"
              >
                Ajouter un livreur
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {loading && livreursList.length === 0 ? (
          <PageLoader text="Chargement des livreurs..." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card hover>
                <CardContent className="flex items-center">
                  <div className="shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total livreurs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {livreursList.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card hover>
                <CardContent className="flex items-center">
                  <div className="shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Actifs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {livreursList.filter((l) => l.statut === "ACTIF").length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card hover>
                <CardContent className="flex items-center">
                  <div className="shrink-0">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Inactifs
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {
                        livreursList.filter((l) => l.statut === "INACTIF")
                          .length
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Rechercher un livreur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <Button variant="outline" icon={Filter}>
                Filtres
              </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        REF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Livreur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLivreurs.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucun livreur trouvé</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLivreurs.map((livreur) => (
                        <tr
                          key={livreur.id_livreur}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {`LIVR${String(livreursList.indexOf(livreur) + 1).padStart(6, "0")}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {livreur.nom} {livreur.prenom}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {livreur.id_livreur.slice(0, 8)}...
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center gap-2 mb-1">
                                <Phone className="w-4 h-4 text-gray-400" />
                                {livreur.telephone}
                              </div>
                              {livreur.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  {livreur.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center gap-2 mb-1">
                                {getVehicleIcon(livreur.vehicule_type)}
                                <span className="font-medium">
                                  {livreur.vehicule_type || "Non spécifié"}
                                </span>
                              </div>
                              {livreur.immatriculation && (
                                <div className="text-xs text-gray-500">
                                  {livreur.immatriculation}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                livreur.statut === "ACTIF"
                                  ? "success"
                                  : "danger"
                              }
                            >
                              {livreur.statut}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(livreur)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(livreur.id_livreur, livreur.nom)
                                }
                                className="text-red-600 hover:text-red-700"
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
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <CardHeader>
              <CardTitle>
                {editingLivreur ? "Modifier un livreur" : "Ajouter un livreur"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => handleInputChange("nom", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        fieldErrors.nom
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="Ex: DUPONT"
                    />
                    {fieldErrors.nom && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.nom}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
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
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="Ex: Jean"
                    />
                    {fieldErrors.prenom && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.prenom}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="+2290112345678"
                    />
                    {fieldErrors.telephone && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.telephone}
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
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="exemple@gmail.com"
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de véhicule *
                  </label>
                  <select
                    value={formData.vehicule_type}
                    onChange={handleVehiculeTypeChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      fieldErrors.vehicule_type
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                  >
                    <option value="">--Sélectionner un type--</option>
                    <option value="Camion">Camion</option>
                    <option value="camionnette">Camionnette</option>
                    <option value="tricycle">Tricycle</option>
                    <option value="moto">Moto</option>
                  </select>
                  {fieldErrors.vehicule_type && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.vehicule_type}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Immatriculation *
                    </label>
                    <input
                      type="text"
                      value={formData.immatriculation}
                      onChange={(e) =>
                        handleInputChange("immatriculation", e.target.value)
                      }
                      placeholder="Ex: CG-1234"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        fieldErrors.immatriculation
                          ? "border-red-500 ring-2 ring-red-200"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                    />
                    {fieldErrors.immatriculation && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.immatriculation}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <div className="flex space-x-6">
                    {editingLivreur ? (
                      <>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="statut"
                            value="ACTIF"
                            checked={formData.statut === "ACTIF"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                statut: e.target.value,
                              })
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Actif
                            </span>
                          </span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="statut"
                            value="INACTIF"
                            checked={formData.statut === "INACTIF"}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                statut: e.target.value,
                              })
                            }
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactif
                            </span>
                          </span>
                        </label>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Actif
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          Par défaut pour les nouveaux livreurs
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>

            <CardFooter>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingLivreur(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="relative"
                >
                  {submitting ? (
                    <InlineLoader
                      text={editingLivreur ? "Mise à jour..." : "Ajout..."}
                      size="sm"
                    />
                  ) : (
                    <>{editingLivreur ? "Mettre à jour" : "Ajouter"}</>
                  )}
                </Button>
              </div>
            </CardFooter>
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
};

export default Livreurs;
