import { User, Mail, Phone, Building2, Lock, Eye, EyeOff } from "lucide-react";

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
  <div className="space-y-3">
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">Vos informations</h2>
      <p className="text-xs text-gray-600">
        Étape 1/3 - Informations personnelles
      </p>
    </div>

    <div className="form-control">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <User className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className={`input input-bordered w-full pl-9 text-sm h-9 ${errors.nom ? "input-error" : ""}`}
          placeholder="Jean Dupont"
          {...register("nom")}
        />
      </div>
      {errors.nom && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.nom.message}
          </span>
        </label>
      )}
    </div>

    <div className="form-control">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="email"
          className={`input input-bordered w-full pl-9 text-sm h-9 ${errors.email ? "input-error" : ""}`}
          placeholder="exemple@gmail.com"
          {...register("email")}
        />
      </div>
      {errors.email && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.email.message}
          </span>
        </label>
      )}
    </div>

    <div className="form-control">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="tel"
          className={`input input-bordered w-full pl-9 text-sm h-9 ${errors.telephone ? "input-error" : ""}`}
          placeholder="+229 1234567890"
          {...register("telephone")}
        />
      </div>
      {errors.telephone && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.telephone.message}
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
          className={`input input-bordered w-full pl-9 pr-9 text-sm h-9 ${errors.mot_de_passe ? "input-error" : ""}`}
          placeholder="••••••••"
          {...register("mot_de_passe")}
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
      {errors.mot_de_passe && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.mot_de_passe.message}
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
          type={showConfirmPassword ? "text" : "password"}
          className={`input input-bordered w-full pl-9 pr-9 text-sm h-9 ${errors.confirmer_mot_de_passe ? "input-error" : ""}`}
          placeholder="••••••••"
          {...register("confirmer_mot_de_passe")}
          onPaste={handlePastePassword}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          {showConfirmPassword ? (
            <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          ) : (
            <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      </div>
      {errors.confirmer_mot_de_passe && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.confirmer_mot_de_passe.message}
          </span>
        </label>
      )}
    </div>
  </div>
);

// Étape 2: Informations de l'entreprise
export const Step2CompanyInfo = ({ register, errors }) => (
  <div className="space-y-3">
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">
        Informations de l'entreprise
      </h2>
      <p className="text-xs text-gray-600">
        Étape 2/3 - Détails de votre entreprise
      </p>
    </div>

    <div className="form-control">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Building2 className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className={`input input-bordered w-full pl-9 text-sm h-9 ${errors.nom_entreprise ? "input-error" : ""}`}
          placeholder="Ma Super Entreprise"
          {...register("nom_entreprise")}
        />
      </div>
      {errors.nom_entreprise && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.nom_entreprise.message}
          </span>
        </label>
      )}
    </div>

    <div className="form-control">
      <input
        type="text"
        className={`input input-bordered w-full text-sm h-9 ${errors.raison_sociale ? "input-error" : ""}`}
        placeholder="Ma Super Entreprise SARL"
        {...register("raison_sociale")}
      />
      {errors.raison_sociale && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.raison_sociale.message}
          </span>
        </label>
      )}
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="form-control">
        <input
          type="text"
          className={`input input-bordered w-full text-sm h-9 ${errors.ifu ? "input-error" : ""}`}
          placeholder="Ex: 3200100123456"
          maxLength={13}
          {...register("ifu")}
        />
        {errors.ifu && (
          <label className="label">
            <span className="label-text-alt text-error text-xs">
              {errors.ifu.message}
            </span>
          </label>
        )}
      </div>

      <div className="form-control">
        <input
          type="text"
          className={`input input-bordered w-full text-sm h-9 ${errors.registre_commerce ? "input-error" : ""}`}
          placeholder="Ex: RC-BJ-2023-000123"
          {...register("registre_commerce")}
        />
        {errors.registre_commerce && (
          <label className="label">
            <span className="label-text-alt text-error text-xs">
              {errors.registre_commerce.message}
            </span>
          </label>
        )}
      </div>
    </div>

    <div className="form-control">
      <textarea
        className={`textarea textarea-bordered w-full text-sm h-16 ${errors.adresse_siege ? "textarea-error" : ""}`}
        placeholder="Cotonou, Bénin"
        {...register("adresse_siege")}
      />
      {errors.adresse_siege && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.adresse_siege.message}
          </span>
        </label>
      )}
    </div>
  </div>
);

// Étape 3: Contact entreprise
export const Step3ContactInfo = ({ register, errors }) => (
  <div className="space-y-3">
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-1">
        Contact de l'entreprise
      </h2>
      <p className="text-xs text-gray-600">
        Étape 3/3 - Informations de contact
      </p>
    </div>

    <div className="form-control">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Phone className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="tel"
          className={`input input-bordered w-full pl-9 text-sm h-9 ${errors.telephone_entreprise ? "input-error" : ""}`}
          placeholder="+229 1234567890"
          {...register("telephone_entreprise")}
        />
      </div>
      {errors.telephone_entreprise && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.telephone_entreprise.message}
          </span>
        </label>
      )}
    </div>

    <div className="form-control">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Mail className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="email"
          className={`input input-bordered w-full pl-9 text-sm h-9 ${errors.email_entreprise ? "input-error" : ""}`}
          placeholder="contact@entreprise.gmail.com"
          {...register("email_entreprise")}
        />
      </div>
      {errors.email_entreprise && (
        <label className="label">
          <span className="label-text-alt text-error text-xs">
            {errors.email_entreprise.message}
          </span>
        </label>
      )}
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
      <h4 className="font-semibold text-blue-900 mb-1 text-sm">
        Récapitulatif
      </h4>
      <p className="text-xs text-blue-700">
        Vous êtes sur le point de créer votre compte et votre entreprise. Après
        validation, vous recevrez un email de confirmation.
      </p>
    </div>
  </div>
);
