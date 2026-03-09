// Script de test pour le flux de première connexion
// Ce script simule le processus complet de création d'utilisateur et première connexion

import { createAdminClient } from '../config/supabase.js';
import { auth } from '../config/auth.js';

class FirstLoginTest {
  constructor() {
    this.supabaseAdmin = createAdminClient();
    this.testUser = null;
  }

  // Nettoyer les données de test
  async cleanup() {
    if (this.testUser) {
      try {
        await this.supabaseAdmin
          .from('utilisateurs')
          .delete()
          .eq('email', this.testUser.email);
        console.log('✅ Utilisateur de test supprimé');
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
      }
    }
  }

  // Créer un utilisateur de test
  async createTestUser() {
    const testUserData = {
      nom: 'TEST',
      prenom: 'User',
      email: 'test.user@example.com',
      telephone: '+2290123456789',
      id_role: '550e8400-e29b-41d4-a716-446655440003', // Employé
      id_entreprise: 'test-entreprise-id',
      statut: 'actif',
      first_time_login: true
    };

    try {
      const { data, error } = await this.supabaseAdmin
        .from('utilisateurs')
        .insert(testUserData)
        .select()
        .single();

      if (error) throw error;
      
      this.testUser = data;
      console.log('✅ Utilisateur de test créé:', data.email);
      return data;
    } catch (error) {
      console.error('❌ Erreur création utilisateur:', error);
      throw error;
    }
  }

  // Tester la connexion avec mot de passe par défaut
  async testDefaultLogin() {
    try {
      console.log('🔐 Test de connexion avec mot de passe par défaut...');
      
      const result = await auth.signIn(
        this.testUser.email,
        'Password123'
      );

      if (result.success) {
        console.log('✅ Connexion réussie');
        console.log('📊 Données utilisateur:', {
          email: result.user.email,
          first_time_login: result.user.first_time_login,
          nom: result.user.nom,
          prenom: result.user.prenom
        });

        // Vérifier que first_time_login est bien true
        if (result.user.first_time_login) {
          console.log('✅ first_time_login est bien détecté comme true');
          return true;
        } else {
          console.log('❌ first_time_login devrait être true');
          return false;
        }
      } else {
        console.log('❌ Échec de la connexion:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de connexion:', error);
      return false;
    }
  }

  // Tester le changement de mot de passe
  async testPasswordChange() {
    try {
      console.log('🔄 Test du changement de mot de passe...');
      
      const newPassword = 'NewPassword123';
      
      // Mettre à jour le mot de passe et first_time_login
      const { error } = await this.supabaseAdmin
        .from('utilisateurs')
        .update({
          mot_de_passe: newPassword,
          first_time_login: false,
          updated_at: new Date().toISOString()
        })
        .eq('id_user', this.testUser.id_user);

      if (error) throw error;

      console.log('✅ Mot de passe mis à jour dans la base de données');

      // Tester la connexion avec le nouveau mot de passe
      const result = await auth.signIn(
        this.testUser.email,
        newPassword
      );

      if (result.success) {
        console.log('✅ Connexion réussie avec le nouveau mot de passe');
        
        // Vérifier que first_time_login est bien false
        if (!result.user.first_time_login) {
          console.log('✅ first_time_login est bien passé à false');
          return true;
        } else {
          console.log('❌ first_time_login devrait être false');
          return false;
        }
      } else {
        console.log('❌ Échec de la connexion avec nouveau mot de passe:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement de mot de passe:', error);
      return false;
    }
  }

  // Exécuter le test complet
  async runFullTest() {
    console.log('🚀 DÉBUT DU TEST COMPLET DE PREMIÈRE CONNEXION');
    console.log('=' .repeat(50));

    try {
      // Étape 1: Créer l'utilisateur de test
      await this.createTestUser();

      // Étape 2: Tester la connexion avec mot de passe par défaut
      const loginSuccess = await this.testDefaultLogin();
      if (!loginSuccess) {
        throw new Error('Échec du test de connexion par défaut');
      }

      // Étape 3: Tester le changement de mot de passe
      const passwordChangeSuccess = await this.testPasswordChange();
      if (!passwordChangeSuccess) {
        throw new Error('Échec du test de changement de mot de passe');
      }

      console.log('=' .repeat(50));
      console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
      console.log('✅ Le flux de première connexion fonctionne correctement');
      
      return true;
    } catch (error) {
      console.error('💥 ÉCHEC DU TEST:', error.message);
      return false;
    } finally {
      // Nettoyer les données de test
      await this.cleanup();
    }
  }
}

// Fonction pour exécuter le test
export const runFirstLoginTest = async () => {
  const tester = new FirstLoginTest();
  return await tester.runFullTest();
};

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.testFirstLogin = runFirstLoginTest;
  console.log('🧪 Test de première connexion disponible: tapez testFirstLogin() dans la console');
}

export default FirstLoginTest;
