import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotification } from "../../hooks/useNotification";
import Notification from "../../components/Notification";
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
} from "lucide-react";

function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nom_fournisseur: "",
    contact_nom: "",
    contact_telephone: "",
    contact_email: "",
    adresse: "",
    ville: "",
    pays: "",
    code_postal: "",
    conditions_paiement: "",
    delai_livraison: "",
    notes: "",
  });

  // Charger les données depuis la base de données
  useEffect(() => {
    loadFournisseurs();
  }, []);

  const loadFournisseurs = async () => {
    if (!profile?.id_entreprise) return;

    try {
      setLoading(true);
      setError("");

      // Simulation de chargement - à remplacer par l'appel API réel
      const mockFournisseurs = [
        {
          id_fournisseur: "1",
          nom_fournisseur: "TechSupply Africa",
          contact_nom: "Jean Kouadio",
          contact_telephone: "+225 07 89 45 67 89",
          contact_email: "contact@techsupply.ci",
          adresse: "123 Rue du Commerce",
          ville: "Abidjan",
          pays: "Côte d'Ivoire",
          code_postal: "01 BP 1234",
          conditions_paiement: "30 jours",
          delai_livraison: "7 jours",
          notes: "Fournisseur principal pour matériel informatique",
          created_at: new Date().toISOString(),
        },
        {
          id_fournisseur: "2",
          nom_fournisseur: "Global Hardware Ltd",
          contact_nom: "Marie Ouedraogo",
          contact_telephone: "+226 70 12 34 56",
          contact_email: "info@globalhardware.bf",
          adresse: "456 Avenue de l'Industrie",
          ville: "Ouagadougou",
          pays: "Burkina Faso",
          code_postal: "01 BP 5678",
          conditions_paiement: "45 jours",
          delai_livraison: "14 jours",
          notes: "Spécialiste en matériel de bureau",
          created_at: new Date().toISOString(),
        },
      ];

      setFournisseurs(mockFournisseurs);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des fournisseurs");
      showError("Erreur lors du chargement des fournisseurs");
    } finally {
      setLoading(false);
    }
  };

  const filteredFournisseurs = fournisseurs.filter(
    (fournisseur) =>
      fournisseur.nom_fournisseur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.contact_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fournisseur.contact_email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id_entreprise) {
      showError("Utilisateur non connecté ou entreprise non trouvée");
      return;
    }

    if (!formData.nom_fournisseur?.trim()) {
      showError("Le nom du fournisseur est obligatoire");
      return;
    }

    if (!formData.contact_telephone?.trim()) {
      showError("Le téléphone de contact est obligatoire");
      return;
    }

    try {
      const fournisseurData = {
        nom_fournisseur: formData.nom_fournisseur.trim(),
        contact_nom: formData.contact_nom.trim(),
        contact_telephone: formData.contact_telephone.trim(),
        contact_email: formData.contact_email.trim(),
        adresse: formData.adresse.trim(),
        ville: formData.ville.trim(),
        pays: formData.pays.trim(),
        code_postal: formData.code_postal.trim(),
        conditions_paiement: formData.conditions_paiement.trim(),
        delai_livraison: formData.delai_livraison.trim(),
        notes: formData.notes.trim(),
        id_entreprise: profile.id_entreprise,
      };

      // Simulation de sauvegarde - à remplacer par l'appel API réel
      if (editingFournisseur) {
        // Update
        const updatedFournisseurs = fournisseurs.map((f) =>
          f.id_fournisseur === editingFournisseur.id_fournisseur
            ? { ...f, ...fournisseurData }
            : f
        );
        setFournisseurs(updatedFournisseurs);
      } else {
        // Create
        const newFournisseur = {
          id_fournisseur: Date.now().toString(),
          ...fournisseurData,
          created_at: new Date().toISOString(),
        };
        setFournisseurs([...fournisseurs, newFournisseur]);
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
      code_postal: "",
      conditions_paiement: "",
      delai_livraison: "",
      notes: "",
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
      code_postal: fournisseur.code_postal,
      conditions_paiement: fournisseur.conditions_paiement,
      delai_livraison: fournisseur.delai_livraison,
      notes: fournisseur.notes,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_fournisseur) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce fournisseur ?")) return;

    try {
      // Simulation de suppression - à remplacer par l'appel API réel
      const updatedFournisseurs = fournisseurs.filter(
        (f) => f.id_fournisseur !== id_fournisseur
      );
      setFournisseurs(updatedFournisseurs);
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
      ...fournisseurs.map((f) =>
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
          <p className="text-gray-600">Gérez vos fournisseurs et leurs informations</p>
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
        <div className="text-center py-12">
          <Building className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Chargement des fournisseurs...</p>
        </div>
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

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFournisseurs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Aucun fournisseur trouvé</p>
              </div>
            ) : (
              filteredFournisseurs.map((fournisseur) => (
                <div
                  key={fournisseur.id_fournisseur}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {fournisseur.nom_fournisseur}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {fournisseur.contact_nom}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(fournisseur)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(fournisseur.id_fournisseur)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{fournisseur.contact_telephone}</span>
                    </div>
                    {fournisseur.contact_email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{fournisseur.contact_email}</span>
                      </div>
                    )}
                    {(fournisseur.adresse || fournisseur.ville) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {fournisseur.adresse}
                          {fournisseur.adresse && fournisseur.ville && ", "}
                          {fournisseur.ville}
                        </span>
                      </div>
                    )}
                    {fournisseur.conditions_paiement && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Paiement: </span>
                        <span className="text-xs font-medium">
                          {fournisseur.conditions_paiement}
                        </span>
                      </div>
                    )}
                    {fournisseur.delai_livraison && (
                      <div>
                        <span className="text-xs text-gray-500">Livraison: </span>
                        <span className="text-xs font-medium">
                          {fournisseur.delai_livraison}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingFournisseur ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
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
                    setFormData({ ...formData, nom_fournisseur: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du contact
                  </label>
                  <input
                    type="text"
                    value={formData.contact_nom}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_nom: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
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
                      setFormData({ ...formData, contact_telephone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
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
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.code_postal}
                    onChange={(e) =>
                      setFormData({ ...formData, code_postal: e.target.value })
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
                      setFormData({ ...formData, conditions_paiement: e.target.value })
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
                      setFormData({ ...formData, delai_livraison: e.target.value })
                    }
                    placeholder="Ex: 7 jours"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
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
