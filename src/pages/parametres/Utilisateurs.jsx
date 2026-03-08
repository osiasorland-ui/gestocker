import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuthHook.js";
import { createAdminClient } from "../../config/supabase.js";
import {
  Edit,
  Trash2,
  UserPlus,
  AlertCircle,
  Check,
  X,
  Users,
  Upload,
} from "lucide-react";

// Import des composants UI
import Loader, {
  PageLoader,
  TableLoader,
  InlineLoader,
  CardLoader,
} from "../../components/ui/Loader";

// Import des nouveaux composants
import StatsUsers from "./StatsUsers.jsx";
import FiltragesUsers from "./FiltragesUsers.jsx";
import TableUsers from "./TableUsers.jsx";

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

// Filtrer les rôles disponibles selon le rôle de l'utilisateur connecté
const getAvailableRoles = (currentUser) => {
  if (!currentUser) return ROLES;

  const userRoleId = currentUser.role_id || currentUser.id_role;

  // Si l'utilisateur est Admin, exclure seulement le rôle Admin (mais peut créer Super User)
  if (userRoleId === ADMIN_ROLE_ID) {
    return ROLES.filter((role) => role.id !== ADMIN_ROLE_ID);
  }

  // Si l'utilisateur est Super User, exclure Admin et Super User (ne peut créer que des rangs inférieurs)
  if (userRoleId === SUPER_USER_ROLE_ID) {
    return ROLES.filter(
      (role) => role.id !== ADMIN_ROLE_ID && role.id !== SUPER_USER_ROLE_ID,
    );
  }

  // Sinon, retourner tous les rôles
  return ROLES;
};

// Vérifier si l'utilisateur connecté est Admin ou Super User
const isRestrictedUser = (currentUser) => {
  if (!currentUser) return false;

  const userRoleId = currentUser.role_id || currentUser.id_role;
  return userRoleId === ADMIN_ROLE_ID || userRoleId === SUPER_USER_ROLE_ID;
};

// Obtenir le message d'information selon le rôle de l'utilisateur
const getRestrictionMessage = (currentUser) => {
  if (!currentUser) return "";

  const userRoleId = currentUser.role_id || currentUser.id_role;

  if (userRoleId === ADMIN_ROLE_ID) {
    return "En tant qu'Admin, vous ne pouvez pas créer d'autres Admin";
  }

  if (userRoleId === SUPER_USER_ROLE_ID) {
    return "En tant que Super User, vous ne pouvez créer que des utilisateurs de rang inférieur";
  }

  return "";
};

