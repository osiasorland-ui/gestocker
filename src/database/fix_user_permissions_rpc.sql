-- Correction de la fonction get_user_permissions pour accepter les UUID
-- Cette fonction remplace celle qui n'acceptait que les INT

DROP FUNCTION IF EXISTS get_user_permissions(user_id_param INT);
DROP FUNCTION IF EXISTS has_permission(user_id_param INT, permission_name VARCHAR);

-- Fonction pour vérifier les permissions d'un utilisateur (accepte UUID et INT)
CREATE OR REPLACE FUNCTION has_permission(
    user_id_param UUID,
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
            SELECT id_role FROM utilisateurs WHERE id_user::TEXT = user_id_param::TEXT
        )
        AND p.nom_action = permission_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$;

-- Fonction alternative pour les IDs numériques (compatibilité)
CREATE OR REPLACE FUNCTION has_permission_int(
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

-- Fonction pour obtenir les permissions d'un utilisateur (accepte UUID et INT)
CREATE OR REPLACE FUNCTION get_user_permissions(
    user_id_param UUID
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
        SELECT id_role FROM utilisateurs WHERE id_user::TEXT = user_id_param::TEXT
    );
END;
$$;

-- Fonction alternative pour les IDs numériques (compatibilité)
CREATE OR REPLACE FUNCTION get_user_permissions_int(
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
