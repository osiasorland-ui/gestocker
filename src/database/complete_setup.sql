-- ==========================================
-- SCRIPT D'INSTALLATION COMPLÈTE
-- ==========================================
-- Exécutez ce script dans l'ordre :
-- 1. databaseGestocker.sql (création des tables)
-- 2. rls_policies.sql (configuration RLS)
-- 3. rpc_functions.sql (fonctions RPC)
-- 4. password_security_migration.sql (sécurité mots de passe)

-- Ce fichier contient les instructions d'installation

-- ÉTAPE 1: Créer la base de données
-- \i databaseGestocker.sql

-- ÉTAPE 2: Configurer les politiques RLS
-- \i rls_policies.sql

-- ÉTAPE 3: Déployer les fonctions RPC
-- \i rpc_functions.sql

-- ÉTAPE 4: Appliquer la sécurité des mots de passe
-- \i password_security_migration.sql

-- ÉTAPE 5: Insérer les permissions de base si nécessaire
-- Les permissions sont déjà dans rpc_functions.sql

-- Vérification finale
SELECT 'Tables créées' as status, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('entreprises', 'utilisateurs', 'roles', 'permissions');

SELECT 'Politiques RLS activées' as status, COUNT(*) as count FROM pg_policies WHERE schemaname = 'public';

SELECT 'Fonctions RPC créées' as status, COUNT(*) as count FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%_%';
