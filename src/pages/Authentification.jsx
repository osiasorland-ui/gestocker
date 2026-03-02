import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  UserPlus,
  LogIn,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuthHook.js";
import LoginForm from "../components/auth/LoginForm";
import {
  Step1PersonalInfo,
  Step2CompanyInfo,
  Step3ContactInfo,
} from "./AuthentificationSteps";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Schéma de validation pour le formulaire d'inscription
const registerSchema = yup.object().shape({
  nom: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  email: yup.string().required("L'email est requis").email("Email invalide"),
  mot_de_passe: yup
    .string()
    .required("Le mot de passe est requis")
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmer_mot_de_passe: yup
    .string()
    .required("La confirmation du mot de passe est requise")
    .oneOf([yup.ref("mot_de_passe")], "Les mots de passe ne correspondent pas"),
  nom_entreprise: yup
    .string()
    .required("Le nom de l'entreprise est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  raison_sociale: yup.string().optional(),
  ifu: yup
    .string()
    .required("L'IFU est requis")
    .max(50, "L'IFU ne doit pas dépasser 50 caractères"),
  registre_commerce: yup
    .string()
    .required("Le registre de commerce est requis"),
  adresse_siege: yup
    .string()
    .required("L'adresse du siège est requise")
    .min(5, "L'adresse doit contenir au moins 5 caractères"),
  telephone_entreprise: yup
    .string()
    .required("Le téléphone de l'entreprise est requis")
    .min(8, "Le téléphone doit contenir au moins 8 caractères"),
  email_entreprise: yup
    .string()
    .required("L'email de l'entreprise est requis")
    .email("Email invalide"),
});

function Authentification() {
  const [currentMode, setCurrentMode] = useState("login"); // 'login', 'register', 'reset'
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3 pour l'inscription
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, signUp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onChange",
  });

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    setCurrentStep(1);
  };

  const handleNextStep = async () => {
    const fieldsToValidate =
      currentStep === 1
        ? ["nom", "email", "mot_de_passe", "confirmer_mot_de_passe"]
        : currentStep === 2
          ? [
              "nom_entreprise",
              "raison_sociale",
              "ifu",
              "registre_commerce",
              "adresse_siege",
            ]
          : [];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePastePassword = (e) => {
    e.preventDefault();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await signUp(data.email, data.mot_de_passe, {
        nom: data.nom,
        nom_entreprise: data.nom_entreprise,
        raison_sociale: data.raison_sociale,
        ifu: data.ifu,
        registre_commerce: data.registre_commerce,
        adresse_siege: data.adresse_siege,
        telephone_entreprise: data.telephone_entreprise,
        email_entreprise: data.email_entreprise,
      });

      if (!result.error) {
        // Rediriger vers le dashboard après inscription réussie
        navigate("/dashboard");
      } else {
        console.error("Erreur lors de l'inscription:", result.error);
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1PersonalInfo
            register={register}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            handlePastePassword={handlePastePassword}
          />
        );
      case 2:
        return <Step2CompanyInfo register={register} errors={errors} />;
      case 3:
        return <Step3ContactInfo register={register} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Panneau gauche - Illustration */}
          <div className="bg-linear-to-br from-blue-600 to-purple-700 p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-8 backdrop-blur-sm">
                <Building2 className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Gestocker</h1>
              <p className="text-xl mb-8 text-blue-100">
                Votre solution de gestion de stock
              </p>

              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-blue-100">
                    Gestion multi-entreprises
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-blue-100">Suivi en temps réel</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-blue-100">Interface intuitive</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-blue-100">Sécurité avancée</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau droit - Formulaire */}
          <div className="p-8">
            <div className="max-w-md mx-auto">
              {/* Toggle entre les modes */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    currentMode === "login"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => handleModeChange("login")}
                >
                  <LogIn className="w-4 h-4 inline mr-2" />
                  Connexion
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    currentMode === "register"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => handleModeChange("register")}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Inscription
                </button>
              </div>

              {/* Afficher le formulaire approprié */}
              {currentMode === "login" && (
                <LoginForm onToggleMode={handleModeChange} />
              )}

              {currentMode === "register" && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {renderStep()}

                  {/* Navigation entre les étapes */}
                  <div className="flex justify-between items-center pt-4">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Précédent
                      </button>
                    )}

                    <div className="flex-1"></div>

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Suivant
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <span className="loading loading-spinner loading-sm mr-2"></span>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Créer mon compte
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Authentification;
