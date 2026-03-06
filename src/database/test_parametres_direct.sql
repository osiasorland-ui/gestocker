-- Script de test direct pour vérifier les paramètres (sans RLS)
-- Utilisez ce script pour vérifier que les données existent bien

-- 1. Vérifier que la table parametres_unifies existe et contient des données
SELECT 
  'Vérification table parametres_unifies' as info,
  COUNT(*) as total_parametres
FROM public.parametres_unifies;

-- 2. Voir toutes les entreprises qui ont des paramètres
SELECT 
  'Entreprises avec paramètres' as info,
  id_entreprise,
  COUNT(*) as nombre_parametres
FROM public.parametres_unifies 
GROUP BY id_entreprise;

-- 3. Voir les paramètres par catégorie pour la première entreprise
SELECT 
  'Paramètres par catégorie' as info,
  categorie,
  COUNT(*) as nombre_parametres
FROM public.parametres_unifies 
WHERE id_entreprise = (SELECT id_entreprise FROM public.parametres_unifies LIMIT 1)
GROUP BY categorie
ORDER BY categorie;

-- 4. Afficher tous les paramètres de la première entreprise
SELECT 
  'Tous les paramètres' as info,
  categorie,
  nom_parametre,
  valeur_parametre,
  type_parametre,
  description,
  est_actif
FROM public.parametres_unifies 
WHERE id_entreprise = (SELECT id_entreprise FROM public.parametres_unifies LIMIT 1)
ORDER BY categorie, nom_parametre;

-- 5. Trouver votre ID utilisateur pour les tests RLS
SELECT 
  'Utilisateurs existants' as info,
  id_user,
  email,
  id_entreprise,
  statut
FROM public.utilisateurs 
ORDER BY created_at DESC
LIMIT 5;

-- 6. Test avec un ID utilisateur spécifique (remplacez VOTRE_USER_ID)
-- Décommentez et remplacez VOTRE_USER_ID par un vrai ID utilisateur de la requête ci-dessus
/*
SELECT 
  'Test RLS avec utilisateur spécifique' as info,
  categorie,
  nom_parametre,
  valeur_parametre
FROM public.parametres_unifies 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = 'VOTRE_USER_ID'::uuid
  LIMIT 1
)
ORDER BY categorie, nom_parametre;
*/
