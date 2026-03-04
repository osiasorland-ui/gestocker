// Point d'entrée principal pour toutes les configurations Supabase
// Exporte tout depuis les modules spécialisés

export { supabase, auth } from "./auth.js";
export { users } from "./users.js";
export { companies } from "./companies.js";
export { products } from "./products.js";
export { warehouses } from "./warehouses.js";
export { categories } from "./categories.js";
export { otp } from "./otp.js";

// Export par défaut pour compatibilité
import { supabase as defaultSupabase } from "./auth.js";
export default defaultSupabase;
