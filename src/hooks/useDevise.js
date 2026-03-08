import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuthHook.js";
import { supabase } from "../config/supabase.js";

// Clé pour stocker la devise localement
const DEVISE_STORAGE_KEY = "gestocker_devise";

// Hook pour accéder à la devise actuelle et être notifié des changements
export const useDevise = () => {
  const { profile } = useAuth();

  // Essayer de récupérer la devise sauvegardée localement au démarrage
  const getInitialDevise = () => {
    if (typeof window !== "undefined") {
      const savedDevise = localStorage.getItem(DEVISE_STORAGE_KEY);
      return savedDevise || "XOF";
    }
    return "XOF";
  };

  const [devise, setDevise] = useState(getInitialDevise());
  const [loading, setLoading] = useState(true);

  // Sauvegarder la devise localement quand elle change
  const saveDeviseLocally = useCallback((newDevise) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DEVISE_STORAGE_KEY, newDevise);
    }
  }, []);

  // Charger la devise actuelle
  const loadDevise = useCallback(async () => {
    if (!profile?.id_entreprise) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("parametres_unifies")
        .select("valeur_parametre")
        .eq("id_entreprise", profile.id_entreprise)
        .eq("categorie", "systeme")
        .eq("nom_parametre", "devise")
        .eq("est_actif", true)
        .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour gérer les résultats vides

      if (data && !error) {
        setDevise(data.valeur_parametre);
        saveDeviseLocally(data.valeur_parametre);
        console.log(
          "Devise chargée depuis la base de données:",
          data.valeur_parametre,
        );
      } else {
        // Utiliser la valeur par défaut si aucun paramètre trouvé ou erreur de permissions
        console.log(
          "Paramètre devise non trouvé ou erreur de permissions, utilisation de la valeur sauvegardée ou par défaut XOF",
        );
        if (error) {
          console.error(
            "Erreur lors du chargement du paramètre devise:",
            error.message,
          );
        }
        // Garder la devise actuelle (qui vient du localStorage ou XOF par défaut)
        saveDeviseLocally(devise);
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la devise:", error);
      // Garder la devise actuelle en cas d'erreur
      saveDeviseLocally(devise);
    } finally {
      setLoading(false);
    }
  }, [profile?.id_entreprise, devise, saveDeviseLocally]);

  useEffect(() => {
    loadDevise();
  }, [loadDevise]);

  // Formater un montant avec la devise actuelle
  const formatMontant = (montant) => {
    const nombre = parseFloat(montant);
    if (isNaN(nombre)) return "0,00 " + devise;

    // Formatter selon la devise
    switch (devise) {
      case "EUR":
        return new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
        }).format(nombre);

      case "USD":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(nombre);

      case "XOF":
      default:
        // Pour le XOF, formatage manuel car pas supporté par Intl
        return (
          nombre.toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }) + " XOF"
        );
    }
  };

  // Obtenir le symbole de la devise
  const getSymboleDevise = () => {
    switch (devise) {
      case "EUR":
        return "€";
      case "USD":
        return "$";
      case "XOF":
        return "XOF";
      default:
        return devise;
    }
  };

  // Mettre à jour la devise et la sauvegarder
  const updateDevise = (newDevise) => {
    setDevise(newDevise);
    saveDeviseLocally(newDevise);
    console.log("Devise mise à jour:", newDevise);
  };

  return {
    devise,
    setDevise: updateDevise,
    loading,
    formatMontant,
    getSymboleDevise,
    reloadDevise: loadDevise,
  };
};

export default useDevise;
