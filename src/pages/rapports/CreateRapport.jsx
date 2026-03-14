import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
} from "lucide-react";
import { supabase } from "../../config/auth.js";
import { useAuth } from "../../hooks/useAuthHook.js";

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
  CardLoader,
  InlineLoader,
} from "../../components/ui/Loader";

const CreateRapport = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditMode, setIsEditMode] = useState(false);
  const [rapportId, setRapportId] = useState(null);

  const [formData, setFormData] = useState({
    titre: "",
    type_rapport: "",
    description: "",
    periode_debut: "",
    periode_fin: "",
    statut: "BROUILLON",
  });

  const [entrepriseId, setEntrepriseId] = useState(null);

  // Mettre à jour l'ID d'entreprise quand le profil change
  useEffect(() => {
    if (profile?.id_entreprise && profile.id_entreprise !== entrepriseId) {
      setEntrepriseId(profile.id_entreprise);
    }
  }, [profile?.id_entreprise, entrepriseId]);

  // Vérifier si on est en mode édition et pré-remplir les données
  useEffect(() => {
    if (location.state?.rapport && location.state?.mode === "edit") {
      const rapport = location.state.rapport;
      setIsEditMode(true);
      setRapportId(rapport.id_rapport);

      // Pré-remplir le formulaire avec les données du rapport
      setFormData({
        titre: rapport.titre || "",
        type_rapport: rapport.type_rapport || "",
        description: rapport.description || "",
        periode_debut:
          new Date(rapport.periode_debut).toISOString().split("T")[0] || "",
        periode_fin:
          new Date(rapport.periode_fin).toISOString().split("T")[0] || "",
        statut: rapport.statut || "BROUILLON",
      });
    }
  }, [location.state]);

  const steps = [
    { id: 1, title: "Informations générales", icon: FileText },
    { id: 2, title: "Période et montant", icon: Calendar },
    { id: 3, title: "Confirmation", icon: DollarSign },
  ];

  const typesRapports = [
    {
      id: "BILAN",
      titre: "Bilan Comptable",
      description: "État financier patrimonial de l'entreprise",
      icone: TrendingUp,
      couleur: "blue",
    },
    {
      id: "RESULTAT",
      titre: "Compte de Résultat",
      description: "Analyse des revenus et dépenses",
      icone: TrendingUp,
      couleur: "green",
    },
    {
      id: "TVA",
      titre: "Déclaration TVA",
      description: "Rapport de TVA collectée et déductible",
      icone: Receipt,
      couleur: "purple",
    },
    {
      id: "TRESORERIE",
      titre: "Rapport Trésorerie",
      description: "Suivi des flux de trésorerie",
      icone: CreditCard,
      couleur: "yellow",
    },
  ];

  const handleInputChange = useCallback((field, value) => {
    console.log("Changement:", field, "valeur:", value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (statut = "BROUILLON") => {
    // Validation 1: Vérifier que le profil existe
    if (!profile) {
      console.error("Utilisateur non connecté");
      setError("Vous devez être connecté pour créer un rapport");
      return;
    }

    // Validation 2: Vérifier les IDs requis
    if (!profile.id_user || !profile.id_entreprise) {
      console.error("Profil incomplet:", profile);
      setError("Profil utilisateur incomplet. Veuillez vous reconnecter.");
      return;
    }

    // Validation 3: Vérifier les données du formulaire
    const requiredFields = [
      "titre",
      "type_rapport",
      "periode_debut",
      "periode_fin",
    ];
    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      console.error("Champs manquants:", missingFields);
      setError(
        `Veuillez remplir les champs obligatoires: ${missingFields.join(", ")}`,
      );
      return;
    }

    // Validation 4: Vérifier la cohérence des dates
    const debutDate = new Date(formData.periode_debut);
    const finDate = new Date(formData.periode_fin);

    if (finDate < debutDate) {
      console.error("Dates incohérentes:", {
        debut: formData.periode_debut,
        fin: formData.periode_fin,
      });
      setError("La date de fin doit être postérieure à la date de début");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Vérifier l'état de l'authentification Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      console.log("🔐 Session Supabase:", { session, sessionError });
      console.log("🔐 auth.uid() serait:", session?.user?.id || "NULL");

      console.log("🔄 Début de la sauvegarde du rapport...");
      console.log("👤 Profil utilisateur:", profile);
      console.log("📋 Données du formulaire:", formData);
      console.log("📝 Données à insérer:", {
        titre: formData.titre,
        type_rapport: formData.type_rapport,
        description: formData.description,
        periode_debut: debutDate.toISOString(),
        periode_fin: finDate.toISOString(),
        montant_total: 0,
        statut,
        id_entreprise: profile.id_entreprise,
        id_user: profile.id_user,
      });

      let data, error;

      if (isEditMode) {
        // Mode édition : mettre à jour le rapport existant
        console.log("📝 Mode édition - Mise à jour du rapport:", rapportId);
        const result = await supabase
          .from("rapports_comptables")
          .update({
            titre: formData.titre.trim(),
            type_rapport: formData.type_rapport,
            description: formData.description?.trim() || null,
            periode_debut: debutDate.toISOString(),
            periode_fin: finDate.toISOString(),
            montant_total: 0,
            statut,
            id_entreprise: profile.id_entreprise,
            id_user: profile.id_user,
          })
          .eq("id_rapport", rapportId)
          .select()
          .single();

        data = result.data;
        error = result.error;
      } else {
        // Mode création : insérer un nouveau rapport
        console.log("➕ Mode création - Insertion du rapport");
        const result = await supabase
          .from("rapports_comptables")
          .insert({
            titre: formData.titre.trim(),
            type_rapport: formData.type_rapport,
            description: formData.description?.trim() || null,
            periode_debut: debutDate.toISOString(),
            periode_fin: finDate.toISOString(),
            montant_total: 0,
            statut,
            id_entreprise: profile.id_entreprise,
            id_user: profile.id_user,
          })
          .select()
          .single();

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("❌ Erreur lors de la sauvegarde:", error);
        console.error("❌ Détails de l'erreur:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Gérer les erreurs spécifiques
        if (error.code === "23503") {
          setError("Erreur de référence: utilisateur ou entreprise invalide");
        } else if (error.code === "23514") {
          setError("Erreur de validation: vérifiez les données saisies");
        } else if (error.code === "42501") {
          setError(
            "Erreur de permissions: vous n'êtes pas autorisé à créer ce rapport",
          );
        } else {
          setError(`Erreur lors de la sauvegarde: ${error.message}`);
        }
        throw error;
      }

      console.log("✅ Rapport sauvegardé avec succès:", data);

      // Redirection avec message de succès
      navigate("/rapports/rapports-généraux", {
        state: {
          success: true,
          message: isEditMode
            ? `Rapport "${formData.titre}" modifié avec succès`
            : `Rapport "${formData.titre}" ${statut === "BROUILLON" ? "enregistré comme brouillon" : "généré"} avec succès`,
        },
      });
    } catch (error) {
      console.error("❌ Erreur complète lors de la sauvegarde:", error);
      setError(
        "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du rapport *
              </label>
              <Input
                type="text"
                value={formData.titre}
                onChange={(e) => handleInputChange("titre", e.target.value)}
                placeholder="Ex: Bilan annuel 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de rapport *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typesRapports.map((type) => {
                  const Icon = type.icone;
                  return (
                    <div
                      key={type.id}
                      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                        formData.type_rapport === type.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Clic sur type:", type.id);
                        handleInputChange("type_rapport", type.id);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg bg-${type.couleur}-100`}
                        >
                          <Icon
                            className={`h-5 w-5 text-${type.couleur}-600`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {type.titre}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {type.description}
                          </p>
                        </div>
                        {formData.type_rapport === type.id && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Décrivez le contenu et l'objectif de ce rapport..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début *
                </label>
                <Input
                  type="date"
                  value={formData.periode_debut}
                  onChange={(e) =>
                    handleInputChange("periode_debut", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin *
                </label>
                <Input
                  type="date"
                  value={formData.periode_fin}
                  onChange={(e) =>
                    handleInputChange("periode_fin", e.target.value)
                  }
                  min={formData.periode_debut}
                  required
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Période sélectionnée</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.periode_debut && formData.periode_fin ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Du{" "}
                      <strong>
                        {new Date(formData.periode_debut).toLocaleDateString(
                          "fr-FR",
                        )}
                      </strong>{" "}
                      au{" "}
                      <strong>
                        {new Date(formData.periode_fin).toLocaleDateString(
                          "fr-FR",
                        )}
                      </strong>
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.ceil(
                        (new Date(formData.periode_fin) -
                          new Date(formData.periode_debut)) /
                          (1000 * 60 * 60 * 24),
                      )}{" "}
                      jours
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Sélectionnez les dates pour voir la période
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif du rapport</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Titre</p>
                    <p className="font-medium">{formData.titre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <Badge variant="outline">
                      {typesRapports.find((t) => t.id === formData.type_rapport)
                        ?.titre || formData.type_rapport}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Période</p>
                    <p className="font-medium">
                      {formData.periode_debut && formData.periode_fin
                        ? `${new Date(
                            formData.periode_debut,
                          ).toLocaleDateString("fr-FR")} - ${new Date(
                            formData.periode_fin,
                          ).toLocaleDateString("fr-FR")}`
                        : "Non définie"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <Badge
                      variant={
                        formData.statut === "BROUILLON" ? "warning" : "success"
                      }
                    >
                      {formData.statut === "BROUILLON" ? "Brouillon" : "Généré"}
                    </Badge>
                  </div>
                </div>

                {formData.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Description</p>
                    <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">
                      {formData.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Information importante
              </h4>
              <p className="text-sm text-blue-800">
                Une fois le rapport généré, vous pourrez le modifier pendant une
                période de 3 jours. Passé ce délai, le rapport sera verrouillé
                pour garantir l'intégrité des données.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case 1: {
        const titreValid = formData.titre.trim() !== "";
        const typeValid = formData.type_rapport !== "";
        console.log("Titre valide:", titreValid, "Type valide:", typeValid);
        return titreValid && typeValid;
      }
      case 2:
        return formData.periode_debut !== "" && formData.periode_fin !== "";
      case 3:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  useEffect(() => {
    console.log("FormData mis à jour:", formData);
    console.log("Étape actuelle:", currentStep);
    console.log("Étape valide?", isStepValid());
  }, [formData, currentStep, isStepValid]);

  if (loading) {
    return <PageLoader text="Sauvegarde du rapport..." />;
  }

  return (
    <div className="p-5 mx-auto">
      {/* Loader */}
      {loading && <PageLoader text="Sauvegarde du rapport..." />}
      {!loading && (
        <>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditMode ? "Modifier un rapport" : "Créer un rapport"}
                </h1>
                <p className="mt-2 text-gray-600">
                  {isEditMode
                    ? "Modifiez les informations de votre rapport comptable"
                    : "Suivez les étapes pour créer votre rapport comptable"}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/rapports/rapports-généraux")}
                icon={ChevronLeft}
              >
                Retour
              </Button>
            </div>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : isCompleted
                              ? "bg-green-600 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isCompleted ? (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-blue-600"
                              : isCompleted
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-4 ${
                          isCompleted ? "bg-green-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Content */}
          <Card>
            <CardContent className="p-6">{renderStepContent()}</CardContent>
            <CardFooter className="flex justify-between pt-6">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    icon={ChevronLeft}
                  >
                    Précédent
                  </Button>
                )}
              </div>

              <div className="flex space-x-3">
                {currentStep === 3 ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSave("BROUILLON")}
                      icon={Save}
                    >
                      Enregistrer comme brouillon
                    </Button>
                    <Button
                      onClick={() => handleSave("GENERE")}
                      icon={Save}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Générer le rapport
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleNext}
                    icon={ChevronRight}
                    disabled={!isStepValid()}
                  >
                    Suivant
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

export default CreateRapport;
