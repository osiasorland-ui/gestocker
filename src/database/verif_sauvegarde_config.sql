-- Vérifier la configuration de sauvegarde dans la base de données
SELECT 
    backup_type,
    backup_frequency,
    valeur_parametre,
    id_entreprise
FROM public.parametres_unifies 
WHERE categorie = 'sauvegarde' 
-- AND id_entreprise = 'toutes' OR id_entreprise = 'entreprise_specifique'
