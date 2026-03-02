-- ==========================================
-- FONCTIONS RPC POUR L'AUTHENTIFICATION
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
    SELECT u.id_user, u.nom, u.email, u.mot_de_passe, u.id_role, u.id_entreprise, r.libelle
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
    IF user_record.mot_de_passe = p_mot_de_passe THEN
        is_valid := TRUE;
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
    p_id_role INT DEFAULT NULL
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
BEGIN
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
    
    -- Déterminer le rôle par défaut (Admin si non spécifié)
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
    
    -- Créer l'utilisateur
    INSERT INTO utilisateurs (
        nom,
        email,
        mot_de_passe,
        id_role,
        id_entreprise
    ) VALUES (
        p_nom_user,
        p_email_user,
        p_mot_de_passe, -- TODO: Ajouter hashage du mot de passe
        default_role_id,
        new_entreprise_id
    ) RETURNING id_user INTO new_user_id;
    
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

-- Insérer les permissions de base
INSERT INTO permissions (nom_action) VALUES 
('CREATE_USER'),
('READ_USER'),
('UPDATE_USER'),
('DELETE_USER'),
('CREATE_PRODUCT'),
('READ_PRODUCT'),
('UPDATE_PRODUCT'),
('DELETE_PRODUCT'),
('CREATE_STOCK'),
('READ_STOCK'),
('UPDATE_STOCK'),
('DELETE_STOCK'),
('CREATE_ORDER'),
('READ_ORDER'),
('UPDATE_ORDER'),
('DELETE_ORDER'),
('MANAGE_COMPANY'),
('VIEW_REPORTS');
