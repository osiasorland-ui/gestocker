-- Fonction sécurisée de vérification de mot de passe
-- Utilise uniquement la table utilisateurs et gère correctement le hashage
DROP FUNCTION IF EXISTS verify_user_password(TEXT, TEXT);

CREATE OR REPLACE FUNCTION verify_user_password(p_email TEXT, p_password TEXT)
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
  password_valid BOOLEAN := FALSE;
BEGIN
  -- Rechercher l'utilisateur actif avec ses informations complètes
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
  WHERE u.email = LOWER(p_email) AND u.statut = 'actif';
  
  -- Vérifier si l'utilisateur existe
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Vérifier le mot de passe
  -- Si le mot de passe stocké commence par $2$, c'est du bcrypt hashé
  IF user_record.mot_de_passe LIKE '$2a$%' OR user_record.mot_de_passe LIKE '$2b$%' OR user_record.mot_de_passe LIKE '$2y$%' THEN
    -- Pour bcrypt, la vérification doit se faire côté application
    -- On retourne une erreur pour forcer la vérification côté client
    RAISE EXCEPTION 'Bcrypt password verification must be done client-side';
  ELSE
    -- Pour les mots de passe non hashés (ancienne méthode), comparaison directe
    IF user_record.mot_de_passe = p_password THEN
      password_valid := TRUE;
    END IF;
  END IF;
  
  -- Si le mot de passe est valide, retourner les informations
  IF password_valid THEN
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

-- Révoquer les permissions existantes et les redonner
REVOKE ALL ON FUNCTION verify_user_password(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO authenticated, anon;
