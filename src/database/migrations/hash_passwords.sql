-- Migration pour hasher les mots de passe existants avec bcrypt
-- À exécuter une seule fois pour migrer les mots de passe en clair

-- ATTENTION: Cette opération est irréversible
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter cette migration

-- Créer une fonction temporaire pour hasher les mots de passe
CREATE OR REPLACE FUNCTION hash_existing_passwords()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  hashed_password TEXT;
BEGIN
  -- Créer l'extension pgcrypto si elle n'existe pas
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- Parcourir tous les utilisateurs avec des mots de passe non hashés
  FOR user_record IN 
    SELECT id_user, email, mot_de_passe 
    FROM utilisateurs 
    WHERE mot_de_passe NOT LIKE '$2%' 
    AND statut = 'actif'
  LOOP
    -- Générer un hash bcrypt (simulation côté serveur)
    -- Note: PostgreSQL ne supporte pas nativement bcrypt
    -- Cette fonction prépare les données pour un traitement côté application
    
    -- Pour l'instant, on ajoute un préfixe pour identifier les mots de passe à migrer
    -- La vraie migration se fera côté application avec bcryptjs
    
    UPDATE utilisateurs 
    SET mot_de_passe = 'MIGRATE_' || mot_de_passe
    WHERE id_user = user_record.id_user;
    
    RAISE NOTICE 'Préparation migration pour: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Migration préparée. Les mots de passe à hasher sont marqués avec MIGRATE_';
END;
$$;

-- Exécuter la migration
SELECT hash_existing_passwords();

-- Nettoyer la fonction temporaire
DROP FUNCTION IF EXISTS hash_existing_passwords();

-- Instructions pour la migration complète:
-- 1. Exportez les utilisateurs avec mots de passe MIGRATE_
-- 2. Utilisez bcryptjs côté application pour hasher
-- 3. Mettez à jour les mots de passe dans la base de données
