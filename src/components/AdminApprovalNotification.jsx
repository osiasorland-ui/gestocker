import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuthHook.js";
import {
  supabase,
  createAdminClient,
  createClient,
} from "../config/supabase.js";
import {
  AlertCircle,
  X,
  RefreshCw,
  Check,
  AlertTriangle,
  User,
  Shield,
  Trash2,
} from "lucide-react";

// Constantes pour les rôles
const SUPER_USER_ROLE_ID = "a033e29c-94f6-4eb3-9243-a9424ec20357";
const ADMIN_ROLE_ID = "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3";

// Fonction pour créer une notification d'approbation quand un Super User modifie un rôle
export const createSuperUserRoleChangeNotification = async (
  targetUserId,
  oldRoleId,
  newRoleId,
  oldRoleName,
  newRoleName,
  targetUserInfo,
  superUserId,
) => {
  try {
    const supabaseAdmin = createAdminClient();

    // Récupérer l'admin pour l'approbation
    const { data: adminUser } = await supabaseAdmin
      .from("utilisateurs")
      .select("id_user")
      .eq("id_role", ADMIN_ROLE_ID)
      .eq("statut", "actif")
      .limit(1)
      .single();

    if (!adminUser) {
      console.warn("Aucun admin actif trouvé pour l'approbation");
      return;
    }

    // Créer la notification d'approbation
    await supabaseAdmin.from("admin_approval_notifications").insert({
      id_super_user: superUserId,
      id_admin: adminUser.id_user,
      id_user_cible: targetUserId,
      action_type: "MODIFICATION_ROLE",
      details: {
        ancien_role_id: oldRoleId,
        nouveau_role_id: newRoleId,
        ancien_role_libelle: oldRoleName,
        nouveau_role_libelle: newRoleName,
        target_user_info: targetUserInfo,
        formulaire_modifications: {
          nom: targetUserInfo.nom,
          prenom: targetUserInfo.prenom,
          email: targetUserInfo.email,
          telephone: targetUserInfo.telephone,
        },
      },
      message: `Un Super User souhaite modifier le rôle de ${targetUserInfo.prenom} ${targetUserInfo.nom} de "${oldRoleName}" à "${newRoleName}"`,
      statut: "EN_ATTENTE",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 heures
    });

    console.log("Notification d'approbation créée pour le Super User");
  } catch (error) {
    console.error(
      "Erreur lors de la création de la notification d'approbation:",
      error,
    );
  }
};

