-- Script pour supprimer l'ancienne fonction et recréer la nouvelle version
-- Exécuter ce script si vous rencontrez l'erreur "function name is not unique"

-- Étape 1: Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS verify_user_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(user_email TEXT, user_password TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(p_email TEXT, p_password TEXT) CASCADE;

-- Étape 2: Recréer la fonction avec la nouvelle signature
CREATE FUNCTION verify_user_password(p_email TEXT, p_password TEXT)
RETURNS TABLE(
  id_user UUID,
  nom TEXT,
  prenom TEXT,
  email TEXT,
  id_role UUID,
  role_libelle TEXT,
  id_entreprise UUID,
  entreprise_nom TEXT,
  statut TEXT,
  first_time_login BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Rechercher l'utilisateur avec ses informations complètes
  SELECT 
    u.id_user,
    u.nom,
    u.prenom,
    u.email,
    u.mot_de_passe,
    u.id_role,
    u.id_entreprise,
    u.statut,
    u.first_time_login,
    r.libelle as role_libelle,
    e.nom_commercial as entreprise_nom
  INTO user_record
  FROM utilisateurs u
  LEFT JOIN roles r ON u.id_role = r.id_role
  LEFT JOIN entreprises e ON u.id_entreprise = e.id_entreprise
  WHERE u.email = p_email AND u.statut = 'actif';
  
  -- Vérifier si l'utilisateur existe
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Vérifier le mot de passe (comparaison simple en clair - à améliorer avec du hashage)
  IF user_record.mot_de_passe = p_password THEN
    -- Retourner les informations de l'utilisateur
    RETURN QUERY
    SELECT 
      user_record.id_user::UUID,
      user_record.nom::TEXT,
      user_record.prenom::TEXT,
      user_record.email::TEXT,
      user_record.id_role::UUID,
      user_record.role_libelle::TEXT,
      user_record.id_entreprise::UUID,
      user_record.entreprise_nom::TEXT,
      user_record.statut::TEXT,
      COALESCE(user_record.first_time_login, false)::BOOLEAN;
  END IF;
  
  RETURN;
END;
$$;

-- Étape 3: Donner les permissions
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO authenticated, anon;

-- Étape 4: Vérifier que la fonction est bien créée
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'verify_user_password';
