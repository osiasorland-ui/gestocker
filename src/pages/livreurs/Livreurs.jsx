import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase } from "../../config/supabase";

const Livreurs = () => {
  const [livreurs, setLivreurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLivreur, setEditingLivreur] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    permis_conduire: "",
    vehicule_type: "",
    immatriculation: "",
    statut: "ACTIF",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    chargerLivreurs();
  }, []);

  const chargerLivreurs = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer l'ID de l'entreprise
      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("id_entreprise")
        .eq("id_user", user.id)
        .single();

      if (!userData) return;

      const { data, error } = await supabase
        .from("livreurs")
        .select("*")
        .eq("id_entreprise", userData.id_entreprise)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLivreurs(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des livreurs:", error);
      setError("Erreur lors du chargement des livreurs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Utilisateur non connecté");
        return;
      }

      // Récupérer l'ID de l'entreprise
      const { data: userData } = await supabase
        .from("utilisateurs")
        .select("id_entreprise")
        .eq("id_user", user.id)
        .single();

      if (!userData) {
        setError("Impossible de récupérer les informations de l'entreprise");
        return;
      }

      const livreurData = {
        ...formData,
        id_entreprise: userData.id_entreprise,
      };

      if (editingLivreur) {
        // Mise à jour
        const { error } = await supabase
          .from("livreurs")
          .update(livreurData)
          .eq("id_livreur", editingLivreur.id_livreur);

        if (error) throw error;
        setSuccess("Livreur mis à jour avec succès");
      } else {
        // Création
        const { error } = await supabase.from("livreurs").insert(livreurData);

        if (error) throw error;
        setSuccess("Livreur ajouté avec succès");
      }

      setShowModal(false);
      setEditingLivreur(null);
      resetForm();
      await chargerLivreurs();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      setError("Erreur lors de l'enregistrement du livreur");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (livreur) => {
    setEditingLivreur(livreur);
    setFormData({
      nom: livreur.nom,
      prenom: livreur.prenom || "",
      telephone: livreur.telephone,
      email: livreur.email || "",
      permis_conduire: livreur.permis_conduire || "",
      vehicule_type: livreur.vehicule_type || "",
      immatriculation: livreur.immatriculation || "",
      statut: livreur.statut,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce livreur ?"))
      return;

    try {
      const { error } = await supabase
        .from("livreurs")
        .delete()
        .eq("id_livreur", id);

      if (error) throw error;
      setSuccess("Livreur supprimé avec succès");
      await chargerLivreurs();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setError("Erreur lors de la suppression du livreur");
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      permis_conduire: "",
      vehicule_type: "",
      immatriculation: "",
      statut: "ACTIF",
    });
    setError("");
    setSuccess("");
  };

  const filteredLivreurs = livreurs.filter(
    (livreur) =>
      livreur.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (livreur.prenom &&
        livreur.prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      livreur.telephone.includes(searchTerm) ||
      (livreur.email &&
        livreur.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading && livreurs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des livreurs
          </h1>
          <p className="text-sm text-gray-500">
            {livreurs.length} livreur{livreurs.length > 1 ? "s" : ""} inscrit
            {livreurs.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingLivreur(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un livreur
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un livreur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tableau des livreurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Date d'embauche
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLivreurs.map((livreur) => (
                <tr key={livreur.id_livreur} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {livreur.nom} {livreur.prenom}
                        </div>
                        <div className="text-sm text-gray-500">
                          {livreur.permis_conduire &&
                            `Permis: ${livreur.permis_conduire}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      {livreur.telephone}
                    </div>
                    {livreur.email && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {livreur.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Car className="h-4 w-4 mr-1 text-gray-400" />
                      {livreur.vehicule_type || "Non spécifié"}
                    </div>
                    {livreur.immatriculation && (
                      <div className="text-sm text-gray-500">
                        {livreur.immatriculation}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        livreur.statut === "ACTIF"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {livreur.statut === "ACTIF" ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Actif
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </div>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(livreur.date_embauche).toLocaleDateString(
                      "fr-FR",
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(livreur)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(livreur.id_livreur)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLivreurs.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucun livreur trouvé
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Essayez une autre recherche"
                : "Commencez par ajouter un livreur"}
            </p>
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingLivreur ? "Modifier le livreur" : "Ajouter un livreur"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permis de conduire
                </label>
                <input
                  type="text"
                  value={formData.permis_conduire}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permis_conduire: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de véhicule
                  </label>
                  <input
                    type="text"
                    value={formData.vehicule_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicule_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Immatriculation
                  </label>
                  <input
                    type="text"
                    value={formData.immatriculation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        immatriculation: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) =>
                    setFormData({ ...formData, statut: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIF">Actif</option>
                  <option value="INACTIF">Inactif</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingLivreur(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? "Enregistrement..."
                    : editingLivreur
                      ? "Mettre à jour"
                      : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Livreurs;
