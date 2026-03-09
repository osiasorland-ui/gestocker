import { useState } from "react";
import { createAdminClient } from "../../config/supabase.js";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";

const ForcePasswordChangeModal = ({ user, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Effacer les erreurs en temps réel
    if (fieldErrors[name]) {
      const newFieldErrors = { ...fieldErrors };
      delete newFieldErrors[name];
      setFieldErrors(newFieldErrors);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Validation mot de passe actuel
    if (!formData.currentPassword || formData.currentPassword.trim() === "") {
      errors.currentPassword = "Le mot de passe actuel est obligatoire";
    }

    // Validation nouveau mot de passe
    if (!formData.newPassword || formData.newPassword.trim() === "") {
      errors.newPassword = "Le nouveau mot de passe est obligatoire";
    } else if (formData.newPassword.length < 8) {
      errors.newPassword =
        "Le mot de passe doit contenir au moins 8 caractères";
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(formData.newPassword)
    ) {
      errors.newPassword =
        "Le mot de passe doit contenir au moins une majuscule, des chiffres et des lettres (sans caractères spéciaux)";
    }

    // Validation confirmation
    if (!formData.confirmPassword || formData.confirmPassword.trim() === "") {
      errors.confirmPassword =
        "La confirmation du mot de passe est obligatoire";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Valider le formulaire
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const supabaseAdmin = createAdminClient();

      // Vérifier d'abord que le mot de passe actuel est correct
      const { data: userData, error: verifyError } = await supabaseAdmin.rpc(
        "verify_user_password",
        {
          p_email: user.email,
          p_password: formData.currentPassword,
        },
      );

      if (verifyError || !userData || userData.length === 0) {
        setError("Le mot de passe actuel est incorrect");
        setLoading(false);
        return;
      }

      // Mettre à jour le mot de passe dans la base de données
      const { error: updateError } = await supabaseAdmin
        .from("utilisateurs")
        .update({
          mot_de_passe: formData.newPassword,
          first_time_login: false, // Marquer que la première connexion est terminée
          updated_at: new Date().toISOString(),
        })
        .eq("id_user", user.id_user);

      if (updateError) {
        throw updateError;
      }

      // Mettre à jour le mot de passe dans Supabase Auth si nécessaire
      try {
        // Créer une nouvelle session Supabase avec le nouveau mot de passe
        const { error: authError } =
          await supabaseAdmin.auth.admin.updateUserById(user.id_user, {
            password: formData.newPassword,
          });

        if (authError) {
          console.warn("Erreur mise à jour auth Supabase:", authError);
          // Ne pas bloquer si l'auth échoue
        }
      } catch (authError) {
        console.warn("Erreur mise à jour auth Supabase:", authError);
        // Ne pas bloquer si l'auth échoue
      }

      // Succès
      onSuccess({
        message: "Mot de passe changé avec succès! Veuillez vous reconnecter.",
        needsReauth: true,
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      setError("Une erreur est survenue lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Première connexion - Changement de mot de passe
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Bienvenue {user?.prenom} {user?.nom}!
              </p>
            </div>
          </div>

          {/* Message d'information */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  Pour votre sécurité, vous devez changer votre mot de passe
                  lors de votre première connexion.
                </p>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mot de passe actuel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.currentPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.currentPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.currentPassword}
                </p>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  minLength="8"
                  pattern="(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}"
                  title="8+ caractères, au moins une majuscule, des chiffres et des lettres (sans caractères spéciaux)"
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.newPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Entrez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.newPassword}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                8+ caractères, au moins une majuscule, des chiffres et des
                lettres (sans caractères spéciaux)
              </p>
            </div>

            {/* Confirmation mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Confirmez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Changement en cours..." : "Changer le mot de passe"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;
