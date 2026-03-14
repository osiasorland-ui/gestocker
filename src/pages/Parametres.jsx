import React, { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuthHook.js";
import { companies } from "../config/auth.js";
import { Building2, Upload, Save, Camera, X } from "lucide-react";

const Parametres = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // État pour les informations de l'entreprise
  const [entrepriseInfo, setEntrepriseInfo] = useState({
    nom_commercial: profile?.entreprises?.nom_commercial || "",
    raison_sociale: profile?.entreprises?.raison_sociale || "",
    ifu: profile?.entreprises?.ifu || "",
    registre_commerce: profile?.entreprises?.registre_commerce || "",
    adresse_siege: profile?.entreprises?.adresse_siege || "",
    telephone_contact: profile?.entreprises?.telephone_contact || "",
    email_entreprise: profile?.entreprises?.email_entreprise || "",
    logo_path: profile?.entreprises?.logo_path || "",
  });

  // État pour l'aperçu du logo
  const [logoPreview, setLogoPreview] = useState(
    profile?.entreprises?.logo_path || null,
  );

  // Gérer le changement des champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEntrepriseInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  // Gérer le téléchargement du logo
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Le logo ne doit pas dépasser 2MB");
        return;
      }

      // Vérifier le type de fichier
      if (!file.type.startsWith("image/")) {
        setError("Veuillez sélectionner une image valide");
        return;
      }

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;
        setLogoPreview(result);
        setEntrepriseInfo((prev) => ({
          ...prev,
          logo_path: result,
        }));
        setError("");
        setSuccess("Logo téléchargé avec succès !");
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer le logo
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setEntrepriseInfo((prev) => ({
      ...prev,
      logo_path: null,
    }));
    setSuccess("Logo supprimé avec succès !");
  };

  // Sauvegarder les modifications
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Appeler la fonction pour mettre à jour l'entreprise
      const { error: updateError } = await companies.updateCompanyInfo(
        profile?.entreprises?.id_entreprise,
        entrepriseInfo,
      );

      if (updateError) {
        throw new Error(updateError);
      }

      setSuccess("Informations de l'entreprise mises à jour avec succès !");
    } catch (error) {
      setError("Erreur lors de la mise à jour: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            Paramètres de l'entreprise
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez les informations de votre entreprise
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg mx-6 mt-6">
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg mx-6 mt-6">
            <span className="text-green-700 text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Section Logo */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Logo de l'entreprise
            </h2>
            <div className="flex items-center space-x-6">
              {/* Aperçu du logo */}
              <div className="relative">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo de l'entreprise"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Boutons de téléchargement */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {logoPreview ? "Changer le logo" : "Télécharger un logo"}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Formats acceptés: PNG, JPG, GIF (max 2MB)
                </p>
              </div>
            </div>
          </div>

          {/* Section Informations de base */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations de base
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="nom_commercial"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nom commercial *
                </label>
                <input
                  type="text"
                  id="nom_commercial"
                  name="nom_commercial"
                  value={entrepriseInfo.nom_commercial}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="raison_sociale"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Raison sociale
                </label>
                <input
                  type="text"
                  id="raison_sociale"
                  name="raison_sociale"
                  value={entrepriseInfo.raison_sociale}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="ifu"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  IFU *
                </label>
                <input
                  type="text"
                  id="ifu"
                  name="ifu"
                  value={entrepriseInfo.ifu}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="registre_commerce"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Registre de commerce *
                </label>
                <input
                  type="text"
                  id="registre_commerce"
                  name="registre_commerce"
                  value={entrepriseInfo.registre_commerce}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section Contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informations de contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="adresse_siege"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Adresse du siège
                </label>
                <textarea
                  id="adresse_siege"
                  name="adresse_siege"
                  value={entrepriseInfo.adresse_siege}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="telephone_contact"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="telephone_contact"
                  name="telephone_contact"
                  value={entrepriseInfo.telephone_contact}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="email_entreprise"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email de l'entreprise
                </label>
                <input
                  type="email"
                  id="email_entreprise"
                  name="email_entreprise"
                  value={entrepriseInfo.email_entreprise}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Parametres;
