-- Script de test RLS avec votre utilisateur spécifique
-- Utilise votre ID utilisateur pour tester les permissions RLS

-- 1. Test de lecture des paramètres avec votre utilisateur
-- Simule la requête que fait votre application React
SELECT 
  'Paramètres accessibles par votre utilisateur' as info,
  categorie,
  nom_parametre,
  valeur_parametre,
  type_parametre,
  description,
  est_actif
FROM public.parametres_unifies 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
  LIMIT 1
)
ORDER BY categorie, nom_parametre;

-- 2. Compter les paramètres par catégorie pour votre utilisateur
SELECT 
  'Résumé par catégorie pour votre utilisateur' as info,
  categorie,
  COUNT(*) as nombre_parametres,
  COUNT(*) FILTER (WHERE est_actif = true) as parametres_actifs
FROM public.parametres_unifies 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
  LIMIT 1
)
GROUP BY categorie
ORDER BY categorie;

-- 3. Test de mise à jour (changer le mode maintenance)
UPDATE public.parametres_unifies 
SET valeur_parametre = 'false', updated_at = now()
WHERE 
  id_entreprise = (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
    LIMIT 1
  ) 
  AND categorie = 'systeme' 
  AND nom_parametre = 'maintenance_mode'
RETURNING 
  'Test mise à jour maintenance_mode' as info,
  categorie,
  nom_parametre,
  valeur_parametre as nouvelle_valeur;

-- 4. Vérifier que la mise à jour a bien été effectuée
SELECT 
  'Vérification après mise à jour' as info,
  categorie,
  nom_parametre,
  valeur_parametre
FROM public.parametres_unifies 
WHERE 
  id_entreprise = (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
    LIMIT 1
  ) 
  AND categorie = 'systeme' 
  AND nom_parametre = 'maintenance_mode';

-- 5. Test d'insertion (ajouter un nouveau paramètre)
INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description)
SELECT 
  id_entreprise,
  'systeme',
  'test_parametre',
  'valeur_test',
  'text',
  'Paramètre de test pour vérifier l''insertion'
FROM public.utilisateurs 
WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
RETURNING 
  'Test insertion nouveau paramètre' as info,
  categorie,
  nom_parametre,
  valeur_parametre;

-- 6. Nettoyer le paramètre de test
DELETE FROM public.parametres_unifies 
WHERE 
  id_entreprise = (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
    LIMIT 1
  ) 
  AND categorie = 'systeme' 
  AND nom_parametre = 'test_parametre'
RETURNING 
  'Nettoyage paramètre de test' as info,
  'Paramètre supprimé avec succès' as resultat;
