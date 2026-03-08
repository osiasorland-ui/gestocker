-- Mettre à jour la table pour ne garder que les 6 paramètres de sécurité essentiels
-- Supprimer les anciens paramètres de sécurité non essentiels

DELETE FROM public.parametres_unifies 
WHERE categorie = 'securite' 
AND nom_parametre IN (
    'password_complexity',
    'session_timeout', 
    '2fa_enabled',
    'ip_whitelist_enabled',
    'audit_log_enabled',
    'password_expiry_days'
);

-- Vérifier les paramètres de sécurité restants
SELECT 
    categorie,
    nom_parametre,
    valeur_parametre,
    description
FROM public.parametres_unifies 
WHERE categorie = 'securite'
ORDER BY nom_parametre;

-- Afficher le total des paramètres par catégorie
SELECT 
    categorie,
    COUNT(*) as nombre_parametres
FROM public.parametres_unifies 
GROUP BY categorie
ORDER BY categorie;
