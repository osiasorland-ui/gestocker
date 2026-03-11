import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Package,
  MapPin,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Building,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react";
import { warehouses, createAdminClient } from "../../config/supabase";
import { useAuth } from "../../hooks/useAuthHook.js";
import TransferModal from "../../components/TransferModal";

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

function Entrepots() {
  const { profile, loading: authLoading } = useAuth();
  const [entrepots, setEntrepots] = useState([]);
  const [gerants, setGerants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAssignGerantModal, setShowAssignGerantModal] = useState(false);
  const [editingEntrepot, setEditingEntrepot] = useState(null);
  const [selectedEntrepot, setSelectedEntrepot] = useState(null);
  const [selectedGerant, setSelectedGerant] = useState("");
  const [formData, setFormData] = useState({
    nom_entrepot: "",
    adresse: "",
    id_gerant: "",
  });
  const [stockFormData, setStockFormData] = useState({
    id_produit: "",
    quantite: "",
    type_mouvement: "entree",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Charger les entrepôts depuis la base de données
  const loadEntrepots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Utiliser le profil depuis useAuth
      if (!profile || !profile.id_entreprise) {
        setError("Utilisateur non connecté ou entreprise non trouvée");
        return;
      }

      console.log("ID entreprise pour les entrepôts:", profile.id_entreprise);

      // Charger les entrepôts de l'entreprise
      const { data, error } = await warehouses.getAll(profile.id_entreprise);

      if (error) {
        setError(error.message);
      } else {
        setEntrepots(data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Charger les gérants simples disponibles pour l'entreprise
  const loadGerants = useCallback(async () => {
    try {
      if (!profile || !profile.id_entreprise) {
        return;
      }

      const supabaseAdmin = createAdminClient();

      // Charger uniquement les utilisateurs avec le rôle "Gerant" (pas les gérants principaux)
      const { data, error } = await supabaseAdmin
        .from("utilisateurs")
        .select(
          `
          id_user,
          nom,
          prenom,
          email,
          roles!inner (
            libelle
          )
        `,
        )
        .eq("id_entreprise", profile.id_entreprise)
        .eq("roles.libelle", "Gerant") // Uniquement les gérants simples
        .eq("statut", "actif");

      if (error) {
        console.error("Erreur lors du chargement des gérants:", error);
      } else {
        console.log("Gérants chargés:", data);
        setGerants(data || []);
      }
    } catch (err) {
      console.error("Erreur dans loadGerants:", err);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && profile) {
      loadEntrepots();
      loadGerants();
    } else if (!authLoading && !profile) {
      setError("Utilisateur non connecté");
      setLoading(false);
    }
  }, [profile, authLoading, loadEntrepots, loadGerants]);

  // Fonction pour ouvrir le modal d'assignation
  const openAssignGerantModal = useCallback((entrepot) => {
    setSelectedEntrepot(entrepot);
    setSelectedGerant("");
    setShowAssignGerantModal(true);
  }, []);

  // Fonction pour fermer le modal d'assignation
  const closeAssignGerantModal = useCallback(() => {
    setShowAssignGerantModal(false);
    setSelectedEntrepot(null);
    setSelectedGerant("");
  }, []);

  // Fonction pour détecter les assignations incorrectes (ne devrait plus être nécessaire avec la nouvelle logique)
  const getIncorrectAssignments = useCallback(() => {
    // Avec la nouvelle logique, seuls les gérants simples sont chargés
    // donc cette fonction sert principalement à détecter les entrepôts sans gérant
    return entrepots.filter((entrepot) => !entrepot.id_gerant);
  }, [entrepots]);

  // Vérifier s'il y a une assignation en attente après le chargement des données
  useEffect(() => {
    if (!loading && entrepots.length > 0) {
      const pendingAssignment = sessionStorage.getItem(
        "pendingWarehouseAssignment",
      );
      if (pendingAssignment) {
        try {
          const assignmentData = JSON.parse(pendingAssignment);
          // Trouver l'entrepôt correspondant dans les données chargées
          const targetEntrepot = entrepots.find(
            (e) => e.id_entrepot === assignmentData.id_entrepot,
          );
          if (targetEntrepot) {
            setTimeout(() => {
              openAssignGerantModal(targetEntrepot);
              sessionStorage.removeItem("pendingWarehouseAssignment"); // Effacer après ouverture
            }, 500);
          }
        } catch (err) {
          console.error(
            "Erreur lors de la lecture de l'assignation en attente:",
            err,
          );
          sessionStorage.removeItem("pendingWarehouseAssignment");
        }
      }
    }
  }, [loading, entrepots, openAssignGerantModal]);

  // Fonction pour valider le changement de rôle d'un gérant
  const validateRoleChange = async (userId, newRoleId) => {
    try {
      const supabaseAdmin = createAdminClient();

      // Vérifier si l'utilisateur gère un entrepôt
      const { data: entrepotGere, error: errorEntrepot } = await supabaseAdmin
        .from("entrepots")
        .select("id_entrepot, nom_entrepot, adresse, id_gerant, id_entreprise")
        .in("id_gerant", [userId]) // Utiliser 'in' avec un tableau
        .maybeSingle(); // Utiliser maybeSingle() pour éviter l'erreur PGRST116

      if (errorEntrepot && errorEntrepot.code !== "PGRST116") {
        console.error(
          "Erreur lors de la vérification de l'entrepôt:",
          errorEntrepot,
        );
        return { valid: true }; // En cas d'erreur, permettre le changement
      }

      // Si l'utilisateur ne gère pas d'entrepôt, permettre le changement
      if (!entrepotGere) {
        return { valid: true };
      }

      // Vérifier le nouveau rôle
      const ROLES = [
        {
          id: "1dd58d9b-ab78-4b62-ac8d-1d6234e89e81",
          libelle: "Gerant Principal",
        },
        { id: "2330adb2-bce2-4d87-81de-15cc2b2cb325", libelle: "Gerant" },
        { id: "2368d31f-4091-4e83-adff-30d7952dad8b", libelle: "Comptable" },
        { id: "550e8400-e29b-41d4-a716-446655440003", libelle: "Employé" },
        { id: "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3", libelle: "Admin" },
        { id: "a033e29c-94f6-4eb3-9243-a9424ec20357", libelle: "Super User" },
        {
          id: "ad7b07cb-2ba3-4ba1-a8d6-f053c6b46b46",
          libelle: "Directeur commercial",
        },
      ];

      const newRole = ROLES.find((r) => r.id === newRoleId);
      const isGerantSimple = newRole?.libelle === "Gerant";
      const isGerantPrincipal = newRole?.libelle === "Gerant Principal";

      // Si le nouveau rôle est un gérant principal, il doit être remplacé car les gérants principaux ne gèrent pas d'entrepôts
      if (isGerantPrincipal) {
        // Continuer vers la logique de remplacement
      } else if (isGerantSimple) {
        // Si le nouveau rôle est encore un gérant simple, permettre le changement
        return { valid: true };
      }

      // Vérifier s'il y a des gérants (simples ou principaux) disponibles pour remplacer
      const usedGerantIds = entrepots.map((e) => e.id_gerant).filter(Boolean);
      const availableGerants = gerants.filter(
        (g) =>
          !usedGerantIds.includes(g.id_user) &&
          g.id_user !== userId &&
          g.roles &&
          (g.roles.libelle === "Gerant" ||
            g.roles.libelle === "Gerant Principal"), // Tous les gérants
      );

      if (!availableGerants.length) {
        return {
          valid: false,
          requiresReplacement: false,
          requiresRedirect: true, // Nouveau flag pour redirection
          entrepot: entrepotGere,
          message: `Impossible de changer le rôle : Aucun gérant de remplacement disponible pour l'entrepôt "${entrepotGere.nom_entrepot}". Veuillez d'abord assigner un gérant disponible à cet entrepôt avant de continuer.`,
        };
      }

      // Demander explicitement de choisir un remplaçant
      return {
        valid: true,
        requiresReplacement: true,
        requiresDirectAssignment: true, // Nouveau flag pour l'assignation directe
        entrepot: entrepotGere,
        availableGerants: availableGerants.filter(
          (g) => g.roles.libelle === "Gerant",
        ), // Uniquement les gérants simples pour l'assignation
        message: `Cet utilisateur gère l'entrepôt "${entrepotGere.nom_entrepot}". Veuillez sélectionner un gérant simple remplaçant avant de continuer.`,
        autoAssignAvailable: availableGerants.length > 0, // Flag pour assignation automatique
      };
    } catch (err) {
      console.error("Erreur dans validateRoleChange:", err);
      return { valid: true }; // En cas d'erreur, permettre le changement
    }
  };

  // État pour la sélection du gérant remplaçant
  const [replacementModal, setReplacementModal] = useState({
    show: false,
    userId: null,
    newRoleId: null,
    entrepot: null,
    availableGerants: [],
    selectedReplacement: "",
    autoAssignAvailable: false,
  });

  // Fonction pour ouvrir le modal de remplacement
  const openReplacementModal = (validation, userId, newRoleId) => {
    setReplacementModal({
      show: true,
      userId: userId,
      newRoleId: newRoleId,
      entrepot: validation.entrepot,
      availableGerants: validation.availableGerants,
      selectedReplacement: "",
      autoAssignAvailable: validation.autoAssignAvailable || false,
    });
  };

  // Fonction pour confirmer le remplacement
  const confirmReplacement = async () => {
    try {
      const supabaseAdmin = createAdminClient();

      // Si autoAssignAvailable est true, assigner automatiquement le premier gérant disponible
      const selectedReplacementId = replacementModal.autoAssignAvailable
        ? replacementModal.availableGerants[0]?.id_user
        : replacementModal.selectedReplacement;

      if (!selectedReplacementId) {
        setError("Aucun gérant sélectionné pour le remplacement");
        return;
      }

      // Assigner le nouveau gérant à l'entrepôt (sans updated_at car la colonne n'existe pas)
      const { error: assignError } = await supabaseAdmin
        .from("entrepots")
        .update({
          id_gerant: selectedReplacementId,
        })
        .eq("id_entrepot", replacementModal.entrepot.id_entrepot);

      if (assignError) {
        console.error(
          "Erreur lors de l'assignation du remplaçant:",
          assignError,
        );
        setError("Erreur lors de l'assignation du nouveau gérant");
        return;
      }

      // Fermer le modal de remplacement
      setReplacementModal({
        show: false,
        userId: null,
        newRoleId: null,
        entrepot: null,
        availableGerants: [],
        selectedReplacement: "",
        autoAssignAvailable: false,
      });

      // Émettre un événement pour recharger les données
      if (typeof window.dispatchEvent === "function") {
        window.dispatchEvent(
          new CustomEvent("roleChanged", {
            detail: {
              userId: replacementModal.userId,
              oldRole: "Gerant",
              newRole: replacementModal.newRoleId,
              userName: "Remplacement de gérant",
              entrepot: replacementModal.entrepot.nom_entrepot,
            },
          }),
        );
      }

      // Retourner succès pour continuer le changement de rôle
      return { success: true };
    } catch (err) {
      console.error("Erreur dans confirmReplacement:", err);
      setError("Erreur lors du remplacement du gérant");
      return { success: false };
    }
  };

  // Fonction pour nettoyer les assignations incorrectes (non-gérants assignés à des entrepôts)
  const cleanupIncorrectAssignments = useCallback(async () => {
    try {
      const supabaseAdmin = createAdminClient();

      // Récupérer tous les entrepôts avec leurs gérants
      const { data: entrepotsWithGerants, error: fetchError } =
        await supabaseAdmin
          .from("entrepots")
          .select(
            `
          id_entrepot,
          nom_entrepot,
          id_gerant,
          utilisateurs!inner (
            id_user,
            nom,
            prenom,
            id_role,
            roles!inner (
              libelle
            )
          )
        `,
          )
          .not("id_gerant", "is", null);

      if (fetchError) {
        console.error("Erreur lors de la récupération des entrepôts:");
        return;
      }

      // Avec la nouvelle logique, cette fonction ne devrait plus trouver d'assignations incorrectes
      // car seuls les gérants simples sont chargés
      const incorrectAssignments = entrepotsWithGerants.filter(
        (entrepot) => entrepot.utilisateurs.roles.libelle !== "Gerant",
      );

      if (incorrectAssignments.length === 0) {
        console.log(
          "Aucune assignation incorrecte trouvée (normal avec la nouvelle logique)",
        );
        return;
      }

      console.log(
        `Trouvé ${incorrectAssignments.length} assignation(s) incorrecte(s) à nettoyer:`,
      );

      try {
        // Désassigner les entrepôts incorrects
        for (const assignment of incorrectAssignments) {
          console.log(
            `Désassignation: ${assignment.nom_entrepot} (${assignment.utilisateurs.prenom} ${assignment.utilisateurs.nom} - ${assignment.utilisateurs.roles.libelle})`,
          );

          const { error: updateError } = await supabaseAdmin
            .from("entrepots")
            .update({ id_gerant: null })
            .eq("id_entrepot", assignment.id_entrepot);

          if (updateError) {
            console.error(
              `Erreur lors de la désassignation de ${assignment.nom_entrepot}:`,
              updateError,
            );
          } else {
            console.log(`✅ ${assignment.nom_entrepot} désassigné avec succès`);
          }
        }

        // Recharger les données
        await loadEntrepots();
      } catch (err) {
        console.error("Erreur dans cleanupIncorrectAssignments:", err);
      }
    } catch (err) {
      console.error("Erreur dans cleanupIncorrectAssignments:", err);
    }
  }, [loadEntrepots]);

  // Fonction pour nettoyer l'assignation d'entrepôt lors du changement de rôle
  const cleanupWarehouseAssignment = async (
    userId,
    oldRoleId,
    newRoleId,
    openAssignmentModal = false,
  ) => {
    try {
      const supabaseAdmin = createAdminClient();

      // Vérifier les rôles pour le nettoyage
      const ROLES = [
        {
          id: "1dd58d9b-ab78-4b62-ac8d-1d6234e89e81",
          libelle: "Gerant Principal",
        },
        { id: "2330adb2-bce2-4d87-81de-15cc2b2cb325", libelle: "Gerant" },
        { id: "2368d31f-4091-4e83-adff-30d7952dad8b", libelle: "Comptable" },
        { id: "550e8400-e29b-41d4-a716-446655440003", libelle: "Employé" },
        { id: "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3", libelle: "Admin" },
        { id: "a033e29c-94f6-4eb3-9243-a9424ec20357", libelle: "Super User" },
        {
          id: "ad7b07cb-2ba3-4ba1-a8d6-f053c6b46b46",
          libelle: "Directeur commercial",
        },
      ];

      const oldRole = ROLES.find((r) => r.id === oldRoleId);
      const newRole = ROLES.find((r) => r.id === newRoleId);
      const wasGerantSimple = oldRole?.libelle === "Gerant";
      const isStillGerant = newRole?.libelle === "Gerant";

      // Si l'utilisateur n'était pas un gérant simple, ou s'il reste un gérant simple, rien à faire
      if (!wasGerantSimple || isStillGerant) {
        return { success: true, needsAssignment: false };
      }

      // Récupérer l'entrepôt assigné avant de le désassigner
      const { data: entrepotData, error: fetchError } = await supabaseAdmin
        .from("entrepots")
        .select("id_entrepot, nom_entrepot, adresse, id_gerant, id_entreprise")
        .in("id_gerant", [userId]) // Utiliser 'in' avec un tableau
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error(
          "Erreur lors de la récupération de l'entrepôt:",
          fetchError,
        );
        return { success: false, needsAssignment: false };
      }

      // Si aucun entrepôt n'est trouvé, l'utilisateur ne gère pas d'entrepôt
      if (!entrepotData) {
        console.log(`Aucun entrepôt trouvé pour l'utilisateur ${userId}`);
        return { success: true, needsAssignment: false };
      }

      // Désassigner l'entrepôt (sans updated_at car la colonne n'existe pas)
      const { error } = await supabaseAdmin
        .from("entrepots")
        .update({
          id_gerant: null,
        })
        .in("id_gerant", [userId]); // Utiliser 'in' avec un tableau

      if (error) {
        console.error("Erreur lors du nettoyage de l'assignation:", error);
        return { success: false, needsAssignment: false };
      } else {
        console.log(
          `Entrepôt désassigné pour l'utilisateur ${userId} (changement de rôle de gérant simple vers ${newRole?.libelle})`,
        );
        // Recharger les entrepôts pour mettre à jour l'affichage
        await loadEntrepots();

        // Si on demande l'ouverture du modal, stocker dans sessionStorage pour la redirection
        if (openAssignmentModal && entrepotData) {
          sessionStorage.setItem(
            "pendingWarehouseAssignment",
            JSON.stringify(entrepotData),
          );
        }

        return { success: true, needsAssignment: true, entrepot: entrepotData };
      }
    } catch (err) {
      console.error("Erreur dans cleanupWarehouseAssignment:", err);
      return { success: false, needsAssignment: false };
    }
  };

  // Exporter les fonctions pour les autres composants
  if (typeof window !== "undefined") {
    window.warehouseValidation = {
      validateRoleChange,
      cleanupWarehouseAssignment,
      cleanupIncorrectAssignments,
      openReplacementModal,
      confirmReplacement,
      refreshWarehouseData: () => {
        console.log("Rechargement des données d'entrepôts demandé");
        loadEntrepots();
        loadGerants();
      },
    };
  }

  // Écouter les changements de rôle depuis d'autres pages
  useEffect(() => {
    const handleRoleChange = () => {
      console.log("Changement de rôle détecté, rechargement des données");
      loadEntrepots();
      loadGerants();
    };

    // S'abonner aux événements de changement de rôle
    window.addEventListener("roleChanged", handleRoleChange);

    // Nettoyage lors du démontage
    return () => {
      window.removeEventListener("roleChanged", handleRoleChange);
    };
  }, [loadEntrepots, loadGerants]);

  // Générer une référence à partir de l'entrepôt pour affichage (séparé du nom)
  const getWarehouseReference = (entrepot) => {
    // Générer une référence basée sur l'index
    const index =
      entrepots.findIndex((e) => e.id_entrepot === entrepot.id_entrepot) + 1;
    const paddedNumber = index.toString().padStart(6, "0");
    return `EN${paddedNumber}`;
  };

  const filteredEntrepots = entrepots.filter(
    (entrepot) =>
      entrepot.nom_entrepot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entrepot.adresse.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profile?.id_entreprise) {
      setError("Utilisateur non connecté");
      return;
    }

    try {
      setError(null);

      if (editingEntrepot) {
        // Mettre à jour l'entrepôt (nom et adresse)
        const { data, error } = await warehouses.update(
          editingEntrepot.id_entrepot,
          {
            nom_entrepot: formData.nom_entrepot,
            adresse: formData.adresse,
          },
        );

        if (error) {
          setError(error.message);
          return;
        }

        // Mettre à jour la liste locale
        setEntrepots(
          entrepots.map((e) =>
            e.id_entrepot === editingEntrepot.id_entrepot
              ? { ...e, ...data }
              : e,
          ),
        );
      } else {
        // Utiliser le nom fourni dans le formulaire
        const warehouseName = formData.nom_entrepot;

        // Trouver un gérant simple disponible (non utilisé par un autre entrepôt)
        // Exclure les gérants principaux de l'assignation automatique
        const usedGerantIds = entrepots.map((e) => e.id_gerant).filter(Boolean);
        const availableGerant = gerants.find(
          (g) =>
            !usedGerantIds.includes(g.id_user) &&
            g.roles &&
            g.roles.libelle === "Gerant", // Uniquement les gérants simples, pas les gérants principaux
        );

        if (!availableGerant) {
          setValidationError(
            "Aucun gérant simple disponible. Tous les gérants simples sont déjà assignés à des entrepôts ou il n'y a que des gérants principaux disponibles.",
          );
          return;
        }

        // Créer un nouvel entrepôt avec le nom du formulaire
        const warehouseData = {
          nom_entrepot: warehouseName,
          adresse: formData.adresse,
          id_gerant: availableGerant.id_user,
          id_entreprise: profile.id_entreprise,
        };

        const { data, error } = await warehouses.create(warehouseData);

        if (error) {
          setError(error.message);
          return;
        }

        // Recharger les entrepôts pour obtenir les infos complètes du gérant
        await loadEntrepots();
      }

      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      nom_entrepot: "",
      adresse: "",
      id_gerant: "",
    });
    setValidationError("");
    setShowAddModal(false);
    setEditingEntrepot(null);
  };

  const handleEdit = (entrepot) => {
    setEditingEntrepot(entrepot);
    setFormData({
      nom_entrepot: entrepot.nom_entrepot,
      adresse: entrepot.adresse,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id_entrepot) => {
    const entrepot = entrepots.find((e) => e.id_entrepot === id_entrepot);

    if (!profile?.id_entreprise) {
      setError("Utilisateur non connecté");
      return;
    }

    // Vérifier si l'entrepôt contient des produits (simulation pour l'instant)
    if (entrepot.nombre_produits > 0) {
      alert(
        `Impossible de supprimer cet entrepôt car il contient ${entrepot.nombre_produits} produit(s).`,
      );
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cet entrepôt ?")) {
      try {
        setError(null);

        const { error } = await warehouses.delete(id_entrepot);

        if (error) {
          setError(error.message);
          return;
        }

        // Supprimer de la liste locale
        setEntrepots(entrepots.filter((e) => e.id_entrepot !== id_entrepot));
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    // Simuler l'ajout de stock
    alert(
      `${stockFormData.quantite} unité(s) ${stockFormData.type_mouvement === "entree" ? "ajoutée(s)" : "retirée(s)"} dans l'entrepôt ${selectedEntrepot?.nom_entrepot}`,
    );
    resetStockForm();
  };

  const resetStockForm = () => {
    setStockFormData({
      id_produit: "",
      quantite: "",
      type_mouvement: "entree",
    });
    setShowStockModal(false);
    setSelectedEntrepot(null);
  };

  // Fonction pour assigner un gérant à un entrepôt existant
  const handleAssignGerant = async () => {
    if (!selectedEntrepot || !selectedGerant) {
      setError("Veuillez sélectionner un gérant");
      return;
    }

    try {
      setError(null);
      const supabaseAdmin = createAdminClient();

      // Assigner le gérant à l'entrepôt
      const { error } = await supabaseAdmin
        .from("entrepots")
        .update({
          id_gerant: selectedGerant,
        })
        .eq("id_entrepot", selectedEntrepot.id_entrepot);

      if (error) {
        setError(error.message);
        return;
      }

      // Recharger les données
      await loadEntrepots();

      // Fermer le modal et réinitialiser
      setShowAssignGerantModal(false);
      setSelectedEntrepot(null);
      setSelectedGerant("");

      // Afficher un message de succès
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6 mx-auto p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Entrepôts
          </h1>
          <p className="text-gray-600">Gérez vos entrepôts et leurs stocks</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transférer un stock
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter un entrepôt
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Entrepôts
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {entrepots.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Produits
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {entrepots.reduce(
                  (total, entrepot) => total + (entrepot.nombre_produits || 0),
                  0,
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {entrepots.reduce(
                  (total, entrepot) => total + (entrepot.stock_total || 0),
                  0,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section : Entrepôts sans gérant */}
      {(() => {
        const entrepotsSansGerant = entrepots.filter((e) => !e.id_gerant);
        if (entrepotsSansGerant.length === 0) return null;

        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-800">
                Entrepôts sans gérant ({entrepotsSansGerant.length})
              </h3>
            </div>
            <p className="text-amber-700 mb-4">
              Les entrepôts suivants n'ont pas de gérant assigné. Veuillez leur
              assigner un gérant pour assurer une bonne gestion.
            </p>
            <div className="space-y-2">
              {entrepotsSansGerant.map((entrepot) => (
                <div
                  key={entrepot.id_entrepot}
                  className="bg-white rounded-lg p-4 border border-amber-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {entrepot.nom_entrepot}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {entrepot.adresse}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Stock : {entrepot.stock_total || 0} unités
                      </p>
                    </div>
                    <button
                      onClick={() => openAssignGerantModal(entrepot)}
                      className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm"
                    >
                      Assigner un gérant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Section : Nettoyage des assignations incorrectes */}
      {(() => {
        const incorrectAssignments = getIncorrectAssignments();
        if (incorrectAssignments.length === 0) return null;

        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">
                Nettoyage des assignations incorrectes
              </h3>
            </div>
            <p className="text-red-700 mb-4">
              Certains entrepôts sont assignés à des utilisateurs qui ne sont
              pas des gérants simples (Comptables, Gérants Principaux, etc.).
              Cliquez sur le bouton ci-dessous pour corriger automatiquement ces
              assignations.
            </p>
            <button
              onClick={cleanupIncorrectAssignments}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              Nettoyer les assignations incorrectes
            </button>
          </div>
        );
      })()}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading || authLoading ? (
        <PageLoader text="Chargement des entrepôts..." />
      ) : null}

      {/* Search */}
      {!loading && !authLoading && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un entrepôt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      )}

      {/* Entrepots Table */}
      {!loading && !authLoading && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom de l'entrepôt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gérant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntrepots.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        {searchTerm
                          ? "Aucun entrepôt trouvé pour cette recherche"
                          : "Aucun entrepôt trouvé"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntrepots.map((entrepot) => (
                    <tr key={entrepot.id_entrepot} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getWarehouseReference(entrepot)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {entrepot.nom_entrepot}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>
                            {entrepot.gerant_nom
                              ? `${entrepot.gerant_prenom} ${entrepot.gerant_nom}`
                              : "Non assigné"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">
                            {entrepot.adresse || "Adresse non spécifiée"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entrepot.created_at).toLocaleDateString(
                          "fr-FR",
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {entrepot.nombre_produits || 0}
                        </div>
                        <div className="text-xs text-gray-500">Produits</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {entrepot.stock_total || 0}
                        </div>
                        <div className="text-xs text-gray-500">Unités</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(entrepot)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entrepot.id_entrepot)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Add/Edit Entrepot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingEntrepot ? "Modifier l'entrepôt" : "Ajouter un entrepôt"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entrepôt *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_entrepot}
                  onChange={(e) =>
                    setFormData({ ...formData, nom_entrepot: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Ex: Entrepôt Principal, Dépôt Nord..."
                />
              </div>

              {!editingEntrepot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gérant de l'entrepôt *
                  </label>
                  <select
                    required
                    value={formData.id_gerant}
                    onChange={(e) =>
                      setFormData({ ...formData, id_gerant: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un gérant disponible</option>
                    {gerants
                      .filter(
                        (gerant) =>
                          gerant.roles &&
                          gerant.roles.libelle === "Gerant" &&
                          !entrepots.some(
                            (e) => e.id_gerant === gerant.id_user,
                          ),
                      )
                      .map((gerant) => (
                        <option key={gerant.id_user} value={gerant.id_user}>
                          {gerant.prenom} {gerant.nom} - {gerant.email}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <textarea
                  value={formData.adresse}
                  onChange={(e) => {
                    setFormData({ ...formData, adresse: e.target.value });
                    setValidationError(""); // Effacer l'erreur lors de la saisie
                  }}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                    validationError
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  placeholder="Adresse de l'entrepôt"
                />
                {validationError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {validationError}
                  </p>
                )}
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
                  {editingEntrepot ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && selectedEntrepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Gérer le stock - {selectedEntrepot.nom_entrepot}
            </h2>
            <form onSubmit={handleStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de mouvement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setStockFormData({
                        ...stockFormData,
                        type_mouvement: "entree",
                      })
                    }
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      stockFormData.type_mouvement === "entree"
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Entrée
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStockFormData({
                        ...stockFormData,
                        type_mouvement: "sortie",
                      })
                    }
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      stockFormData.type_mouvement === "sortie"
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Sortie
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit *
                </label>
                <select
                  required
                  value={stockFormData.id_produit}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      id_produit: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Sélectionner un produit</option>
                  <option value="prod1">Ordinateur Portable</option>
                  <option value="prod2">Clavier USB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={stockFormData.quantite}
                  onChange={(e) =>
                    setStockFormData({
                      ...stockFormData,
                      quantite: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetStockForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  {stockFormData.type_mouvement === "entree"
                    ? "Ajouter"
                    : "Retirer"}{" "}
                  le stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de remplacement de gérant */}
      {replacementModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Sélectionner un gérant remplaçant
            </h2>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 mb-1">
                    Remplacement requis
                  </p>
                  <p className="text-amber-700">
                    L'utilisateur gère actuellement l'entrepôt{" "}
                    <strong>{replacementModal.entrepot?.nom_entrepot}</strong>.
                    Veuillez sélectionner un gérant remplaçant parmi les
                    disponibles.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await confirmReplacement();
                if (result?.success) {
                  // Continuer avec le changement de rôle
                  const supabaseAdmin = createAdminClient();
                  await supabaseAdmin
                    .from("utilisateurs")
                    .update({ id_role: replacementModal.newRoleId })
                    .eq("id_user", replacementModal.userId);

                  // Fermer le modal et recharger
                  setReplacementModal({
                    show: false,
                    userId: null,
                    newRoleId: null,
                    entrepot: null,
                    availableGerants: [],
                    selectedReplacement: "",
                  });

                  // Recharger les utilisateurs si on est sur la page des utilisateurs
                  if (typeof window.loadUsers === "function") {
                    window.loadUsers();
                  }
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gérant remplaçant *
                </label>
                <select
                  required
                  value={replacementModal.selectedReplacement}
                  onChange={(e) =>
                    setReplacementModal({
                      ...replacementModal,
                      selectedReplacement: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Sélectionner un gérant</option>
                  {replacementModal.availableGerants.map((gerant) => (
                    <option key={gerant.id_user} value={gerant.id_user}>
                      {gerant.prenom} {gerant.nom} - {gerant.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() =>
                    setReplacementModal({
                      show: false,
                      userId: null,
                      newRoleId: null,
                      entrepot: null,
                      availableGerants: [],
                      selectedReplacement: "",
                    })
                  }
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!replacementModal.selectedReplacement}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer le remplacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'assignation de gérant */}
      {showAssignGerantModal && selectedEntrepot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Assigner un gérant à {selectedEntrepot.nom_entrepot}
            </h2>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Entrepôt : {selectedEntrepot.nom_entrepot}
              </p>
              <p className="text-sm text-gray-600">
                Adresse : {selectedEntrepot.adresse}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gérant disponible *
              </label>
              <select
                required
                value={selectedGerant}
                onChange={(e) => setSelectedGerant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="">Sélectionner un gérant disponible</option>
                {gerants
                  .filter(
                    (gerant) =>
                      gerant.roles &&
                      gerant.roles.libelle === "Gerant" && // Uniquement les gérants simples
                      !entrepots.some((e) => e.id_gerant === gerant.id_user), // Non assignés à d'autres entrepôts
                  )
                  .map((gerant) => (
                    <option key={gerant.id_user} value={gerant.id_user}>
                      {gerant.prenom} {gerant.nom} - {gerant.email}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAssignGerantModal}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAssignGerant}
                disabled={!selectedGerant}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => {
          // Rafraîchir les données si nécessaire
          loadEntrepots();
        }}
      />
    </div>
  );
}

export default Entrepots;