const AdminApprovalNotification = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Vérifier si l'utilisateur est un admin
  const isAdmin = profile?.id_role === "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3";

  // Charger les notifications d'approbation pour l'admin
  const loadNotifications = useCallback(async () => {
    if (!profile?.id_user || !isAdmin) return;

    try {
      const { data, error } = await supabase
        .from("admin_approval_notifications")
        .select("*")
        .eq("id_admin", profile.id_user)
        .eq("statut", "EN_ATTENTE")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "Erreur lors du chargement des notifications admin:",
          error,
        );
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error("Erreur dans loadNotifications:", error);
    }
  }, [profile?.id_user, isAdmin]);

  // Approuver une demande
  const handleApproval = async (notificationId) => {
    setLoading(true);

    try {
      const supabaseAdmin = createAdminClient();

      // Récupérer les détails de la notification
      const { data: notification } = await supabaseAdmin
        .from("admin_approval_notifications")
        .select("*")
        .eq("id_notification", notificationId)
        .single();

      if (!notification) {
        console.error("Notification non trouvée");
        return;
      }

      // Traiter selon le type d'action
      if (notification.action_type === "MODIFICATION_ROLE") {
        // Appliquer les modifications à l'utilisateur
        const { details } = notification;
        const { error: updateError } = await supabaseAdmin
          .from("utilisateurs")
          .update({
            nom: details.formulaire_modifications.nom,
            prenom: details.formulaire_modifications.prenom,
            email: details.formulaire_modifications.email,
            telephone: details.formulaire_modifications.telephone,
            id_role: details.nouveau_role_id,
          })
          .eq("id_user", notification.id_user_cible);

        if (updateError) {
          console.error("Erreur lors de la mise à jour:", updateError);
          throw updateError;
        }

        // Créer une notification de changement de rôle pour l'utilisateur concerné
        await supabaseAdmin.from("role_change_notifications").insert({
          id_user: notification.id_user_cible,
          message: `Votre rôle a été modifié de "${details.ancien_role_libelle}" à "${details.nouveau_role_libelle}". Cliquez ici pour vous reconnecter et appliquer les changements.`,
          ancien_role_id: details.ancien_role_id,
          nouveau_role_id: details.nouveau_role_id,
          expires_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
      } else if (notification.action_type === "SUPPRESSION_USER") {
        // Supprimer l'utilisateur
        const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
          throw new Error("Service role key not configured");
        }

        const supabaseService = createClient(
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

        // Supprimer en cascade
        await supabaseService
          .from("transferts")
          .delete()
          .eq("id_user", notification.id_user_cible);

        await supabaseService
          .from("mouvements_stock")
          .delete()
          .eq("id_user", notification.id_user_cible);

        await supabaseService
          .from("notifications")
          .delete()
          .eq("id_user", notification.id_user_cible);

        const { error: deleteError } = await supabaseService
          .from("utilisateurs")
          .delete()
          .eq("id_user", notification.id_user_cible);

        if (deleteError) {
          console.error("Erreur lors de la suppression:", deleteError);
          throw deleteError;
        }
      }

      // Marquer la notification comme approuvée
      const { error: approvalError } = await supabaseAdmin
        .from("admin_approval_notifications")
        .update({
          statut: "APPROUVE",
          processed_at: new Date().toISOString(),
          processed_by: profile.id_user,
        })
        .eq("id_notification", notificationId);

      if (approvalError) {
        console.error("Erreur lors de l'approbation:", approvalError);
        throw approvalError;
      }

      // Retirer la notification de la liste
      setNotifications((prev) =>
        prev.filter((n) => n.id_notification !== notificationId),
      );

      // Émettre un événement pour rafraîchir les données dans les autres composants
      window.dispatchEvent(
        new CustomEvent("adminApprovalProcessed", {
          detail: {
            action: notification.action_type,
            targetUserId: notification.id_user_cible,
            processed: true,
          },
        }),
      );
    } catch (error) {
      console.error("Erreur lors de l'approbation:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refuser une demande
  const handleRejection = async (notificationId) => {
    setLoading(true);

    try {
      const supabaseAdmin = createAdminClient();

      // Marquer la notification comme refusée
      const { error } = await supabaseAdmin
        .from("admin_approval_notifications")
        .update({
          statut: "REFUSE",
          processed_at: new Date().toISOString(),
          processed_by: profile.id_user,
        })
        .eq("id_notification", notificationId);

      if (error) {
        console.error("Erreur lors du refus:", error);
        throw error;
      }

      // Retirer la notification de la liste
      setNotifications((prev) =>
        prev.filter((n) => n.id_notification !== notificationId),
      );

      // Émettre un événement pour rafraîchir les données dans les autres composants
      window.dispatchEvent(
        new CustomEvent("adminApprovalProcessed", {
          detail: {
            action: "REJECTED",
            targetUserId: notifications.find(
              (n) => n.id_notification === notificationId,
            )?.id_user_cible,
            processed: true,
          },
        }),
      );
    } catch (error) {
      console.error("Erreur lors du refus:", error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les notifications au montage et quand le profil change
  useEffect(() => {
    if (profile?.id_user && isAdmin) {
      loadNotifications();
    }
  }, [profile, isAdmin, loadNotifications]);

  // Rafraîchir les notifications toutes les 30 secondes
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      if (profile?.id_user) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [profile, isAdmin, loadNotifications]);

  // S'il n'y a pas de notifications ou que l'utilisateur n'est pas admin, ne rien afficher
  if (notifications.length === 0 || !isAdmin) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-800">
              Demande d'approbation requise
            </h3>
          </div>
          <button
            onClick={() => loadNotifications()}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Un Super User souhaite effectuer une action. Votre approbation est
            requise.
          </p>

          {notifications.map((notification) => (
            <div
              key={notification.id_notification}
              className="bg-blue-50 rounded-md p-4 border border-blue-200 mb-3"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 mb-2 font-medium">
                    {notification.message}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <User className="w-3 h-3 mr-1" />
                      <span>Demandé par: Super User</span>
                    </div>

                    {notification.action_type === "MODIFICATION_ROLE" ? (
                      <div className="flex items-center text-xs text-gray-600">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        <span>
                          Changement de rôle:{" "}
                          {notification.details?.ancien_role_libelle} →{" "}
                          {notification.details?.nouveau_role_libelle}
                        </span>
                      </div>
                    ) : notification.action_type === "SUPPRESSION_USER" ? (
                      <div className="flex items-center text-xs text-red-600">
                        <Trash2 className="w-3 h-3 mr-1" />
                        <span>
                          Suppression de:{" "}
                          {notification.details?.target_user_info?.prenom}{" "}
                          {notification.details?.target_user_info?.nom} (
                          {notification.details?.target_user_info?.email})
                        </span>
                      </div>
                    ) : null}

                    <div className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString(
                        "fr-FR",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifications((prev) =>
                      prev.filter(
                        (n) =>
                          n.id_notification !== notification.id_notification,
                      ),
                    );
                  }}
                  className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Ignorer cette notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between space-x-2">
                <button
                  onClick={() => handleRejection(notification.id_notification)}
                  disabled={loading}
                  className="px-3 py-2 border border-red-300 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors text-sm"
                >
                  {loading ? "Traitement..." : "Refuser"}
                </button>

                <button
                  onClick={() => handleApproval(notification.id_notification)}
                  disabled={loading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex-1"
                >
                  {loading ? (
                    <div className="inline-flex items-center justify-center">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Traitement...
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center">
                      <Check className="w-4 h-4 mr-2" />
                      {notification.action_type === "SUPPRESSION_USER"
                        ? "Approuver la suppression"
                        : "Approuver"}
                    </div>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            L'approbation appliquera immédiatement les modifications
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminApprovalNotification;
