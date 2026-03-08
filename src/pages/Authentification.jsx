import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion"; // eslint-disable-line no-unused-vars
import Lottie from "lottie-react";
import {
  Building2,
  UserPlus,
  LogIn,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuthHook.js";
import LoginForm from "../components/auth/LoginForm";
import {
  Step1PersonalInfo,
  Step2CompanyInfo,
  Step3Logo,
} from "./AuthentificationSteps";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3,
};

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

// Schéma de validation pour le formulaire d'inscription
const registerSchema = yup.object().shape({
  nom: yup
    .string()
    .required("Le nom est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: yup
    .string()
    .required("Le prénom est requis")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: yup
    .string()
    .required("L'email est requis")
    .email("Email invalide")
    .matches(
      /@(gmail\.com|outlook\.com|outlook\.fr)$/,
      "L'email doit être de type gmail.com, outlook.com ou outlook.fr",
    ),
  mot_de_passe: yup
    .string()
    .required("Le mot de passe est requis")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .matches(
      /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,
      "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre, sans caractères spéciaux",
    ),
  confirmer_mot_de_passe: yup
    .string()
    .required("La confirmation du mot de passe est requise")
    .oneOf([yup.ref("mot_de_passe")], "Les mots de passe ne correspondent pas"),
  nom_entreprise: yup
    .string()
    .required("Le nom commercial est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .matches(/^[A-Z\s]+$/, "Le nom commercial doit être en majuscules"),
  raison_sociale: yup.string().optional(),
  ifu: yup
    .string()
    .required("L'IFU est requis")
    .matches(
      /^[0-9]{13}$/,
      "L'IFU doit contenir exactement 13 chiffres (format: 3200100123456)",
    )
    .test("ifu-format", "Format IFU invalide pour le Bénin", (value) => {
      // IFU béninois: commence par 1, 2, 3 ou 9 selon le type d'entreprise
      if (!value) return false;
      const firstDigit = value[0];
      return ["1", "2", "3", "9"].includes(firstDigit);
    }),
  registre_commerce: yup
    .string()
    .required("Le registre de commerce est requis")
    .matches(
      /^RC-BJ-\d{4}-\d{6}$/,
      "Format requis: RC-BJ-2023-123456 (année à 4 chiffres + numéro à 6 chiffres)",
    ),
  adresse_siege: yup
    .string()
    .required("L'adresse est requise")
    .test(
      "adresse-format",
      "Veuillez sélectionner un département et une ville",
      function (value) {
        if (!value) return false;
        return value.includes(",") && value.split(",").length >= 2;
      },
    ),
  telephone_entreprise: yup
    .string()
    .required("Le téléphone est requis")
    .matches(
      /^\+22901[0-9]{8}$/,
      "Le téléphone doit être au format béninois: +22901XXXXXXXX (10 chiffres après +229)",
    ),
  logo_path: yup
    .string()
    .required("Le logo est requis")
    .test("logo-file", "Veuillez sélectionner un logo", function (value) {
      // Vérifier si un fichier a été sélectionné
      return value && value.trim() !== "";
    }),
});

function Authentification() {
  const [currentMode, setCurrentMode] = useState("login"); // 'login', 'register'
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3 pour l'inscription
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [lottieAnimation, setLottieAnimation] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated, signUp } = useAuth();

  // Charger l'animation Lottie
  useEffect(() => {
    fetch("/lottie.json")
      .then((response) => response.json())
      .then((data) => {
        setLottieAnimation(data);
      })
      .catch(() => {
        // Erreur silencieuse pour le chargement de l'animation
      });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    setError,
    clearErrors,
    setValue,
    getValues,
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

  // Valider le logo lorsque l'utilisateur arrive à l'étape 3
  useEffect(() => {
    if (currentStep === 3 && !logoFile) {
      // Forcer la validation du champ logo_path pour afficher l'erreur
      trigger("logo_path");
    }
  }, [currentStep, logoFile, trigger]);

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    setCurrentStep(1);
  };

  const handleNextStep = async () => {
    const fieldsToValidate =
      currentStep === 1
        ? ["nom", "prenom", "email", "mot_de_passe", "confirmer_mot_de_passe"]
        : currentStep === 2
          ? [
              "nom_entreprise",
              "ifu",
              "registre_commerce",
              "adresse_siege",
              "telephone_entreprise",
            ]
          : currentStep === 3
            ? ["logo_path"]
            : [];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      if (currentStep === 3) {
        // Dernière étape - soumettre directement
        const formData = getValues();
        await onSubmit(formData);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handlePastePassword = (e) => {
    e.preventDefault();
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      if (file.type.startsWith("image/")) {
        setLogoFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result);
          // Mettre à jour le champ logo_path avec le nom du fichier
          setValue("logo_path", file.name);
          clearErrors("logo_path");
          setSubmitError("");
        };
        reader.readAsDataURL(file);
      } else {
        setSubmitError(
          "Veuillez sélectionner une image valide (JPG, PNG, etc.)",
        );
      }
    } else {
      // Aucun fichier sélectionné
      setLogoPreview("");
      setValue("logo_path", "");
    }
  };

  const onSubmit = async (data) => {
    console.log("=== SOUMISSION FORMULAIRE ===");
    console.log("Données reçues:", data);
    console.log("Logo file:", logoFile);
    console.log("Logo preview:", logoPreview);

    setIsLoading(true);
    setSubmitError("");
    clearErrors();

    try {
      // Valider que le logo est présent
      if (!logoFile) {
        console.log("ERREUR: Logo manquant");
        setError("logo_path", {
          message: "Veuillez sélectionner un logo avant de créer votre compte",
        });
        setSubmitError("Le logo est requis pour créer votre compte");
        setIsLoading(false);
        return;
      }

      // S'assurer que le champ logo_path est bien rempli avec le nom du fichier
      if (!data.logo_path) {
        setValue("logo_path", logoFile.name);
      }

      // Valider le champ logo_path dans le formulaire
      const isLogoValid = await trigger("logo_path");
      if (!isLogoValid) {
        setSubmitError("Veuillez corriger les erreurs avant de continuer");
        setIsLoading(false);
        return;
      }

      // Convertir le logo en base64
      const reader = new FileReader();
      const logoBase64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(logoFile);
      });

      const result = await signUp(data.email, data.mot_de_passe, {
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone_entreprise, // Utiliser le téléphone de l'entreprise pour l'utilisateur aussi
        role_id: "5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3", // Rôle "Admin" par défaut pour les inscriptions
        nom_entreprise: data.nom_entreprise,
        raison_sociale: data.raison_sociale,
        ifu: data.ifu,
        registre_commerce: data.registre_commerce,
        adresse_siege: data.adresse_siege,
        telephone_entreprise: data.telephone_entreprise,
        email_entreprise: data.email, // Utiliser le même email pour l'entreprise
        logo_base64: logoBase64, // Stocker en base64 pour éviter l'upload
      });

      if (!result.error) {
        // Rediriger vers le dashboard après inscription réussie
        navigate("/dashboard");
      } else {
        // Gérer les erreurs spécifiques et les afficher dans les champs appropriés
        const errorMessage = result.error;

        if (errorMessage === "IFU_EXISTS") {
          setError("ifu", { message: "Cet IFU existe déjà" });
          setSubmitError("Cet IFU est déjà utilisé par une autre entreprise.");
        } else if (errorMessage === "REGISTRE_EXISTS") {
          setError("registre_commerce", {
            message: "Ce registre de commerce existe déjà",
          });
          setSubmitError("Ce registre de commerce est déjà utilisé.");
        } else if (errorMessage === "EMAIL_EXISTS") {
          setError("email", { message: "Cet email existe déjà" });
          setSubmitError("Cet email est déjà utilisé par un autre compte.");
        } else {
          setSubmitError(errorMessage);
        }
      }
    } catch {
      setSubmitError("Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={pageTransition}
          >
            <Step1PersonalInfo
              register={register}
              errors={errors}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              handlePastePassword={handlePastePassword}
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={pageTransition}
          >
            <Step2CompanyInfo
              register={register}
              errors={errors}
              setValue={setValue}
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={pageTransition}
          >
            <Step3Logo
              register={register}
              errors={errors}
              logoFile={logoFile}
              logoPreview={logoPreview}
              handleLogoUpload={handleLogoUpload}
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Panneau gauche - Animation Lottie */}
          <div className="bg-gray-900 p-12 flex flex-col justify-center items-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="relative z-10 text-center">
              {/* Animation Lottie */}
              <div className="mb-8 flex justify-center">
                {lottieAnimation ? (
                  <Lottie
                    animationData={lottieAnimation}
                    loop={true}
                    autoplay={true}
                    style={{
                      width: 200,
                      height: 200,
                      filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.3))",
                    }}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Building2 className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">Gestocker</h1>
              <p className="text-xl mb-8 text-gray-300">
                🚀 La solution intelligente pour votre gestion de stock
              </p>

              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-gray-300">
                    🏢 Gestion multi-entreprises
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-gray-300">📊 Suivi en temps réel</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-gray-300">✨ Interface intuitive</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-gray-300">🔒 Sécurité avancée</span>
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
                      ? "bg-white text-gray-900 shadow-sm"
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
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => handleModeChange("register")}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Inscription
                </button>
              </div>

              {/* Afficher le formulaire approprié */}
              <AnimatePresence mode="wait">
                {currentMode === "login" && (
                  <motion.div
                    key="login"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <LoginForm onToggleMode={handleModeChange} />
                  </motion.div>
                )}

                {currentMode === "register" && (
                  <motion.div
                    key="register"
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                  >
                    <form
                      onSubmit={handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      {/* Indicateur d'étapes */}
                      <div className="flex justify-center mb-8">
                        <div className="flex items-center space-x-2">
                          {/* Étape 1 */}
                          <div
                            className={`flex items-center ${currentStep === 1 ? "text-gray-900" : "text-gray-400"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? "bg-gray-900" : "bg-gray-200"}`}
                            >
                              <span className="text-white font-semibold text-sm">
                                1
                              </span>
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              Informations personnelles
                            </span>
                          </div>

                          {/* Séparateur */}
                          <div
                            className={`w-12 h-0.5 ${currentStep > 1 ? "bg-gray-900" : "bg-gray-200"}`}
                          ></div>

                          {/* Étape 2 */}
                          <div
                            className={`flex items-center ${currentStep === 2 ? "text-gray-900" : "text-gray-400"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? "bg-gray-900" : "bg-gray-200"}`}
                            >
                              <span className="text-white font-semibold text-sm">
                                2
                              </span>
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              Informations entreprise
                            </span>
                          </div>

                          {/* Séparateur */}
                          <div
                            className={`w-12 h-0.5 ${currentStep > 2 ? "bg-gray-900" : "bg-gray-200"}`}
                          ></div>

                          {/* Étape 3 */}
                          <div
                            className={`flex items-center ${currentStep === 3 ? "text-gray-900" : "text-gray-400"}`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 3 ? "bg-gray-900" : "bg-gray-200"}`}
                            >
                              <span className="text-white font-semibold text-sm">
                                3
                              </span>
                            </div>
                            <span className="ml-2 text-sm font-medium">
                              Logo
                            </span>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {renderStep()}
                      </AnimatePresence>

                      {/* Affichage des erreurs de soumission */}
                      {submitError && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
                        >
                          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                          <span className="text-red-700 text-sm">
                            {submitError}
                          </span>
                        </motion.div>
                      )}

                      {/* Navigation entre les étapes */}
                      <div className="flex justify-between items-center pt-4">
                        {currentStep > 1 && (
                          <motion.button
                            type="button"
                            onClick={handlePreviousStep}
                            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Précédent
                          </motion.button>
                        )}

                        <div className="flex-1"></div>

                        {currentStep < 3 ? (
                          <motion.button
                            type="button"
                            onClick={handleNextStep}
                            className="flex items-center px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Suivant
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </motion.button>
                        ) : (
                          <motion.button
                            type="submit"
                            disabled={isLoading || !logoFile}
                            className={`flex items-center px-6 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                              !logoFile
                                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                                : "bg-gray-900 text-white hover:bg-gray-800"
                            }`}
                            whileHover={
                              logoFile && !isLoading ? { scale: 1.05 } : {}
                            }
                            whileTap={
                              logoFile && !isLoading ? { scale: 0.95 } : {}
                            }
                          >
                            {isLoading ? (
                              <span className="loading loading-spinner loading-sm mr-2"></span>
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Créer mon compte
                          </motion.button>
                        )}
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Authentification;
