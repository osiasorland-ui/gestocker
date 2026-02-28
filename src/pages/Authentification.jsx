import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  UserPlus,
  LogIn,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../hooks/useAuth";
import {
  Step1PersonalInfo,
  Step2CompanyInfo,
  Step3ContactInfo,
} from "./AuthentificationSteps";

// Schémas de validation par étape
const step1Schema = z
  .object({
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z
      .string()
      .regex(
        /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr|yahoo\.fr)$/,
        "Email doit se terminer par @gmail.com, @outlook.com, @outlook.fr ou @yahoo.fr",
      ),
    mot_de_passe: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmer_mot_de_passe: z.string(),
    telephone: z
      .string()
      .regex(
        /^\+?\d{10,15}$/,
        "Le téléphone doit contenir au moins 10 chiffres",
      ),
  })
  .refine((data) => data.mot_de_passe === data.confirmer_mot_de_passe, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmer_mot_de_passe"],
  });

const step2Schema = z.object({
  nom_entreprise: z
    .string()
    .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  ifu: z
    .string()
    .regex(/^\d{13}$/, "L'IFU doit contenir exactement 13 chiffres"),
  registre_commerce: z
    .string()
    .regex(
      /^(RC|RB)-BJ-\d{4}-\d{6}$|^(RC|RCM)\/(BEN|BJ)\/\d{4}\/\d{6}$|^RCCM-BJ-\d{4}-\d{6}$/,
      "Format du registre de commerce invalide (ex: RC-BJ-2023-000123)",
    ),
});

const step3Schema = z.object({
  telephone_entreprise: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Le téléphone doit contenir au moins 10 chiffres")
    .optional(),
  email_entreprise: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr|yahoo\.fr)$/,
      "Email doit se terminer par @gmail.com, @outlook.com, @outlook.fr ou @yahoo.fr",
    )
    .optional(),
});

// Schéma de connexion
const loginSchema = z.object({
  email: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr|yahoo\.fr)$/,
      "Email doit se terminer par @gmail.com, @outlook.com, @outlook.fr ou @yahoo.fr",
    ),
  mot_de_passe: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

// Schéma complet pour l'inscription
const registerSchema = z
  .object({
    // Informations utilisateur
    nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z
      .string()
      .regex(
        /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr|yahoo\.fr)$/,
        "Email doit se terminer par @gmail.com, @outlook.com, @outlook.fr ou @yahoo.fr",
      ),
    mot_de_passe: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmer_mot_de_passe: z.string(),
    telephone: z
      .string()
      .regex(
        /^\+?\d{10,15}$/,
        "Le téléphone doit contenir au moins 10 chiffres",
      ),

    // Informations entreprise
    nom_entreprise: z
      .string()
      .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
    raison_sociale: z.string().optional(),
    ifu: z
      .string()
      .regex(/^\d{13}$/, "L'IFU doit contenir exactement 13 chiffres"),
    registre_commerce: z
      .string()
      .regex(
        /^(RC|RB)-BJ-\d{4}-\d{6}$|^(RC|RCM)\/(BEN|BJ)\/\d{4}\/\d{6}$|^RCCM-BJ-\d{4}-\d{6}$/,
        "Format du registre de commerce invalide (ex: RC-BJ-2023-000123)",
      ),
    adresse_siege: z.string().optional(),
    telephone_entreprise: z
      .string()
      .regex(
        /^\+?\d{10,15}$/,
        "Le téléphone doit contenir au moins 10 chiffres",
      )
      .optional(),
    email_entreprise: z
      .string()
      .regex(
        /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|outlook\.fr|yahoo\.fr)$/,
        "Email doit se terminer par @gmail.com, @outlook.com, @outlook.fr ou @yahoo.fr",
      )
      .optional(),
  })
  .refine((data) => data.mot_de_passe === data.confirmer_mot_de_passe, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmer_mot_de_passe"],
  });

