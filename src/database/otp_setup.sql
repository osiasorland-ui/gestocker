-- Table pour stocker les codes OTP
CREATE TABLE IF NOT EXISTS otp_codes (
    id_otp UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    blocked_until TIMESTAMP WITH TIME ZONE
);

-- Créer les index après la création de la table
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes (email);
CREATE INDEX IF NOT EXISTS idx_otp_code ON otp_codes (code);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes (expires_at);

-- Fonction pour générer un code OTP de 8 chiffres
CREATE OR REPLACE FUNCTION generate_otp_code()
RETURNS VARCHAR(8)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    otp_code VARCHAR(8);
BEGIN
    -- Générer un code aléatoire de 8 chiffres
    otp_code := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    RETURN otp_code;
END;
$$;

-- Fonction pour créer et envoyer un code OTP
CREATE OR REPLACE FUNCTION create_otp_code(p_email VARCHAR(255))
RETURNS TABLE(
    success BOOLEAN,
    otp_code VARCHAR(8),
    expires_at TIMESTAMP WITH TIME ZONE,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_otp_code VARCHAR(8);
    new_expires_at TIMESTAMP WITH TIME ZONE;
    is_blocked BOOLEAN;
BEGIN
    -- Vérifier si l'email est bloqué (trop de tentatives)
    SELECT EXISTS(
        SELECT 1 FROM otp_codes 
        WHERE email = p_email 
        AND blocked_until > NOW()
    ) INTO is_blocked;
    
    IF is_blocked THEN
        RETURN QUERY SELECT FALSE, NULL, NULL, 'Trop de tentatives. Veuillez attendre 2 minutes.';
        RETURN;
    END IF;
    
    -- Nettoyer les anciens codes OTP pour cet email
    DELETE FROM otp_codes 
    WHERE email = p_email 
    AND (expires_at < NOW() OR is_used = TRUE);
    
    -- Générer nouveau code OTP
    new_otp_code := generate_otp_code();
    new_expires_at := NOW() + INTERVAL '5 minutes';
    
    -- Insérer le nouveau code OTP
    INSERT INTO otp_codes (email, code, expires_at)
    VALUES (p_email, new_otp_code, new_expires_at);
    
    RETURN QUERY SELECT TRUE, new_otp_code, new_expires_at, 'Code OTP généré avec succès.';
END;
$$;

-- Fonction pour valider un code OTP
CREATE OR REPLACE FUNCTION validate_otp_code(p_email VARCHAR(255), p_code VARCHAR(8))
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    attempts_remaining INTEGER,
    blocked_until TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    otp_record RECORD;
    max_attempts INTEGER := 3;
    block_duration INTERVAL := INTERVAL '2 minutes';
BEGIN
    -- Récupérer le code OTP le plus récent pour cet email
    SELECT * INTO otp_record
    FROM otp_codes 
    WHERE email = p_email 
    AND is_used = FALSE 
    AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Vérifier si l'email est bloqué
    IF EXISTS(
        SELECT 1 FROM otp_codes 
        WHERE email = p_email 
        AND blocked_until > NOW()
    ) THEN
        RETURN QUERY SELECT FALSE, 'Compte temporairement bloqué. Veuillez attendre.', 0, 
            (SELECT blocked_until FROM otp_codes WHERE email = p_email AND blocked_until > NOW() LIMIT 1);
        RETURN;
    END IF;
    
    -- Si aucun code valide trouvé
    IF otp_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Aucun code valide trouvé. Veuillez demander un nouveau code.', 0, NULL;
        RETURN;
    END IF;
    
    -- Vérifier si le code a expiré
    IF otp_record.expires_at <= NOW() THEN
        RETURN QUERY SELECT FALSE, 'Code expiré. Veuillez demander un nouveau code.', 0, NULL;
        RETURN;
    END IF;
    
    -- Incrémenter le nombre de tentatives
    UPDATE otp_codes 
    SET attempts = attempts + 1,
        last_attempt_at = NOW()
    WHERE id_otp = otp_record.id_otp;
    
    -- Vérifier le code
    IF otp_record.code = p_code THEN
        -- Code correct - marquer comme utilisé
        UPDATE otp_codes 
        SET is_used = TRUE 
        WHERE id_otp = otp_record.id_otp;
        
        RETURN QUERY SELECT TRUE, 'Code validé avec succès.', 0, NULL;
        RETURN;
    ELSE
        -- Code incorrect
        IF otp_record.attempts + 1 >= max_attempts THEN
            -- Bloquer l'email
            UPDATE otp_codes 
            SET blocked_until = NOW() + block_duration
            WHERE id_otp = otp_record.id_otp;
            
            RETURN QUERY SELECT FALSE, 'Code incorrect. Compte bloqué pour 2 minutes.', 0, NOW() + block_duration;
            RETURN;
        ELSE
            DECLARE
                attempts_left INTEGER;
            BEGIN
                attempts_left := max_attempts - (otp_record.attempts + 1);
                RETURN QUERY SELECT FALSE, 'Code incorrect.', attempts_left, NULL;
                RETURN;
            END;
        END IF;
    END IF;
END;
$$;

-- Fonction pour vérifier si un email peut recevoir un nouveau code OTP
CREATE OR REPLACE FUNCTION can_request_otp(p_email VARCHAR(255))
RETURNS TABLE(
    can_request BOOLEAN,
    wait_time INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_otp RECORD;
    is_blocked BOOLEAN;
BEGIN
    -- Vérifier si bloqué
    SELECT EXISTS(
        SELECT 1 FROM otp_codes 
        WHERE email = p_email 
        AND blocked_until > NOW()
    ) INTO is_blocked;
    
    IF is_blocked THEN
        RETURN QUERY SELECT FALSE, 
            EXTRACT(EPOCH FROM (blocked_until - NOW()))::INTEGER,
            'Compte bloqué. Veuillez attendre.',
            (SELECT blocked_until FROM otp_codes WHERE email = p_email AND blocked_until > NOW() LIMIT 1);
        RETURN;
    END IF;
    
    -- Récupérer le dernier code OTP
    SELECT * INTO last_otp
    FROM otp_codes 
    WHERE email = p_email 
    AND is_used = FALSE 
    AND expires_at > NOW()
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Si un code valide existe, vérifier s'il peut être renvoyé
    IF last_otp IS NOT NULL THEN
        -- Si moins de 30 secondes depuis la création, attendre
        IF EXTRACT(EPOCH FROM (NOW() - last_otp.created_at)) < 30 THEN
            RETURN QUERY SELECT FALSE, 
                30 - EXTRACT(EPOCH FROM (NOW() - last_otp.created_at))::INTEGER,
                'Veuillez attendre avant de demander un nouveau code.',
                NULL;
            RETURN;
        END IF;
    END IF;
    
    RETURN QUERY SELECT TRUE, 0, 'Nouveau code OTP disponible.', NULL;
END;
$$;

-- Nettoyage automatique des codes OTP expirés (tous les jours)
CREATE OR REPLACE FUNCTION cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM otp_codes 
    WHERE (expires_at < NOW() OR is_used = TRUE)
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Créer un trigger pour le nettoyage (optionnel, peut être appelé par un job cron)
-- DROP TRIGGER IF EXISTS trigger_cleanup_otp ON otp_codes;
-- CREATE TRIGGER trigger_cleanup_otp
--     AFTER INSERT ON otp_codes
--     FOR EACH ROW
--     EXECUTE FUNCTION cleanup_expired_otp();

-- Politiques RLS (Row Level Security)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre les opérations sur les OTP
CREATE POLICY "OTP operations policy" ON otp_codes
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Accorder les permissions nécessaires
GRANT ALL ON otp_codes TO authenticated;
GRANT ALL ON otp_codes TO service_role;
