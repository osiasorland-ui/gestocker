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
    permis_conduire: "",
    vehicule_type: "",
    immatriculation: "",
    statut: "ACTIF",
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
          showError("Cet email existe déjà");
          return;
        }
      }

      const livreurData = {
        ...formData,
        id_entreprise: entrepriseId,
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
            <Card className="mb-6">
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
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
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des livreurs</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <TableLoader text="Chargement des livreurs..." />
                ) : (
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
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLivreurs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center">
                                <Users className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-gray-500">
                                  Aucun livreur trouvé
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  {searchTerm
                                    ? "Essayez une autre recherche"
                                    : "Commencez par ajouter un livreur"}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredLivreurs.map((livreur) => (
                            <tr
                              key={livreur.id_livreur}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {livreur.nom} {livreur.prenom}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {livreur.id_livreur.slice(0, 8)}...
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                    {livreur.telephone}
                                  </div>
                                  {livreur.email && (
                                    <div className="flex items-center mt-1">
                                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                      {livreur.email}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center">
                                    <Car className="h-4 w-4 text-gray-400 mr-2" />
                                    {livreur.vehicule_type || "Non spécifié"}
                                  </div>
                                  {livreur.immatriculation && (
                                    <div className="text-xs text-gray-500 mt-1">
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
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(livreur)}
                                    icon={Edit}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDelete(
                                        livreur.id_livreur,
                                        livreur.nom,
                                      )
                                    }
                                    icon={Trash2}
                                    className="text-red-600 hover:text-red-700"
                                  />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <CardHeader>
              <CardTitle>
                {editingLivreur ? "Modifier un livreur" : "Ajouter un livreur"}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) =>
                      setFormData({ ...formData, prenom: e.target.value })
                    }
                  />
                </div>

                <Input
                  label="Téléphone"
                  value={formData.telephone}
                  onChange={(e) =>
                    setFormData({ ...formData, telephone: e.target.value })
                  }
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />

                <Input
                  label="Permis de conduire"
                  value={formData.permis_conduire}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permis_conduire: e.target.value,
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Type de véhicule"
                    value={formData.vehicule_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vehicule_type: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Immatriculation"
                    value={formData.immatriculation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        immatriculation: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) =>
                      setFormData({ ...formData, statut: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="ACTIF">Actif</option>
                    <option value="INACTIF">Inactif</option>
                  </select>
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
