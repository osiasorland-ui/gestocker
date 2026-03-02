-- ==========================================
-- CORRECTION : SUPPRIMER LES DOUBLONS DE FONCTIONS RPC
-- ==========================================

-- Supprimer d'abord toutes les versions existantes pour éviter les conflits
DROP FUNCTION IF EXISTS signup_create_company_and_user(
    p_nom_commercial VARCHAR(150),
    p_raison_sociale VARCHAR(150),
    p_ifu VARCHAR(50),
    p_registre_commerce VARCHAR(100),
    p_adresse_siege TEXT,
    p_telephone_contact VARCHAR(20),
    p_email_entreprise VARCHAR(150),
    p_nom_user VARCHAR(100),
    p_email_user VARCHAR(150),
    p_mot_de_passe TEXT,
    p_id_role INT
);

DROP FUNCTION IF EXISTS signin_check_credentials(
    p_email VARCHAR(150),
    p_mot_de_passe TEXT
);

DROP FUNCTION IF EXISTS has_permission(
    user_id_param INT,
    permission_name VARCHAR(100)
);

DROP FUNCTION IF EXISTS get_user_permissions(
    user_id_param INT
);

-- ==========================================
-- RECÉERER LES FONCTIONS AVEC DES TYPES COHÉRENTS
-- ==========================================

-- Fonction de connexion sécurisée avec vérification des identifiants
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
    user_record RECORD;
    is_valid BOOLEAN := FALSE;
BEGIN
    -- Rechercher l'utilisateur par email
    SELECT u.id_user, u.nom, u.email, u.mot_de_passe, u.mot_de_passe_hash, u.id_role, u.id_entreprise, r.libelle
    INTO user_record
    FROM utilisateurs u
    LEFT JOIN roles r ON u.id_role = r.id_role
    WHERE u.email = p_email;
    
    -- Si l'utilisateur n'existe pas
    IF user_record IS NULL THEN
        RETURN QUERY SELECT NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::INT, NULL::UUID, NULL::VARCHAR, 'Email ou mot de passe incorrect'::TEXT;
        RETURN;
    END IF;
    
    -- Vérifier le mot de passe (avec crypt() si les mots de passe sont hashés)
    -- Pour l'instant, comparaison simple (à améliorer avec bcrypt)
    IF user_record.mot_de_passe_hash IS NOT NULL THEN
        -- Utiliser la méthode hashée
        BEGIN
            is_valid := (user_record.mot_de_passe_hash = crypt(p_mot_de_passe, user_record.mot_de_passe_hash));
        EXCEPTION WHEN OTHERS THEN
            is_valid := FALSE;
        END;
    ELSIF user_record.mot_de_passe IS NOT NULL THEN
        -- Utiliser l'ancienne méthode (temporaire pour la migration)
        IF user_record.mot_de_passe = p_mot_de_passe THEN
            is_valid := TRUE;
            -- Hasher le mot de passe pour les futures connexions
            BEGIN
                UPDATE utilisateurs 
                SET mot_de_passe_hash = crypt(p_mot_de_passe, gen_salt('bf'))
                WHERE id_user = user_record.id_user;
            EXCEPTION WHEN OTHERS THEN
                -- Ignorer l'erreur si pgcrypto n'est pas disponible
                NULL;
            END;
        END IF;
    END IF;
    
    -- Retourner les données utilisateur si valide
    IF is_valid THEN
        RETURN QUERY 
        SELECT 
            user_record.id_user,
            user_record.nom,
            user_record.email,
            user_record.id_role,
            user_record.id_entreprise,
            user_record.libelle,
            NULL::TEXT;
    ELSE
        RETURN QUERY SELECT NULL::INT, NULL::VARCHAR, NULL::VARCHAR, NULL::INT, NULL::UUID, NULL::VARCHAR, 'Email ou mot de passe incorrect'::TEXT;
    END IF;
    
    RETURN;
END;
$$;

