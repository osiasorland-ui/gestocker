// Fichier principal d'exportation pour la rétrocompatibilité
// Importe tout depuis les modules spécialisés et réexporte

export { supabase, createAdminClient, auth, createClient } from "./auth.js";
export { users } from "./users.js";
export { companies } from "./companies.js";
export { products } from "./products.js";
export { warehouses } from "./warehouses.js";
export { categories } from "./categories.js";
export { movements } from "./movements.js";
export { stocks } from "./stocks.js";
export { otp } from "./otp.js";
export { livreurs } from "./livreurs.js";
export { livraisons } from "./livraisons.js";
export { sales } from "./sales.js";
export { clients } from "./clients.js";
export { fournisseurs } from "./fournisseurs.js";
export { parametres } from "./parametres.js";

// Export par défaut pour compatibilité
import { supabase as defaultSupabase } from "./auth.js";
export default defaultSupabase;