const Utilisateurs = () => {
  const { profile, auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [selectedBulkRole, setSelectedBulkRole] = useState("");
  const [bulkUsers, setBulkUsers] = useState("");

  // États pour les filtres
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Formulaire pour ajouter/modifier un utilisateur
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    role_id: "",
    id_entreprise: profile?.id_entreprise || "",
    statut: "actif",
    mot_de_passe: "",
  });

  // Charger la liste des utilisateurs
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Utiliser le client admin pour éviter les problèmes de permissions
      const supabaseAdmin = createAdminClient();

      const { data, error } = await supabaseAdmin
        .from("utilisateurs")
        .select(
          `
          *,
          roles (*),
          entreprises (*)
        `,
        )
        .eq("id_entreprise", profile?.id_entreprise) // Filtre restauré
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur détaillée:", error);
        throw error;
      }

      setUsersList(data || []);
    } catch (error) {
      console.error("Erreur complète loadUsers:", error);
      setError("Erreur lors du chargement des utilisateurs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.id_entreprise) {
      loadUsers();
    }
  }, [profile?.id_entreprise, loadUsers]);

  // Écouter les événements de rafraîchissement après approbation admin
  useEffect(() => {
    const handleAdminApprovalProcessed = (event) => {
      console.log("Événement adminApprovalProcessed reçu:", event.detail);
      // Rafraîchir la liste des utilisateurs après une approbation
      loadUsers();
    };

    window.addEventListener(
      "adminApprovalProcessed",
      handleAdminApprovalProcessed,
    );

    // Nettoyer l'écouteur d'événements
    return () => {
      window.removeEventListener(
        "adminApprovalProcessed",
        handleAdminApprovalProcessed,
      );
    };
  }, [loadUsers]);

  // Filtrer les utilisateurs selon le rôle de l'utilisateur connecté
  const filteredUsers = usersList
    .filter((user) => {
      // Personne ne peut se voir lui-même
      if (user.id_user === profile?.id_user) {
        return false; // L'utilisateur ne peut pas se voir lui-même
      }

      // Le Super User ne peut pas voir l'Admin
      const currentUserRoleId = profile?.id_role || profile?.role_id;
      const targetUserRoleId = user.role_id || user.id_role;

      if (
        currentUserRoleId === SUPER_USER_ROLE_ID &&
        targetUserRoleId === ADMIN_ROLE_ID
      ) {
        return false; // Super User ne peut pas voir l'Admin
      }

      // Les Super Users ne peuvent pas se voir entre eux
      if (
        currentUserRoleId === SUPER_USER_ROLE_ID &&
        targetUserRoleId === SUPER_USER_ROLE_ID
      ) {
        return false; // Super User ne peut pas voir les autres Super Users
      }

      return true; // Pour tous les autres cas, afficher l'utilisateur
    })
    .filter((user) => {
      // Filtre par rôle
      if (
        filterRole &&
        user.role_id !== filterRole &&
        user.id_role !== filterRole
      ) {
        return false;
      }
      return true;
    })
    .filter((user) => {
      // Filtre par statut
      if (filterStatus && user.statut !== filterStatus) {
        return false;
      }
      return true;
    })
    .filter(
      // Filtrer par terme de recherche (uniquement nom et prénom)
      (user) =>
        user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.prenom?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  // Calculer les statistiques basées sur les utilisateurs affichés (filteredUsers)
  const totalUsers = filteredUsers.length;
  const activeUsers = filteredUsers.filter(
    (user) => user.statut === "actif",
  ).length;
  const inactiveUsers = filteredUsers.filter(
    (user) => user.statut === "inactif",
  ).length;

  // Gérer le changement des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Mettre le nom en majuscules automatiquement
    const processedValue = name === "nom" ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Valider le champ en temps réel et effacer l'erreur si le champ est valide
    if (fieldErrors[name]) {
      const newFieldErrors = { ...fieldErrors };

      // Validation simple pour effacer l'erreur si le champ est rempli
      if (name === "nom" || name === "prenom") {
        if (processedValue.trim() !== "") {
          delete newFieldErrors[name];
        }
      } else if (name === "email") {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (processedValue.trim() !== "" && emailRegex.test(processedValue)) {
          delete newFieldErrors[name];
        }
      } else if (name === "telephone") {
        const phoneRegex = /^\+229\d{10}$/;
        if (processedValue.trim() !== "" && phoneRegex.test(processedValue)) {
          delete newFieldErrors[name];
        }
      } else if (name === "role_id") {
        if (processedValue.trim() !== "") {
          delete newFieldErrors[name];
        }
      } else if (name === "mot_de_passe" && showAddModal) {
        if (
          processedValue.length >= 8 &&
          /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(processedValue)
        ) {
          delete newFieldErrors[name];
        }
      }

      setFieldErrors(newFieldErrors);
    }
  };

  // Validations du formulaire
  const validateForm = () => {
    const errors = {};

    // Validation nom (non vide)
    if (!formData.nom || formData.nom.trim() === "") {
      errors.nom = "Le nom est obligatoire";
    }

    // Validation prénom (non vide)
    if (!formData.prenom || formData.prenom.trim() === "") {
      errors.prenom = "Le prénom est obligatoire";
    }

    // Validation email (format strict)
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!formData.email || formData.email.trim() === "") {
      errors.email = "L'email est obligatoire";
    } else if (!emailRegex.test(formData.email)) {
      errors.email =
        "L'email doit avoir un format valide (ex: nom@domaine.com)";
    }

    // Validation téléphone (format +2290141381577)
    const phoneRegex = /^\+229\d{10}$/;
    if (!formData.telephone || formData.telephone.trim() === "") {
      errors.telephone = "Le téléphone est obligatoire";
    } else if (!phoneRegex.test(formData.telephone)) {
      errors.telephone = "Le téléphone doit avoir le format +2290141381577";
    }

    // Validation rôle (non vide)
    if (!formData.role_id || formData.role_id.trim() === "") {
      errors.role_id = "Le rôle est obligatoire";
    }

    // Validation mot de passe (uniquement pour l'ajout)
    if (showAddModal) {
      if (!formData.mot_de_passe || formData.mot_de_passe.trim() === "") {
        errors.mot_de_passe = "Le mot de passe est obligatoire";
      } else if (formData.mot_de_passe.length < 8) {
        errors.mot_de_passe =
          "Le mot de passe doit contenir au moins 8 caractères";
      } else if (
        !/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(formData.mot_de_passe)
      ) {
        errors.mot_de_passe =
          "Le mot de passe doit contenir au moins une majuscule, des chiffres et des lettres (sans caractères spéciaux)";
      }
    }

    return errors;
  };

  // Validations pour la modification (sans le mot de passe)
  const validateEditForm = () => {
    const errors = {};

    // Validation nom (non vide)
    if (!formData.nom || formData.nom.trim() === "") {
      errors.nom = "Le nom est obligatoire";
    }

    // Validation prénom (non vide)
    if (!formData.prenom || formData.prenom.trim() === "") {
      errors.prenom = "Le prénom est obligatoire";
    }

    // Validation email (format strict)
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!formData.email || formData.email.trim() === "") {
      errors.email = "L'email est obligatoire";
    } else if (!emailRegex.test(formData.email)) {
      errors.email =
        "L'email doit avoir un format valide (ex: nom@domaine.com)";
    }

    // Validation téléphone (format +2290141381577)
    const phoneRegex = /^\+229\d{10}$/;
    if (!formData.telephone || formData.telephone.trim() === "") {
      errors.telephone = "Le téléphone est obligatoire";
    } else if (!phoneRegex.test(formData.telephone)) {
      errors.telephone = "Le téléphone doit avoir le format +2290141381577";
    }

    // Validation rôle (non vide)
    if (!formData.role_id || formData.role_id.trim() === "") {
      errors.role_id = "Le rôle est obligatoire";
    }

    return errors;
  };

  // Ajouter un utilisateur
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setFieldErrors({});

    // Valider le formulaire
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Utiliser le client admin pour créer directement dans la table utilisateurs
      const supabaseAdmin = createAdminClient();

      // D'abord créer l'entrée dans la table utilisateurs
      const { data: userData, error: dbError } = await supabaseAdmin
        .from("utilisateurs")
        .insert({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone || null,
          mot_de_passe: formData.mot_de_passe,
          id_role: formData.role_id,
          id_entreprise: formData.id_entreprise,
          statut: formData.statut,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Ensuite créer l'utilisateur dans Supabase Auth (optionnel, pour la connexion)
      try {
        const { error: authError } = await auth.signUp(
          formData.email,
          formData.mot_de_passe,
          {
            data: {
              id_user: userData.id_user,
              nom: formData.nom,
              prenom: formData.prenom,
              telephone: formData.telephone || null,
              id_role: formData.role_id,
              id_entreprise: formData.id_entreprise,
              statut: formData.statut,
              current_user_email: profile?.email,
              is_user_creation: true,
            },
          },
        );

        if (authError) {
          console.warn("Erreur création auth Supabase:", authError);
          // Ne pas bloquer si l'auth échoue, l'utilisateur est déjà dans la BDD
        }
      } catch (authError) {
        console.warn("Erreur création auth Supabase:", authError);
        // Ne pas bloquer si l'auth échoue, l'utilisateur est déjà dans la BDD
      }

      setSuccess("Utilisateur créé avec succès!");
      setShowAddModal(false);
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        role_id: "",
        id_entreprise: profile?.id_entreprise || "",
        statut: "actif",
        mot_de_passe: "",
      });
      setFieldErrors({});
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
    setFieldErrors({});

    // Valider le formulaire (sans la validation du mot de passe pour la modification)
    const validationErrors = validateEditForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Utiliser le client admin pour éviter les problèmes de permissions
      const supabaseAdmin = createAdminClient();

      const { error } = await supabaseAdmin
        .from("utilisateurs")
        .update({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          telephone: formData.telephone || null,
          id_role: formData.role_id,
        })
        .eq("id_user", selectedUser.id_user);

      if (error) throw error;

      setSuccess("Utilisateur modifié avec succès!");
      setShowEditModal(false);
      setFieldErrors({});
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

      // Utiliser le client admin pour éviter les problèmes de permissions
      const supabaseAdmin = createAdminClient();

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
      role_id: user.role_id || user.id_role,
      id_entreprise: user.id_entreprise,
      statut: user.statut || "actif",
      mot_de_passe: "",
    });
    setShowEditModal(true);
  };

  // Traiter l'ajout en masse d'utilisateurs
  const handleBulkAddUsers = async () => {
    if (!selectedBulkRole) {
      setError("Veuillez sélectionner un rôle pour les utilisateurs");
      return;
    }

    if (!bulkUsers.trim()) {
      setError("Veuillez entrer au moins un utilisateur");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabaseAdmin = createAdminClient();
      const lines = bulkUsers
        .trim()
        .split("\n")
        .filter((line) => line.trim());
      const usersToInsert = [];
      const errors = [];

      // Parser chaque ligne CSV
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(",").map((part) =>
          part
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^"(.*)$/, "$1"),
        );

        if (parts.length !== 5) {
          errors.push(
            `Ligne ${i + 1}: Format incorrect. Attendu: nom,prenom,email,telephone,mot_de_passe`,
          );
          continue;
        }

        const [nom, prenom, email, telephone, mot_de_passe] = parts;

        // Validation basique
        if (!nom || !prenom || !email || !mot_de_passe) {
          errors.push(`Ligne ${i + 1}: Champs obligatoires manquants`);
          continue;
        }

        // Validation email stricte selon la base de données
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(email)) {
          errors.push(`Ligne ${i + 1}: Email invalide - ${email}`);
          continue;
        }

        usersToInsert.push({
          nom: nom.toUpperCase(),
          prenom: prenom,
          email: email.toLowerCase(),
          telephone: telephone || null,
          mot_de_passe: mot_de_passe,
          id_role: selectedBulkRole,
          id_entreprise: profile?.id_entreprise,
          statut: "actif",
        });
      }

      if (errors.length > 0) {
        setError(`Erreurs de formatage:\n${errors.join("\n")}`);
        setLoading(false);
        return;
      }

      // Insérer les utilisateurs en lot
      const { error } = await supabaseAdmin
        .from("utilisateurs")
        .insert(usersToInsert)
        .select();

      if (error) {
        console.error("Erreur lors de l'ajout en masse:", error);
        setError(`Erreur lors de l'ajout: ${error.message}`);
      } else {
        setSuccess(
          `${usersToInsert.length} utilisateur(s) ajouté(s) avec succès!`,
        );
        setShowBulkAddModal(false);
        setSelectedBulkRole("");
        setBulkUsers("");
        loadUsers(); // Rafraîchir la liste
      }
    } catch (error) {
      console.error("Erreur dans handleBulkAddUsers:", error);
      setError(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut d'un utilisateur
  const handleToggleStatus = async (user) => {
    setLoading(true);
    setError("");

    try {
      const supabaseAdmin = createAdminClient();
      const newStatus = user.statut === "actif" ? "inactif" : "actif";

      const { error } = await supabaseAdmin
        .from("utilisateurs")
        .update({ statut: newStatus })
        .eq("id_user", user.id_user);

      if (error) throw error;

      setSuccess(
        `Utilisateur ${newStatus === "actif" ? "activé" : "désactivé"} avec succès!`,
      );
      loadUsers();
    } catch (error) {
      setError("Erreur lors du changement de statut: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 mx-auto">
      {/* Header */}
      {loading && <PageLoader text="Chargement des utilisateurs..." />}

      {!loading && (
        <>
          {" "}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion des utilisateurs
                </h1>
                <p className="mt-2 text-gray-600">
                  Gérez les comptes utilisateurs et leurs permissions
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex gap-3">
                <button
                  onClick={() => setShowBulkAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ajouter une liste d'utilisateurs
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(true);
                    setFormData({
                      nom: "",
                      prenom: "",
                      email: "",
                      telephone: "",
                      role_id: "",
                      id_entreprise: profile?.id_entreprise || "",
                      statut: "actif",
                      mot_de_passe: "",
                    });
                    setFieldErrors({});
                    setError("");
                    setSuccess("");
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter un utilisateur
                </button>
              </div>
            </div>
          </div>
          {/* Messages d'alerte */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            </div>
          )}
          {/* Section 1: Statistiques */}
          <div className="mb-8">
            <StatsUsers
              totalUsers={totalUsers}
              activeUsers={activeUsers}
              inactiveUsers={inactiveUsers}
            />
          </div>
          {/* Section 2: Filtres et recherche */}
          <div className="mb-8">
            <FiltragesUsers
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              availableRoles={getAvailableRoles(profile)}
            />
          </div>
          {/* Section 3: Tableau des utilisateurs */}
          <div className="p-6 bg-white rounded-lg shadow">
            <TableUsers
              loading={loading}
              filteredUsers={filteredUsers}
              profile={profile}
              SUPER_USER_ROLE_ID={SUPER_USER_ROLE_ID}
              ADMIN_ROLE_ID={ADMIN_ROLE_ID}
              onToggleStatus={handleToggleStatus}
              onEditUser={openEditModal}
              onDeleteUser={(user) => {
                setSelectedUser(user);
                setShowDeleteModal(true);
              }}
            />
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
                        style={{
                          textTransform: "uppercase",
                          borderColor: fieldErrors.nom ? "#ef4444" : undefined,
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          fieldErrors.nom ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.nom && (
                        <p className="mt-1 text-xs text-red-500">
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
                        name="prenom"
                        value={formData.prenom || ""}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          fieldErrors.prenom
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.prenom && (
                        <p className="mt-1 text-xs text-red-500">
                          {fieldErrors.prenom}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="exemple@email.com"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone || ""}
                      onChange={handleInputChange}
                      required
                      placeholder="+2290141381577"
                      pattern="\+229\d{10}"
                      title="Format: +2290141381577"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.telephone
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.telephone && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.telephone}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Format: +2290141381577
                    </p>
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
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.role_id
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">Sélectionner un rôle</option>
                      {getAvailableRoles(profile).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.libelle}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.role_id && (
                      <p className="mt-1 text-xs text-red-500">
                        {fieldErrors.role_id}
                      </p>
                    )}
                    {isRestrictedUser(profile) &&
                      getRestrictionMessage(profile) && (
                        <p className="mt-1 text-xs text-amber-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {getRestrictionMessage(profile)}
                        </p>
                      )}
                  </div>

                  {showAddModal && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe *
                      </label>
                      <input
                        type="password"
                        name="mot_de_passe"
                        value={formData.mot_de_passe}
                        onChange={handleInputChange}
                        required
                        minLength="8"
                        pattern="(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}"
                        title="8+ caractères, au moins une majuscule, des chiffres et des lettres (sans caractères spéciaux)"
                        placeholder="Entrez un mot de passe sécurisé"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          fieldErrors.mot_de_passe
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.mot_de_passe && (
                        <p className="mt-1 text-xs text-red-500">
                          {fieldErrors.mot_de_passe}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        8+ caractères, au moins une majuscule, des chiffres et
                        des lettres (sans caractères spéciaux)
                      </p>
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
                        setFieldErrors({});
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
                  <h2 className="text-xl font-bold">
                    Confirmer la suppression
                  </h2>
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
          {/* Modal Ajout en masse d'utilisateurs */}
          {showBulkAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Ajouter une liste d'utilisateurs
                  </h2>
                  <button
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setSelectedBulkRole("");
                      setBulkUsers("");
                      setError("");
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Sélection du rôle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quel type d'utilisateurs voulez-vous ajouter ? *
                    </label>
                    <select
                      value={selectedBulkRole}
                      onChange={(e) => setSelectedBulkRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Sélectionner un rôle</option>
                      {getAvailableRoles(profile).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.libelle}
                        </option>
                      ))}
                    </select>
                    {isRestrictedUser(profile) &&
                      getRestrictionMessage(profile) && (
                        <p className="mt-2 text-xs text-amber-600 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {getRestrictionMessage(profile)}
                        </p>
                      )}
                  </div>

                  {/* Instructions */}
                  {selectedBulkRole && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">
                        Instructions de formatage
                      </h3>
                      <p className="text-sm text-blue-800 mb-3">
                        Veuillez entrer les utilisateurs au format CSV avec les
                        colonnes suivantes :
                      </p>
                      <div className="bg-white rounded p-3 text-xs font-mono">
                        nom,prenom,email,telephone,mot_de_passe
                      </div>
                      <p className="text-sm text-blue-800 mt-3">
                        Exemple : <br />
                        <code className="bg-gray-100 px-2 py-1 rounded">
                          DUPONT,Jean,jean.dupont@email.com,+22901234567,password123
                        </code>
                      </p>
                    </div>
                  )}

                  {/* Zone de texte pour la liste */}
                  {selectedBulkRole && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Liste des utilisateurs (
                        {
                          getAvailableRoles(profile).find(
                            (r) => r.id === selectedBulkRole,
                          )?.libelle
                        }
                        ) *
                      </label>
                      <textarea
                        value={bulkUsers}
                        onChange={(e) => setBulkUsers(e.target.value)}
                        placeholder="Entrez la liste des utilisateurs au format CSV..."
                        rows={10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        required
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        {
                          bulkUsers.split("\n").filter((line) => line.trim())
                            .length
                        }{" "}
                        utilisateur(s) détecté(s)
                      </p>
                    </div>
                  )}

                  {/* Messages d'erreur */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <span className="text-red-700 text-sm">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Boutons d'action */}
                  {selectedBulkRole && (
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          setShowBulkAddModal(false);
                          setSelectedBulkRole("");
                          setBulkUsers("");
                          setError("");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleBulkAddUsers}
                        disabled={loading || !bulkUsers.trim()}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Traitement en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Ajouter{" "}
                            {
                              bulkUsers
                                .split("\n")
                                .filter((line) => line.trim()).length
                            }{" "}
                            utilisateur(s)
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Utilisateurs;
