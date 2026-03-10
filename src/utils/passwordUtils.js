// Utilitaires pour la gestion sécurisée des mots de passe
import bcrypt from "bcryptjs";

/**
 * Hash un mot de passe avec bcrypt
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<string>} - Mot de passe hashé
 */
export const hashPassword = async (password) => {
  try {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error("Erreur lors du hashage du mot de passe:", error);
    throw new Error("Erreur lors du hashage du mot de passe");
  }
};

/**
 * Vérifie un mot de passe avec son hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hashedPassword - Mot de passe hashé
 * @returns {Promise<boolean>} - True si le mot de passe est correct
 */
export const verifyPassword = async (password, hashedPassword) => {
  try {
    // Si le hash stocké commence par $2$, c'est du bcrypt
    if (hashedPassword.startsWith("$2")) {
      return await bcrypt.compare(password, hashedPassword);
    } else {
      // Ancien format - comparaison directe (non sécurisé)
      console.warn("⚠️ Comparaison de mot de passe en clair détectée");
      return password === hashedPassword;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe:", error);
    return false;
  }
};

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} - Mot de passe généré
 */
export const generateSecurePassword = (length = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Valide la force d'un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {Object} - Résultat de la validation avec détails
 */
export const validatePasswordStrength = (password) => {
  const result = {
    isValid: true,
    errors: [],
    score: 0,
  };

  // Longueur minimale
  if (password.length < 8) {
    result.isValid = false;
    result.errors.push("Le mot de passe doit contenir au moins 8 caractères");
  } else {
    result.score += 1;
  }

  // Présence de majuscules
  if (!/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push("Le mot de passe doit contenir au moins une majuscule");
  } else {
    result.score += 1;
  }

  // Présence de minuscules
  if (!/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push("Le mot de passe doit contenir au moins une minuscule");
  } else {
    result.score += 1;
  }

  // Présence de chiffres
  if (!/\d/.test(password)) {
    result.isValid = false;
    result.errors.push("Le mot de passe doit contenir au moins un chiffre");
  } else {
    result.score += 1;
  }

  // Présence de caractères spéciaux
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    result.errors.push(
      "Le mot de passe devrait contenir des caractères spéciaux",
    );
  } else {
    result.score += 1;
  }

  // Force du mot de passe
  if (result.score >= 4) {
    result.strength = "Fort";
  } else if (result.score >= 3) {
    result.strength = "Moyen";
  } else {
    result.strength = "Faible";
  }

  return result;
};
