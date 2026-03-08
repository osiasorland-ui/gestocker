import {
  User,
  Mail,
  Phone,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  MapPin,
  FileText,
  Upload,
  Image,
} from "lucide-react";
import AddressSelector from "../components/AddressSelector";

// Étape 1: Informations personnelles
export const Step1PersonalInfo = ({
  register,
  errors,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handlePastePassword,
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <User className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Vos informations
      </h2>
      <p className="text-gray-600">
        Commençons par vos informations personnelles
      </p>
    </div>

    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.nom ? "border-red-300 ring-red-500" : ""}`}
              placeholder="Dupont"
              {...register("nom")}
            />
          </div>
          {errors.nom && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
              {errors.nom.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prénom *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.prenom ? "border-red-300 ring-red-500" : ""}`}
              placeholder="Jean"
              {...register("prenom")}
            />
          </div>
          {errors.prenom && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
              {errors.prenom.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email entreprise (gmail.com/outlook.com/outlook.fr) *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.email ? "border-red-300 ring-red-500" : "border-gray-300"}`}
            placeholder="contact@entreprise.com"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className={`w-full pl-10 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.mot_de_passe ? "border-red-300 ring-red-500" : ""}`}
              placeholder="•••••••"
              {...register("mot_de_passe")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.mot_de_passe && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
              {errors.mot_de_passe.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le mot de passe *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full pl-10 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.confirmer_mot_de_passe ? "border-red-300 ring-red-500" : ""}`}
              placeholder="•••••••"
              {...register("confirmer_mot_de_passe")}
              onPaste={handlePastePassword}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmer_mot_de_passe && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
              {errors.confirmer_mot_de_passe.message}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Étape 2: Informations de l'entreprise
export const Step2CompanyInfo = ({ register, errors, setValue }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <Building2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Informations de l'entreprise
      </h2>
      <p className="text-gray-600">
        Détails de votre entreprise pour personnaliser votre expérience
      </p>
      <div className="flex items-center justify-center space-x-2 mt-3">
        <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
        <div className="w-8 h-2 bg-primary rounded-full"></div>
        <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
      </div>
    </div>

    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700">
            Nom commercial (MAJUSCULES) *
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.nom_entreprise ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="MA SUPER ENTREPRISE"
            style={{ textTransform: "uppercase" }}
            {...register("nom_entreprise")}
          />
        </div>
        {errors.nom_entreprise && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.nom_entreprise.message}
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700">
            Raison sociale
          </span>
        </label>
        <input
          type="text"
          className={`input input-bordered w-full h-12 text-base transition-colors ${errors.raison_sociale ? "input-error border-red-300" : "focus:border-primary"}`}
          placeholder="Ma Super Entreprise SARL"
          {...register("raison_sociale")}
        />
        {errors.raison_sociale && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.raison_sociale.message}
            </span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
              IFU *
            </span>
          </label>
          <input
            type="text"
            className={`input input-bordered w-full h-12 text-base transition-colors ${errors.ifu ? "input-error border-red-300 ring-red-500" : "focus:border-primary"}`}
            placeholder="13 chiffres: 3200100123456"
            maxLength={13}
            {...register("ifu")}
          />
          {errors.ifu && (
            <label className="label">
              <span className="label-text-alt text-red-500 text-sm flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.ifu.message}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-gray-500" />
              Registre de commerce *
            </span>
          </label>
          <input
            type="text"
            className={`input input-bordered w-full h-12 text-base transition-colors ${errors.registre_commerce ? "input-error border-red-300 ring-red-500" : "focus:border-primary"}`}
            placeholder="RC-BJ-2023-123456"
            {...register("registre_commerce")}
          />
          {errors.registre_commerce && (
            <label className="label">
              <span className="label-text-alt text-red-500 text-sm flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.registre_commerce.message}
              </span>
            </label>
          )}
        </div>
      </div>

      <AddressSelector
        register={register}
        setValue={setValue}
        error={errors.adresse_siege}
      />

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-500" />
            Téléphone de l'entreprise *
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.telephone_entreprise ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="+229 01XXXXXXXX ou 01XXXXXXXX"
            {...register("telephone_entreprise")}
          />
        </div>
        {errors.telephone_entreprise && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.telephone_entreprise.message}
            </span>
          </label>
        )}
      </div>
    </div>
  </div>
);

// Étape 3: Logo de l'entreprise
export const Step3Logo = ({
  register,
  errors,
  handleLogoUpload,
  logoFile,
  logoPreview,
}) => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <CheckCircle className="h-8 w-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Logo de l'entreprise
      </h2>
      <p className="text-gray-600">Importez le logo de votre entreprise *</p>
    </div>

    <div className="space-y-5">
      {/* Champ caché pour le logo_path */}
      <input type="hidden" {...register("logo_path")} />

      {/* Upload du logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo de l'entreprise *
        </label>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <label
                htmlFor="logo-upload"
                className={`flex items-center justify-center w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  errors.logo_path
                    ? "border-red-300 bg-red-50 hover:border-red-400"
                    : "border-gray-300 hover:border-blue-500"
                }`}
              >
                <Upload
                  className={`w-5 h-5 mr-2 ${errors.logo_path ? "text-red-400" : "text-gray-400"}`}
                />
                <span
                  className={
                    errors.logo_path ? "text-red-600" : "text-gray-600"
                  }
                >
                  {logoFile
                    ? logoFile.name
                    : "Cliquez pour sélectionner une image (requis)"}
                </span>
              </label>
            </div>
            {errors.logo_path && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {errors.logo_path.message}
              </p>
            )}
          </div>

          {/* Preview du logo */}
          <div className="shrink-0">
            {logoPreview ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2 text-lg">
              Votre inscription est presque terminée !
            </h4>
            <div className="space-y-2">
              <p className="text-blue-700 text-sm">
                Vous êtes sur le point de créer votre compte utilisateur et
                votre entreprise.
              </p>
              <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
                <h5 className="font-medium text-blue-800 mb-1 text-sm">
                  Ce qui va se passer ensuite :
                </h5>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    Création de votre compte utilisateur
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    Enregistrement de votre entreprise
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    Email de confirmation envoyé
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                    Accès immédiat à votre tableau de bord
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
