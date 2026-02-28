import React, { useState, useEffect, useContext, createContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseAuthService } from "../config/supabase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const initializeAuth = async () => {
      try {
        const result = await supabaseAuthService.getCurrentUser();
        if (result.success) {
          setUser(result.data);
        }
      } catch (error) {
        console.error("Erreur d'initialisation auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Écouter les changements d'état d'authentification
    const {
      data: { subscription },
    } = supabaseAuthService.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        const result = await supabaseAuthService.getCurrentUser();
        if (result.success) {
          setUser(result.data);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password, entreprise) => {
    try {
      const result = await supabaseAuthService.signIn(email, password);

      if (result.success) {
        setUser(result.data);
        localStorage.setItem("user", JSON.stringify(result.data));
        return { success: true };
      } else {
        return {
          success: false,
          message: result.message || "Email ou mot de passe incorrect",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Erreur de connexion. Veuillez réessayer.",
      };
    }
  };

  const register = async (userData) => {
    try {
      const result = await supabaseAuthService.signUp(
        userData.email,
        userData.mot_de_passe,
        userData,
      );

      if (result.success) {
        return { success: true };
      } else {
        return {
          success: false,
          message: result.message || "Erreur lors de la création du compte",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Erreur de connexion. Veuillez réessayer.",
      };
    }
  };

  const logout = async () => {
    try {
      await supabaseAuthService.signOut();
      setUser(null);
      localStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      if (user?.user?.id) {
        const result = await supabaseAuthService.updateProfile(
          user.user.id,
          updatedData,
        );

        if (result.success) {
          const updatedUser = {
            ...user,
            profile: { ...user.profile, ...result.data },
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error("Erreur de mise à jour du profil:", error);
    }
  };

  const resetPassword = async (email) => {
    try {
      const result = await supabaseAuthService.resetPassword(email);
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de la réinitialisation du mot de passe.",
      };
    }
  };

  const getEntreprises = async () => {
    try {
      const result = await supabaseAuthService.getEntreprises();
      return result;
    } catch (error) {
      return {
        success: false,
        message: "Erreur lors de la récupération des entreprises.",
      };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    getEntreprises,
    loading,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}