-- Fonction pour créer une entreprise et un utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION signup_create_company_and_user(
    p_nom_commercial VARCHAR(150),
    p_raison_sociale VARCHAR(150),
    p_ifu VARCHAR(50),
    p_registre_commerce VARCHAR(100),
    p_adresse_siege TEXT,
    p_telephone_contact VARCHAR(20),
    p_email_entreprise VARCHAR(150),
    p_nom_user VARCHAR(100),
    p_email_user VARCHAR(150),
    p_mot_de_passe TEXT,
    p_id_role INT
)
RETURNS TABLE (
    id_entreprise UUID,
    id_user INT,
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_entreprise_id UUID;
    new_user_id INT;
    default_role_id INT;
    hashed_password TEXT;
BEGIN
    -- Hasher le mot de passe si pgcrypto est disponible
    BEGIN
        hashed_password := crypt(p_mot_de_passe, gen_salt('bf'));
    EXCEPTION WHEN OTHERS THEN
        hashed_password := p_mot_de_passe; -- Fallback en clair si pgcrypto n'est pas dispo
    END;
    
    -- Vérifier si l'email utilisateur existe déjà
    IF EXISTS (SELECT 1 FROM utilisateurs WHERE email = p_email_user) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INT, 'Cet email est déjà utilisé'::TEXT;
        RETURN;
    END IF;
    
    -- Vérifier si l'IFU existe déjà
    IF EXISTS (SELECT 1 FROM entreprises WHERE ifu = p_ifu) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INT, 'Cet IFU est déjà utilisé'::TEXT;
        RETURN;
    END IF;
    
    -- Vérifier si le registre de commerce existe déjà
    IF EXISTS (SELECT 1 FROM entreprises WHERE registre_commerce = p_registre_commerce) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::INT, 'Ce registre de commerce est déjà utilisé'::TEXT;
        RETURN;
    END IF;
    
    -- Déterminer le rôle par défaut (Admin si non spécifié ou NULL)
    IF p_id_role IS NULL THEN
        SELECT id_role INTO default_role_id FROM roles WHERE libelle = 'Admin' LIMIT 1;
        IF default_role_id IS NULL THEN
            default_role_id := 1; -- Premier rôle par défaut
        END IF;
    ELSE
        default_role_id := p_id_role;
    END IF;
    
    -- Créer l'entreprise
    INSERT INTO entreprises (
        nom_commercial, 
        raison_sociale, 
        ifu, 
        registre_commerce, 
        adresse_siege, 
        telephone_contact, 
        email_entreprise
    ) VALUES (
        p_nom_commercial,
        p_raison_sociale,
        p_ifu,
        p_registre_commerce,
        p_adresse_siege,
        p_telephone_contact,
        p_email_entreprise
    ) RETURNING id_entreprise INTO new_entreprise_id;
    
    -- Créer l'utilisateur avec mot de passe hashé ou en clair
    IF hashed_password != p_mot_de_passe THEN
        -- Mot de passe hashé
        INSERT INTO utilisateurs (
            nom,
            email,
            mot_de_passe_hash,
            id_role,
            id_entreprise
        ) VALUES (
            p_nom_user,
            p_email_user,
            hashed_password,
            default_role_id,
            new_entreprise_id
        ) RETURNING id_user INTO new_user_id;
    ELSE
        -- Mot de passe en clair (fallback)
        INSERT INTO utilisateurs (
            nom,
            email,
            mot_de_passe,
            id_role,
            id_entreprise
        ) VALUES (
            p_nom_user,
            p_email_user,
            hashed_password,
            default_role_id,
            new_entreprise_id
        ) RETURNING id_user INTO new_user_id;
    END IF;
    
    -- Retourner les IDs créés
    RETURN QUERY SELECT new_entreprise_id, new_user_id, NULL::TEXT;
    
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT NULL::UUID, NULL::INT, 'Erreur lors de la création: ' || SQLERRM::TEXT;
END;
$$;

-- Fonction pour vérifier les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION has_permission(
    user_id_param INT,
    permission_name VARCHAR(100)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_perm BOOLEAN := FALSE;
BEGIN
    -- Vérifier si l'utilisateur a la permission spécifiée
    SELECT EXISTS (
        SELECT 1
        FROM role_permission rp
        JOIN permissions p ON rp.id_permission = p.id_permission
        WHERE rp.id_role = (
            SELECT id_role FROM utilisateurs WHERE id_user = user_id_param
        )
        AND p.nom_action = permission_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$;

-- Fonction pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_permissions(
    user_id_param INT
)
RETURNS TABLE (
    permission_name VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT p.nom_action
    FROM role_permission rp
    JOIN permissions p ON rp.id_permission = p.id_permission
    WHERE rp.id_role = (
        SELECT id_role FROM utilisateurs WHERE id_user = user_id_param
    );
END;
$$;
