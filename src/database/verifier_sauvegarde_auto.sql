-- Vérifier la configuration actuelle de la sauvegarde automatique
SELECT 
    'Configuration sauvegarde automatique' as info,
    id_entreprise,
    backup_type,
    backup_frequency,
    valeur_parametre,
    type_parametre,
    description
FROM public.parametres_unifies
WHERE categorie = 'sauvegarde'
ORDER BY nom_parametre;
