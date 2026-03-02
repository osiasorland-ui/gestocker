-- Fonction de connexion corrigée pour éviter l'ambiguïté
DROP FUNCTION IF EXISTS signin_check_credentials(
    p_email VARCHAR(150),
    p_mot_de_passe TEXT
);

CREATE OR REPLACE FUNCTION signin_check_credentials(
    p_email VARCHAR(150),
    p_mot_de_passe TEXT
)
RETURNS TABLE (
    id_user INT,
    nom VARCHAR(100),
    email VARCHAR(150),
    id_role INT,
    id_entreprise UUID,
    role_libelle VARCHAR(50),
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_found BOOLEAN := FALSE;
    password_match BOOLEAN := FALSE;
    user_id INT;
    user_nom VARCHAR(100);
    user_email VARCHAR(150);
    user_role INT;
    user_entreprise UUID;
    role_name VARCHAR(50);
BEGIN
    -- Vérifier si l'utilisateur existe
    SELECT 
        u.id_user,
        u.nom,
        u.email,
        u.id_role,
        u.id_entreprise,
        r.libelle
    INTO 
        user_id,
        user_nom,
        user_email,
        user_role,
        user_entreprise,
        role_name
    FROM utilisateurs u
    LEFT JOIN roles r ON u.id_role = r.id_role
    WHERE u.email = p_email;
    
    -- Si l'utilisateur n'existe pas
    IF user_id IS NULL THEN
        RETURN QUERY SELECT NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::INT, NULL::UUID, NULL::VARCHAR, 'Email ou mot de passe incorrect'::TEXT;
        RETURN;
    END IF;
    
    user_found := TRUE;
    
    -- Vérifier le mot de passe
    IF EXISTS (SELECT 1 FROM utilisateurs WHERE email = p_email AND mot_de_passe = p_mot_de_passe) THEN
        password_match := TRUE;
    END IF;
    
    -- Retourner les données utilisateur si valide
    IF user_found AND password_match THEN
        RETURN QUERY 
        SELECT 
            user_id,
            user_nom,
            user_email,
            user_role,
            user_entreprise,
            role_name,
            NULL::TEXT;
    ELSE
        RETURN QUERY SELECT NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::INT, NULL::UUID, NULL::VARCHAR, 'Email ou mot de passe incorrect'::TEXT;
    END IF;
    
    RETURN;
END;
$$;
