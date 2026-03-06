import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { users, auth, supabase, createClient } from "../../config/supabase.js";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Check,
  X,
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

// Constantes pour les rôles basées sur la base de données
const ROLES = [
  { id: "1dd58d9b-ab78-4b62-ac8d-1d6234e89e81", libelle: "Gerant Principal" },
  { id: "2330adb2-bce2-4d87-81de-15cc2b2cb325", libelle: "Gerant" },
  { id: "2368d31f-4091-4e83-adff-30d7952dad8b", libelle: "Comptable" },
  { id: "550e8400-e29b-41d4-a716-446655440003", libelle: "Employé" },
  { id: "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3", libelle: "Admin" },
  { id: "a033e29c-94f6-4eb3-9243-a9424ec20357", libelle: "Super User" },
];

const ADMIN_ROLE_ID = "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3";
const SUPER_USER_ROLE_ID = "a033e29c-94f6-4eb3-9243-a9424ec20357";

const Utilisateurs = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Formulaire pour ajouter/modifier un utilisateur
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role_id: "",
    id_entreprise: profile?.id_entreprise || "",
    mot_de_passe: "",
  });

  // Charger la liste des utilisateurs
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("utilisateurs")
        .select(
          `
          *,
          roles (*),
          entreprises (*)
        `,
        )
        .eq("id_entreprise", profile?.id_entreprise)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsersList(data || []);
    } catch (error) {
      setError("Erreur lors du chargement des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [profile?.id_entreprise]);

  useEffect(() => {
    if (profile?.id_entreprise) {
      loadUsers();
    }
  }, [profile?.id_entreprise, loadUsers]);

  // Filtrer les utilisateurs (exclut l'utilisateur connecté pour qu'il ne se voie pas)
  const filteredUsers = usersList.filter(
    (user) =>
      user.id_user !== profile?.id_user && // L'utilisateur ne peut pas se voir lui-même
      (user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Gérer le changement des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Ajouter un utilisateur
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Créer l'utilisateur dans Supabase Auth
      const { error: authError } = await auth.signUp({
        email: formData.email,
        password: formData.mot_de_passe,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
            telephone: formData.telephone,
            role_id: formData.role_id,
            id_entreprise: formData.id_entreprise,
          },
        },
      });

      if (authError) throw authError;

      setSuccess("Utilisateur créé avec succès!");
      setShowAddModal(false);
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        role_id: "",
        id_entreprise: profile?.id_entreprise || "",
        mot_de_passe: "",
      });
      loadUsers();
    } catch (error) {
      setError("Erreur lors de la création de l'utilisateur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Modifier un utilisateur
  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await users.updateProfile(selectedUser.id_user, {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone,
        role_id: formData.role_id,
      });

      if (error) throw error;

      setSuccess("Utilisateur modifié avec succès!");
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      setError("Erreur lors de la modification: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Sécurité supplémentaire : au cas où l'utilisateur parviendrait à se sélectionner
      if (selectedUser.id_user === profile.id_user) {
        setError("Vous ne pouvez pas supprimer votre propre compte !");
        setLoading(false);
        return;
      }

      // Vérifier si l'utilisateur sélectionné est un admin ou super user
      const isProtectedRole =
        selectedUser.role_id === ADMIN_ROLE_ID ||
        selectedUser.role_id === SUPER_USER_ROLE_ID ||
        selectedUser.id_role === ADMIN_ROLE_ID || // Fallback au cas où le champ s'appelle id_role
        selectedUser.id_role === SUPER_USER_ROLE_ID;

      if (isProtectedRole) {
        setError(
          "Vous ne pouvez pas supprimer un compte Administrateur ou Super User !",
        );
        setLoading(false);
        return;
      }

      // Utiliser le service role pour contourner RLS
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        throw new Error("Service role key not configured");
      }

      // Créer un client admin avec le service role key
      const supabaseAdmin = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
          global: {
            headers: {
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          },
        },
      );

      // Supprimer en cascade avec le service role
      await supabaseAdmin
        .from("transferts")
        .delete()
        .eq("id_user", selectedUser.id_user);

      await supabaseAdmin
        .from("mouvements_stock")
        .delete()
        .eq("id_user", selectedUser.id_user);

      await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("id_user", selectedUser.id_user);

      const { error } = await supabaseAdmin
        .from("utilisateurs")
        .delete()
        .eq("id_user", selectedUser.id_user);

      if (error) throw error;

      setSuccess("Utilisateur supprimé avec succès!");
      setShowDeleteModal(false);
      loadUsers();
    } catch (error) {
      setError("Erreur lors de la suppression: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le modal de modification
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role_id: user.role_id || user.id_role, // Gère les deux orthographes selon ta BDD
      id_entreprise: user.id_entreprise,
      statut: user.statut,
      mot_de_passe: "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des utilisateurs
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez les comptes utilisateurs et leurs permissions
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un utilisateur
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-6 mt-6">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mx-6 mt-6">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
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
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8">
                    <TableLoader text="Chargement des utilisateurs..." />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id_user} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.nom?.[0]?.toUpperCase()}
                              {user.prenom?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.prenom} {user.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id_user}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-4 h-4 mr-1 text-gray-400" />
                        {user.telephone || "Non renseigné"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {user.roles?.nom_role ||
                            user.roles?.libelle ||
                            "Non défini"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.statut === "actif"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.statut === "actif" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={
                            user.role_id === ADMIN_ROLE_ID ||
                            user.role_id === SUPER_USER_ROLE_ID ||
                            user.id_role === ADMIN_ROLE_ID ||
                            user.id_role === SUPER_USER_ROLE_ID
                          }
                          title={
                            user.role_id === ADMIN_ROLE_ID ||
                            user.role_id === SUPER_USER_ROLE_ID
                              ? "Vous ne pouvez pas supprimer un compte Administrateur ou Super User"
                              : "Supprimer l'utilisateur"
                          }
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

      {/* Modal Ajouter/Modifier */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {showAddModal
                ? "Ajouter un utilisateur"
                : "Modifier un utilisateur"}
            </h2>

            <form
              onSubmit={showAddModal ? handleAddUser : handleEditUser}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="prenom"
                    value={formData.prenom || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle *
                </label>
                <select
                  name="role_id"
                  value={formData.role_id || ""}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un rôle</option>
                  {ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.libelle}
                    </option>
                  ))}
                </select>
              </div>

              {showAddModal && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    name="mot_de_passe"
                    value={formData.mot_de_passe || ""}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading
                    ? "Enregistrement..."
                    : showAddModal
                      ? "Ajouter"
                      : "Modifier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Supprimer */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
              <h2 className="text-xl font-bold">Confirmer la suppression</h2>
            </div>

            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'utilisateur "
              {selectedUser?.prenom} {selectedUser?.nom}" ? Cette action est
              irréversible.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <InlineLoader text="Traitement..." size="sm" />
                ) : (
                  "Supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Utilisateurs;