function Authentification() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entreprises, setEntreprises] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // Étape actuelle (1, 2, ou 3)
  const navigate = useNavigate();
  const { login, register, getEntreprises } = useAuth();

  // Charger la liste des entreprises au montage du composant
  useEffect(() => {
    const loadEntreprises = async () => {
      try {
        const result = await getEntreprises();
        if (result.success && result.data.length > 0) {
          setEntreprises(result.data);
        } else {
          setEntreprises([]); // Aucune entreprise par défaut
        }
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
        setEntreprises([]); // Aucune entreprise par défaut en cas d'erreur
      }
    };

    loadEntreprises();
  }, [getEntreprises]);

  // Formulaire de connexion
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // Formulaire d'inscription
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm({
    // Pas de résolveur ici, nous allons valider manuellement dans onSubmitStep
  });

  const onLogin = async (data) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await login(data.email, data.mot_de_passe);

      if (result.success) {
        setSuccess("Connexion réussie! Redirection...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await register({
        // Informations utilisateur
        nom: data.nom,
        email: data.email,
        mot_de_passe: data.mot_de_passe,
        telephone: data.telephone,

        // Informations entreprise
        nom_entreprise: data.nom_entreprise,
        raison_sociale: data.raison_sociale,
        ifu: data.ifu,
        registre_commerce: data.registre_commerce,
        adresse_siege: data.adresse_siege,
        telephone_entreprise: data.telephone_entreprise,
        email_entreprise: data.email_entreprise,
      });

      if (result.success) {
        setSuccess(
          "Compte et entreprise créés avec succès! Veuillez vérifier votre email.",
        );
        setTimeout(() => {
          setIsLogin(true);
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Erreur lors de la création du compte. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaire pour empêcher le copier-coller dans le champ de confirmation
  const handlePastePassword = (e) => {
    e.preventDefault();
    setError("Veuillez taper manuellement le mot de passe de confirmation");
  };

  // Navigation entre les étapes
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setError(""); // Effacer les erreurs en changeant d'étape
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(""); // Effacer les erreurs en changeant d'étape
    }
  };

  // Réinitialiser l'étape quand on change entre connexion/inscription
  const toggleForm = (loginMode) => {
    setIsLogin(loginMode);
    setCurrentStep(1);
    setError("");
    setSuccess("");
  };

  // Soumission du formulaire par étape
  const onSubmitStep = async (data) => {
    if (currentStep < 3) {
      // Valider uniquement les champs de l'étape actuelle
      try {
        let schema;
        switch (currentStep) {
          case 1:
            schema = step1Schema;
            break;
          case 2:
            schema = step2Schema;
            break;
          default:
            schema = step3Schema;
        }

        const result = schema.parse(data);
        setError(""); // Effacer les erreurs si validation réussie
        nextStep();
      } catch (error) {
        // Afficher les erreurs de validation pour l'étape actuelle
        const firstError = error.errors[0];
        setError(firstError.message);
      }
    } else {
      // Valider le schéma complet avant soumission finale
      try {
        const result = registerSchema.parse(data);
        setError(""); // Effacer les erreurs si validation réussie
        await onRegister(data);
      } catch (error) {
        const firstError = error.errors[0];
        setError(firstError.message);
      }
    }
  };

  // Obtenir les champs requis pour chaque étape
  const getStepFields = (step) => {
    switch (step) {
      case 1:
        return [
          "nom",
          "email",
          "mot_de_passe",
          "confirmer_mot_de_passe",
          "telephone",
        ];
      case 2:
        return ["nom_entreprise", "ifu", "registre_commerce"];
      case 3:
        return ["telephone_entreprise", "email_entreprise"];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Panneau gauche - Illustration */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
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
              </div>
            </div>
          </div>

          {/* Panneau droit - Formulaire */}
          <div className="p-8">
            <div className="max-w-sm mx-auto">
              {/* Toggle Login/Register */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    isLogin
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => toggleForm(true)}
                >
                  <LogIn className="w-4 h-4 inline mr-2" />
                  Connexion
                </button>
                <button
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    !isLogin
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => toggleForm(false)}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Inscription
                </button>
              </div>

              {/* Messages */}
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="alert alert-success mb-4">
                  <span>{success}</span>
                </div>
              )}

              {/* Formulaire de connexion */}
              {isLogin ? (
                <form
                  onSubmit={handleLoginSubmit(onLogin)}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      Bienvenue!
                    </h2>
                    <p className="text-sm text-gray-600">
                      Connectez-vous à votre espace
                    </p>
                  </div>

                  <div className="form-control">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        className={`input input-bordered w-full pl-9 text-sm h-10 ${loginErrors.email ? "input-error" : ""}`}
                        placeholder="exemple@gmail.com"
                        {...registerLogin("email")}
                      />
                    </div>
                    {loginErrors.email && (
                      <label className="label">
                        <span className="label-text-alt text-error text-xs">
                          {loginErrors.email.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="form-control">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`input input-bordered w-full pl-9 pr-9 text-sm h-10 ${loginErrors.mot_de_passe ? "input-error" : ""}`}
                        placeholder="••••••••"
                        {...registerLogin("mot_de_passe")}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {loginErrors.mot_de_passe && (
                      <label className="label">
                        <span className="label-text-alt text-error text-xs">
                          {loginErrors.mot_de_passe.message}
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer label">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                      />
                      <span className="label-text ml-2 text-sm">
                        Se souvenir de moi
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800 link"
                    >
                      Mot de passe oublié?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full h-10 text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Connexion...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </button>
                </form>
              ) : (
                /* Formulaire d'inscription par étapes */
                <form
                  onSubmit={handleRegisterSubmit(onSubmitStep)}
                  className="space-y-4"
                >
                  {/* Indicateur de progression */}
                  <div className="flex items-center justify-between mb-6">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            currentStep >= step
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {step}
                        </div>
                        {step < 3 && (
                          <div
                            className={`w-12 h-1 mx-2 ${
                              currentStep > step ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Étapes du formulaire */}
                  {currentStep === 1 && (
                    <Step1PersonalInfo
                      register={registerRegister}
                      errors={registerErrors}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                      handlePastePassword={handlePastePassword}
                    />
                  )}

                  {currentStep === 2 && (
                    <Step2CompanyInfo
                      register={registerRegister}
                      errors={registerErrors}
                    />
                  )}

                  {currentStep === 3 && (
                    <Step3ContactInfo
                      register={registerRegister}
                      errors={registerErrors}
                    />
                  )}

                  {/* Boutons de navigation */}
                  <div className="flex gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline flex-1 h-10 text-sm"
                        onClick={prevStep}
                        disabled={isLoading}
                      >
                        Précédent
                      </button>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary flex-1 h-10 text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          {currentStep === 3 ? "Création..." : "Chargement..."}
                        </>
                      ) : currentStep === 3 ? (
                        "Créer mon compte"
                      ) : (
                        "Suivant"
                      )}
                    </button>
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
