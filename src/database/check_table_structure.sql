-- Vérifier la structure de la table parametres_unifies
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'parametres_unifies' 
AND table_schema = 'public'
ORDER BY ordinal_position;
