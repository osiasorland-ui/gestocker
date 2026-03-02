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
} from "lucide-react";

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
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <User className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Vos informations
      </h2>
      <p className="text-gray-600">
        Commençons par vos informations personnelles
      </p>
      <div className="flex items-center justify-center space-x-2 mt-3">
        <div className="w-8 h-2 bg-primary rounded-full"></div>
        <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
        <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
      </div>
    </div>

    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700">
            Nom complet
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.nom ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="Jean Dupont"
            {...register("nom")}
          />
        </div>
        {errors.nom && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.nom.message}
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700">
            Adresse email
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.email ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="exemple@gmail.com"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.email.message}
            </span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              Mot de passe
            </span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className={`input input-bordered w-full pl-11 pr-11 h-12 text-base transition-colors ${errors.mot_de_passe ? "input-error border-red-300" : "focus:border-primary"}`}
              placeholder="••••••••"
              {...register("mot_de_passe")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
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
            <label className="label">
              <span className="label-text-alt text-red-500 text-sm flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.mot_de_passe.message}
              </span>
            </label>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              Confirmer le mot de passe
            </span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`input input-bordered w-full pl-11 pr-11 h-12 text-base transition-colors ${errors.confirmer_mot_de_passe ? "input-error border-red-300" : "focus:border-primary"}`}
              placeholder="••••••••"
              {...register("confirmer_mot_de_passe")}
              onPaste={handlePastePassword}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors"
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
            <label className="label">
              <span className="label-text-alt text-red-500 text-sm flex items-center">
                <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                {errors.confirmer_mot_de_passe.message}
              </span>
            </label>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Étape 2: Informations de l'entreprise
export const Step2CompanyInfo = ({ register, errors }) => (
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
            Nom de l'entreprise
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building2 className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.nom_entreprise ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="Ma Super Entreprise"
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
              IFU
            </span>
          </label>
          <input
            type="text"
            className={`input input-bordered w-full h-12 text-base transition-colors ${errors.ifu ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="Ex: 3200100123456"
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
              Registre de commerce
            </span>
          </label>
          <input
            type="text"
            className={`input input-bordered w-full h-12 text-base transition-colors ${errors.registre_commerce ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="Ex: RC-BJ-2023-000123"
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

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            Adresse du siège
          </span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full h-24 text-base transition-colors ${errors.adresse_siege ? "textarea-error border-red-300" : "focus:border-primary"}`}
          placeholder="Cotonou, Bénin"
          {...register("adresse_siege")}
        />
        {errors.adresse_siege && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.adresse_siege.message}
            </span>
          </label>
        )}
      </div>
    </div>
  </div>
);

// Étape 3: Contact entreprise
export const Step3ContactInfo = ({ register, errors }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <Phone className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Contact de l'entreprise
      </h2>
      <p className="text-gray-600">
        Dernières informations pour finaliser votre inscription
      </p>
      <div className="flex items-center justify-center space-x-2 mt-3">
        <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
        <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
        <div className="w-8 h-2 bg-primary rounded-full"></div>
      </div>
    </div>

    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700">
            Téléphone de l'entreprise
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.telephone_entreprise ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="+229 1234567890"
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

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-gray-700">
            Email de l'entreprise
          </span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            className={`input input-bordered w-full pl-11 h-12 text-base transition-colors ${errors.email_entreprise ? "input-error border-red-300" : "focus:border-primary"}`}
            placeholder="contact@entreprise.com"
            {...register("email_entreprise")}
          />
        </div>
        {errors.email_entreprise && (
          <label className="label">
            <span className="label-text-alt text-red-500 text-sm flex items-center">
              <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {errors.email_entreprise.message}
            </span>
          </label>
        )}
      </div>

      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mt-6">
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-2 text-lg">
              Prêt à commencer !
            </h4>
            <div className="space-y-2">
              <p className="text-blue-700 text-sm">
                Vous êtes sur le point de créer votre compte et votre
                entreprise.
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
