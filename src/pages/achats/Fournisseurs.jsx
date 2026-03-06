import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../components/Notification";
import { fournisseurs } from "../../config/fournisseurs.js";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Upload,
  Download,
  Star,
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

const StarRating = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);
  const starSize = "w-5 h-5";

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${starSize} transition-colors ${
            star <= (hover || value)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 fill-gray-300"
          }`}
        >
          <Star className={starSize} />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {value > 0 ? `${value}.0` : "Sélectionnez une note"}
      </span>
    </div>
  );
};

function Fournisseurs() {
  const [fournisseursList, setFournisseursList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);

  // États pour la validation en temps réel
  const [fieldErrors, setFieldErrors] = useState({
    contact_nom: false,
    contact_telephone: false,
    contact_email: false,
  });

  // Stabiliser les fonctions pour éviter les boucles infinies
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const [formData, setFormData] = useState({
    nom_fournisseur: "",
    contact_nom: "",
    contact_telephone: "",
    contact_email: "",
    adresse: "",
    ville: "",
    pays: "",
    conditions_paiement: "",
    delai_livraison: "",
    rating: 0,
  });

  const loadFournisseurs = useCallback(async () => {
    console.log("loadFournisseurs called");
    console.log("Profile:", profile);
    console.log("Entreprise ID:", profile?.entreprises?.id_entreprise);

    if (!profile?.entreprises?.id_entreprise) {
      console.log("No entreprise ID found, returning");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log(
        "Calling fournisseurs.getAll with ID:",
        profile.entreprises.id_entreprise,
      );
      // Appel API réel pour charger les fournisseurs
      const { data, error } = await fournisseurs.getAll(
        profile.entreprises.id_entreprise,
      );

      console.log("Response from API:", { data, error });

      if (error) {
        throw error;
      }

      setFournisseursList(data || []);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des fournisseurs");
      showErrorRef.current("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  }, [profile, showErrorRef]);

  // Fonction de validation en temps réel
  const validateField = (fieldName, value) => {
    const trimmedValue = value.trim();
    let hasError = false;

    switch (fieldName) {
      case "contact_nom":
        // Vérifier si le nom du contact existe déjà
        hasError = fournisseursList.some(
          (f) =>
            f.contact_nom &&
            f.contact_nom.toLowerCase() === trimmedValue.toLowerCase() &&
            (!editingFournisseur ||
              f.id_fournisseur !== editingFournisseur.id_fournisseur),
        );
        break;

      case "contact_telephone":
        {
          // Vérifier le format (+22901xxxxxxxx = 12 chiffres après +229)
          const phoneRegex = /^\+22901\d{8}$/;
          hasError =
            !phoneRegex.test(trimmedValue) ||
            fournisseursList.some(
              (f) =>
                f.contact_telephone === trimmedValue &&
                (!editingFournisseur ||
                  f.id_fournisseur !== editingFournisseur.id_fournisseur),
            );
        }
        break;

      case "contact_email":
        if (trimmedValue) {
          {
            const emailRegex =
              /^[A-Za-z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr)$/;
            hasError =
              !emailRegex.test(trimmedValue) ||
              fournisseursList.some(
                (f) =>
                  f.contact_email &&
                  f.contact_email.toLowerCase() ===
                    trimmedValue.toLowerCase() &&
                  (!editingFournisseur ||
                    f.id_fournisseur !== editingFournisseur.id_fournisseur),
              );
          }
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

  // Charger les données depuis la base de données
  useEffect(() => {
    if (profile?.entreprises?.id_entreprise) {
      loadFournisseurs();
    }
  }, [profile?.entreprises?.id_entreprise]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredFournisseurs = fournisseursList.filter(
    (fournisseur) =>
      fournisseur.nom_fournisseur
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      fournisseur.contact_nom
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      fournisseur.contact_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.entreprises?.id_entreprise) {
      showError("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    if (!formData.nom_fournisseur?.trim()) {
      showError("Le nom du fournisseur est obligatoire");
      return;
    }

    if (!formData.contact_nom?.trim()) {
      showError("Le nom du contact est obligatoire");
      return;
    }

    if (!formData.contact_telephone?.trim()) {
      showError("Le téléphone de contact est obligatoire");
      return;
    }

    if (!formData.contact_email?.trim()) {
      showError("L'email du contact est obligatoire");
      return;
    }

    // Les champs suivants ne sont pas obligatoires selon la DB (ont des valeurs par défaut)
    // ville, pays, conditions_paiement, delai_livraison ont des valeurs par défaut ''
    // rating peut être null (pas de contrainte NOT NULL)
    // adresse est obligatoire selon la DB (NOT NULL)
    if (!formData.adresse?.trim()) {
      showError("L'adresse est obligatoire");
      return;
    }

    try {
      const fournisseurData = {
        nom_fournisseur: formData.nom_fournisseur.trim(),
        contact_nom: formData.contact_nom.trim(),
        contact_telephone: formData.contact_telephone.trim(),
        contact_email: formData.contact_email.trim(),
        adresse: formData.adresse.trim(),
        // Champs optionnels - n'envoyer que s'ils sont remplis
        ...(formData.ville?.trim() && { ville: formData.ville.trim() }),
        ...(formData.pays?.trim() && { pays: formData.pays.trim() }),
        ...(formData.conditions_paiement?.trim() && {
          conditions_paiement: formData.conditions_paiement.trim(),
        }),
        ...(formData.delai_livraison?.trim() && {
          delai_livraison: formData.delai_livraison.trim(),
        }),
        ...(formData.rating > 0 && { rating: formData.rating }),
        id_entreprise: profile.entreprises.id_entreprise,
      };

      console.log("Données envoyées à Supabase:", fournisseurData);
      console.log("Profile ID:", profile.entreprises.id_entreprise);

      // Appel API réel pour sauvegarder le fournisseur
      if (editingFournisseur) {
        // Update
        const { data, error } = await fournisseurs.update(
          editingFournisseur.id_fournisseur,
          fournisseurData,
        );

        if (error) {
          throw error;
        }

        // Mettre à jour la liste locale
        const updatedFournisseurs = fournisseursList.map((f) =>
          f.id_fournisseur === editingFournisseur.id_fournisseur
            ? { ...f, ...data }
            : f,
        );
        setFournisseursList(updatedFournisseurs);
      } else {
        // Create
        const { data, error } = await fournisseurs.create(fournisseurData);

        if (error) {
          throw error;
        }

        // Ajouter à la liste locale
        setFournisseursList([...fournisseursList, data]);
      }

      resetForm();
      showSuccess(
        editingFournisseur
          ? "Fournisseur modifié avec succès"
          : "Fournisseur ajouté avec succès",
      );
    } catch (err) {
      showError(err.message || "Erreur lors de la sauvegarde du fournisseur");
    }
  };

  const resetForm = () => {
    setFormData({
      nom_fournisseur: "",
      contact_nom: "",
      contact_telephone: "",
      contact_email: "",
      adresse: "",
      ville: "",
      pays: "",
      conditions_paiement: "",
      delai_livraison: "",
      rating: 0,
    });
    setFieldErrors({
      contact_nom: false,
      contact_telephone: false,
      contact_email: false,
    });
    setShowAddModal(false);
    setEditingFournisseur(null);
  };

  const handleEdit = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setFormData({
      nom_fournisseur: fournisseur.nom_fournisseur,
      contact_nom: fournisseur.contact_nom,
      contact_telephone: fournisseur.contact_telephone,
      contact_email: fournisseur.contact_email,
      adresse: fournisseur.adresse,
      ville: fournisseur.ville,
      pays: fournisseur.pays,
      conditions_paiement: fournisseur.conditions_paiement,
      delai_livraison: fournisseur.delai_livraison,
      rating: fournisseur.rating || 0,
    });
    // Réinitialiser les erreurs lors de l'édition
    setFieldErrors({
      contact_nom: false,
      contact_telephone: false,
      contact_email: false,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_fournisseur) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;

    try {
      // Appel API réel pour supprimer le fournisseur
      const { error } = await fournisseurs.delete(id_fournisseur);

      if (error) {
        throw error;
      }

      // Mettre à jour la liste locale
      const updatedFournisseurs = fournisseursList.filter(
        (f) => f.id_fournisseur !== id_fournisseur,
      );
      setFournisseursList(updatedFournisseurs);
      showSuccess("Fournisseur supprimé avec succès");
    } catch (err) {
      showError(err.message || "Erreur lors de la suppression du fournisseur");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Nom Fournisseur",
      "Contact",
      "Téléphone",
      "Email",
      "Adresse",
      "Ville",
      "Pays",
      "Conditions Paiement",
      "Délai Livraison",
    ];
    const csvContent = [
      headers.join(","),
      ...fournisseursList.map((f) =>
        [
          f.nom_fournisseur,
          f.contact_nom,
          f.contact_telephone,
          f.contact_email,
          f.adresse,
          f.ville,
          f.pays,
          f.conditions_paiement,
          f.delai_livraison,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fournisseurs.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Fournisseurs
          </h1>
          <p className="text-gray-600">
            Gérez vos fournisseurs et leurs informations
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            Ajouter un fournisseur
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader text="Chargement des fournisseurs..." />
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
          <p className="text-red-500">{error}</p>
          <button
            onClick={loadFournisseurs}
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
              placeholder="Rechercher un fournisseur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Suppliers Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {filteredFournisseurs.length === 0 ? (
              <div className="text-center py-12">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Aucun fournisseur trouvé</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchTerm
                    ? "Essayez une autre recherche"
                    : "Commencez par ajouter un fournisseur"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        REF
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fournisseur
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adresse
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conditions paiement
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Délai livraison
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Évaluation
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFournisseurs.map((fournisseur) => (
                      <tr
                        key={fournisseur.id_fournisseur}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <div className="text-xs font-medium text-gray-900">
                            {`FOUR${String(fournisseursList.indexOf(fournisseur) + 1).padStart(6, "0")}`}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2">
                              <Building className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {fournisseur.nom_fournisseur}
                              </div>
                              <div className="text-xs text-gray-500">
                                {fournisseur.contact_nom}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">
                            <div className="flex items-center gap-1 mb-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">
                                {fournisseur.contact_telephone}
                              </span>
                            </div>
                            {fournisseur.contact_email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  {fournisseur.contact_email}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-xs text-gray-900">
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                              <div>
                                <div className="text-xs">
                                  {fournisseur.adresse}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {fournisseur.ville}, {fournisseur.pays}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <div className="text-xs text-gray-900">
                            {fournisseur.conditions_paiement || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <div className="text-xs text-gray-900">
                            {fournisseur.delai_livraison || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          {fournisseur.rating ? (
                            <StarRating
                              value={fournisseur.rating}
                              onChange={() => {}}
                              size="sm"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              Non évalué
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(fournisseur)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(fournisseur.id_fournisseur)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingFournisseur
                ? "Modifier le fournisseur"
                : "Ajouter un fournisseur"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du fournisseur *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_fournisseur}
                  onChange={(e) =>
                    handleInputChange("nom_fournisseur", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du contact *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contact_nom}
                    onChange={(e) =>
                      handleInputChange("contact_nom", e.target.value)
                    }
                    placeholder="Ex: DUPONT Jean"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      fieldErrors.contact_nom
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-gray-300 focus:ring-gray-900"
                    }`}
                  />
                  {fieldErrors.contact_nom && (
                    <p className="mt-1 text-sm text-red-600">
                      Un contact avec ce nom existe déjà
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_telephone}
                    onChange={(e) =>
                      handleInputChange("contact_telephone", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                      fieldErrors.contact_telephone
                        ? "border-red-500 ring-2 ring-red-200"
                        : "border-gray-300 focus:ring-gray-900"
                    }`}
                    placeholder="Ex: +229012345678"
                  />
                  {fieldErrors.contact_telephone && (
                    <p className="mt-1 text-sm text-red-600">
                      Format requis: +22901xxxxxxxx ou ce numéro existe déjà
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    handleInputChange("contact_email", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    fieldErrors.contact_email
                      ? "border-red-500 ring-2 ring-red-200"
                      : "border-gray-300 focus:ring-gray-900"
                  }`}
                  placeholder="Ex: nom@gmail.com"
                />
                {fieldErrors.contact_email && (
                  <p className="mt-1 text-sm text-red-600">
                    Format requis: nom@gmail.com/outlook.com/outlook.fr ou cet
                    email existe déjà
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  required
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) =>
                      setFormData({ ...formData, ville: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays
                  </label>
                  <input
                    type="text"
                    value={formData.pays}
                    onChange={(e) =>
                      setFormData({ ...formData, pays: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conditions de paiement
                  </label>
                  <input
                    type="text"
                    value={formData.conditions_paiement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditions_paiement: e.target.value,
                      })
                    }
                    placeholder="Ex: 30 jours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Délai de livraison
                  </label>
                  <input
                    type="text"
                    value={formData.delai_livraison}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delai_livraison: e.target.value,
                      })
                    }
                    placeholder="Ex: 7 jours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Évaluation
                </label>
                <StarRating
                  value={formData.rating}
                  onChange={(value) =>
                    setFormData({ ...formData, rating: value })
                  }
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
                  {editingFournisseur ? "Modifier" : "Ajouter"}
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

export default Fournisseurs;
