-- Script de test pour vérifier l'accès aux paramètres avec RLS
-- Exécutez ce script pour vérifier que tout fonctionne

-- 1. Vérifier que vous êtes bien connecté
SELECT 
  'Utilisateur connecté' as info,
  auth.uid() as user_id,
  auth.email() as user_email;

-- 2. Vérifier votre entreprise
SELECT 
  'Entreprise de l''utilisateur' as info,
  id_entreprise,
  'Entreprise' as nom_entreprise
FROM public.entreprises 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = auth.uid()
  LIMIT 1
);

-- 3. Tester la lecture des paramètres (la requête principale)
SELECT 
  'Paramètres accessibles' as info,
  categorie,
  nom_parametre,
  valeur_parametre,
  type_parametre,
  description,
  est_actif
FROM public.parametres_unifies 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = auth.uid()
  LIMIT 1
)
ORDER BY categorie, nom_parametre;

-- 4. Compter les paramètres par catégorie
SELECT 
  'Résumé par catégorie' as info,
  categorie,
  COUNT(*) as nombre_parametres,
  COUNT(*) FILTER (WHERE est_actif = true) as parametres_actifs
FROM public.parametres_unifies 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = auth.uid()
  LIMIT 1
)
GROUP BY categorie
ORDER BY categorie;

-- 5. Tester une mise à jour (exemple : changer le mode maintenance)
UPDATE public.parametres_unifies 
SET valeur_parametre = 'false', updated_at = now()
WHERE 
  id_entreprise = (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = auth.uid()
    LIMIT 1
  ) 
  AND categorie = 'systeme' 
  AND nom_parametre = 'maintenance_mode'
RETURNING 
  'Test mise à jour' as info,
  categorie,
  nom_parametre,
  valeur_parametre as nouvelle_valeur;
