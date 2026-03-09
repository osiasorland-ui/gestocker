-- Script de nettoyage complet pour résoudre le conflit de fonctions
-- Ce script va supprimer TOUTES les versions de verify_user_password et en recréer une seule

-- Étape 1: Supprimer toutes les versions existantes (avec et sans arguments spécifiés)
DROP FUNCTION IF EXISTS verify_user_password() CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(CHARACTER VARYING, CHARACTER VARYING) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(user_email TEXT, user_password TEXT) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(user_email VARCHAR, user_password VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS verify_user_password(user_email CHARACTER VARYING, user_password CHARACTER VARYING) CASCADE;

-- Étape 2: Vérifier que toutes les fonctions ont été supprimées
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count 
    FROM pg_proc 
    WHERE proname = 'verify_user_password';
    
    IF func_count > 0 THEN
        RAISE EXCEPTION 'Il reste encore % fonctions verify_user_password. Vérifiez la sortie ci-dessous:', func_count;
    ELSE
        RAISE NOTICE '✅ Toutes les fonctions verify_user_password ont été supprimées avec succès';
    END IF;
END $$;

-- Étape 3: Recréer la fonction avec une signature unique et standardisée
CREATE FUNCTION verify_user_password(
    p_email TEXT, 
    p_password TEXT
)
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
    
    -- Vérifier le mot de passe
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

-- Étape 4: Donner les permissions
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO PUBLIC;

-- Étape 5: Vérifier le résultat final
SELECT 
    'FONCTION FINALE' as status,
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    'OK' as verification
FROM pg_proc 
WHERE proname = 'verify_user_password';

-- Étape 6: Test rapide (commenté pour éviter les erreurs)
-- SELECT * FROM verify_user_password('test@example.com', 'Password123') LIMIT 1;
