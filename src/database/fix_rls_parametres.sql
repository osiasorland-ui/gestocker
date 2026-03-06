-- Script pour configurer RLS sur la table parametres_unifies
-- Exécutez ce script après avoir activé RLS dans Supabase

-- 1. Activer RLS sur la table (si vous l'avez désactivé)
ALTER TABLE public.parametres_unifies ENABLE ROW LEVEL SECURITY;

-- 2. Créer une politique pour permettre aux utilisateurs authentifiés de lire leurs paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les paramètres de leur entreprise" ON public.parametres_unifies
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  id_entreprise IN (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = auth.uid()
  )
);

-- 3. Créer une politique pour permettre aux utilisateurs authentifiés de modifier leurs paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les paramètres de leur entreprise" ON public.parametres_unifies
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  id_entreprise IN (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = auth.uid()
  )
);

-- 4. Créer une politique pour permettre aux utilisateurs authentifiés d'insérer des paramètres
CREATE POLICY "Les utilisateurs authentifiés peuvent insérer des paramètres pour leur entreprise" ON public.parametres_unifies
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  id_entreprise IN (
    SELECT id_entreprise FROM public.utilisateurs 
    WHERE id_user = auth.uid()
  )
);

-- 5. Donner les permissions de base
GRANT SELECT ON public.parametres_unifies TO authenticated;
GRANT INSERT ON public.parametres_unifies TO authenticated;
GRANT UPDATE ON public.parametres_unifies TO authenticated;
GRANT DELETE ON public.parametres_unifies TO authenticated;

-- 6. Test pour vérifier que vous pouvez lire les paramètres
-- Exécutez cette requête pour tester :
SELECT 
  categorie,
  nom_parametre,
  valeur_parametre,
  type_parametre,
  description
FROM public.parametres_unifies 
WHERE id_entreprise = (
  SELECT id_entreprise FROM public.utilisateurs 
  WHERE id_user = auth.uid()
  LIMIT 1
)
ORDER BY categorie, nom_parametre;

-- 7. Afficher les politiques créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'parametres_unifies';
