-- ==========================================
-- FONCTIONS POUR LA MISE À JOUR DES INFORMATIONS ENTREPRISE
-- ==========================================

-- Fonction pour mettre à jour les informations de l'entreprise
CREATE OR REPLACE FUNCTION update_entreprise_info(
    p_entreprise_id UUID,
    p_nom_commercial VARCHAR(150),
    p_raison_sociale VARCHAR(150),
    p_ifu VARCHAR(50),
    p_registre_commerce VARCHAR(100),
    p_adresse_siege TEXT,
    p_telephone_contact VARCHAR(20),
    p_email_entreprise VARCHAR(150),
    p_logo_path TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    entreprise_data JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_entreprise RECORD;
    conflict_count INT;
BEGIN
    -- Vérifier si l'entreprise existe
    SELECT COUNT(*) INTO conflict_count
    FROM entreprises 
    WHERE id_entreprise = p_entreprise_id;
    
    IF conflict_count = 0 THEN
        RETURN QUERY SELECT FALSE, 'Entreprise non trouvée'::TEXT, NULL::JSON;
        RETURN;
    END IF;
    
    -- Vérifier les doublons d'IFU (si l'IFU change)
    IF p_ifu IS NOT NULL THEN
        SELECT COUNT(*) INTO conflict_count
        FROM entreprises 
        WHERE ifu = p_ifu 
        AND id_entreprise != p_entreprise_id;
        
        IF conflict_count > 0 THEN
            RETURN QUERY SELECT FALSE, 'Cet IFU est déjà utilisé par une autre entreprise'::TEXT, NULL::JSON;
            RETURN;
        END IF;
    END IF;
    
    -- Vérifier les doublons de registre de commerce (si le registre change)
    IF p_registre_commerce IS NOT NULL THEN
        SELECT COUNT(*) INTO conflict_count
        FROM entreprises 
        WHERE registre_commerce = p_registre_commerce 
        AND id_entreprise != p_entreprise_id;
        
        IF conflict_count > 0 THEN
            RETURN QUERY SELECT FALSE, 'Ce registre de commerce est déjà utilisé par une autre entreprise'::TEXT, NULL::JSON;
            RETURN;
        END IF;
    END IF;
    
    -- Mettre à jour l'entreprise
    UPDATE entreprises 
    SET 
        nom_commercial = p_nom_commercial,
        raison_sociale = p_raison_sociale,
        ifu = p_ifu,
        registre_commerce = p_registre_commerce,
        adresse_siege = p_adresse_siege,
        telephone_contact = p_telephone_contact,
        email_entreprise = p_email_entreprise,
        logo_path = p_logo_path,
        date_creation = date_creation -- Conserver la date de création originale
    WHERE id_entreprise = p_entreprise_id
    RETURNING * INTO updated_entreprise;
    
    -- Retourner les données mises à jour
    RETURN QUERY 
    SELECT 
        TRUE, 
        'Informations mises à jour avec succès'::TEXT,
        json_build_object(
            'id_entreprise', updated_entreprise.id_entreprise,
            'nom_commercial', updated_entreprise.nom_commercial,
            'raison_sociale', updated_entreprise.raison_sociale,
            'ifu', updated_entreprise.ifu,
            'registre_commerce', updated_entreprise.registre_commerce,
            'adresse_siege', updated_entreprise.adresse_siege,
            'telephone_contact', updated_entreprise.telephone_contact,
            'email_entreprise', updated_entreprise.email_entreprise,
            'logo_path', updated_entreprise.logo_path
        );
    
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT FALSE, 'Erreur lors de la mise à jour: ' || SQLERRM::TEXT, NULL::JSON;
END;
$$;

-- Fonction pour obtenir les informations complètes de l'entreprise
CREATE OR REPLACE FUNCTION get_entreprise_complete_info(
    p_entreprise_id UUID
)
RETURNS TABLE (
    id_entreprise UUID,
    nom_commercial VARCHAR(150),
    raison_sociale VARCHAR(150),
    ifu VARCHAR(50),
    registre_commerce VARCHAR(100),
    adresse_siege TEXT,
    telephone_contact VARCHAR(20),
    email_entreprise VARCHAR(150),
    logo_path TEXT,
    date_creation TIMESTAMP WITH TIME ZONE,
    utilisateurs_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_count INT;
BEGIN
    -- Compter le nombre d'utilisateurs pour cette entreprise
    SELECT COUNT(*) INTO user_count
    FROM utilisateurs 
    WHERE id_entreprise = p_entreprise_id;
    
    -- Retourner les informations de l'entreprise
    RETURN QUERY
    SELECT 
        e.id_entreprise,
        e.nom_commercial,
        e.raison_sociale,
        e.ifu,
        e.registre_commerce,
        e.adresse_siege,
        e.telephone_contact,
        e.email_entreprise,
        e.logo_path,
        e.date_creation,
        user_count
    FROM entreprises e
    WHERE e.id_entreprise = p_entreprise_id;
    
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::VARCHAR, NULL::TEXT, NULL::VARCHAR, NULL::VARCHAR, NULL::TEXT, NULL::TIMESTAMP, NULL::INT;
END;
$$;
