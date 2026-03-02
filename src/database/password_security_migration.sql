-- ==========================================
-- MIGRATION POUR AMÉLIORER LA SÉCURITÉ DES MOTS DE PASSE
-- ==========================================

-- Ajouter l'extension pgcrypto si elle n'existe pas
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ajouter une colonne pour le mot de passe hashé (transition)
ALTER TABLE utilisateurs 
ADD COLUMN mot_de_passe_hash TEXT;

-- Créer une fonction pour hasher les mots de passe
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN crypt(password, gen_salt('bf'));
END;
$$;

-- Créer une fonction pour vérifier les mots de passe
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hashed_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN hashed_password = crypt(password, hashed_password);
END;
$$;

-- Mettre à jour la fonction signin_check_credentials pour utiliser les mots de passe hashés
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
    
    -- Vérifier le mot de passe (d'abord avec le hash, puis avec l'ancienne méthode)
    IF user_record.mot_de_passe_hash IS NOT NULL THEN
        -- Utiliser la méthode hashée
        is_valid := verify_password(p_mot_de_passe, user_record.mot_de_passe_hash);
    ELSIF user_record.mot_de_passe IS NOT NULL THEN
        -- Utiliser l'ancienne méthode (temporaire pour la migration)
        IF user_record.mot_de_passe = p_mot_de_passe THEN
            is_valid := TRUE;
            -- Hasher le mot de passe pour les futures connexions
            UPDATE utilisateurs 
            SET mot_de_passe_hash = hash_password(user_record.mot_de_passe)
            WHERE id_user = user_record.id_user;
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

-- Mettre à jour la fonction signup_create_company_and_user pour hasher les mots de passe
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
    hashed_password TEXT;
BEGIN
    -- Hasher le mot de passe
    hashed_password := hash_password(p_mot_de_passe);
    
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
    
    -- Créer l'utilisateur avec mot de passe hashé
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
    
    -- Retourner les IDs créés
    RETURN QUERY SELECT new_entreprise_id, new_user_id, NULL::TEXT;
    
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT NULL::UUID, NULL::INT, 'Erreur lors de la création: ' || SQLERRM::TEXT;
END;
$$;

-- Fonction pour migrer les mots de passe existants
CREATE OR REPLACE FUNCTION migrate_existing_passwords()
RETURNS TABLE (
    user_id INT,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id_user, mot_de_passe, mot_de_passe_hash 
        FROM utilisateurs 
        WHERE mot_de_passe IS NOT NULL 
        AND mot_de_passe_hash IS NULL
    LOOP
        UPDATE utilisateurs 
        SET mot_de_passe_hash = hash_password(user_record.mot_de_passe)
        WHERE id_user = user_record.id_user;
        
        RETURN QUERY SELECT user_record.id_user, 'Migrated'::TEXT;
    END LOOP;
    
    RETURN;
END;
$$;

-- Commentaire pour la migration future
-- Après avoir vérifié que tout fonctionne, vous pouvez supprimer la colonne mot_de_passe:
-- ALTER TABLE utilisateurs DROP COLUMN mot_de_passe;
