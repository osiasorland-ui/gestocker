-- Script RLS spécifique à chaque utilisateur
-- Chaque utilisateur ne peut voir et modifier que SES propres paramètres

-- 1. Modifier la structure pour ajouter id_user à parametres_unifies
ALTER TABLE public.parametres_unifies ADD COLUMN IF NOT EXISTS id_user uuid REFERENCES public.utilisateurs(id_user);

-- 2. Mettre à jour les paramètres existants pour les associer aux utilisateurs admin
UPDATE public.parametres_unifies 
SET id_user = (
  SELECT id_user 
  FROM public.utilisateurs 
  WHERE id_entreprise = parametres_unifies.id_entreprise 
  AND id_role = '5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3'::uuid  -- Admin role
  LIMIT 1
)
WHERE id_user IS NULL;

-- 3. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Politique universelle de lecture des paramètres" ON public.parametres_unifies;
DROP POLICY IF EXISTS "Politique universelle de modification des paramètres" ON public.parametres_unifies;
DROP POLICY IF EXISTS "Politique universelle d'insertion des paramètres" ON public.parametres_unifies;
DROP POLICY IF EXISTS "Politique universelle de suppression des paramètres" ON public.parametres_unifies;

-- 4. Créer une contrainte unique pour id_user + categorie + nom_parametre
ALTER TABLE public.parametres_unifies 
ADD CONSTRAINT unique_user_parametre 
UNIQUE (id_user, categorie, nom_parametre);

-- 5. Politique de lecture : un utilisateur ne voit que ses paramètres
CREATE POLICY "Utilisateur peut voir uniquement ses paramètres" ON public.parametres_unifies
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 6. Politique de modification : un utilisateur ne modifie que ses paramètres
CREATE POLICY "Utilisateur peut modifier uniquement ses paramètres" ON public.parametres_unifies
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 7. Politique d'insertion : un utilisateur n'insère que pour lui-même
CREATE POLICY "Utilisateur peut insérer uniquement ses paramètres" ON public.parametres_unifies
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 8. Politique de suppression : un utilisateur ne supprime que ses paramètres
CREATE POLICY "Utilisateur peut supprimer uniquement ses paramètres" ON public.parametres_unifies
FOR DELETE USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 9. Modifier la fonction d'initialisation pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION initialiser_parametres_utilisateur()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer les paramètres personnels pour le nouvel utilisateur
  INSERT INTO public.parametres_unifies (id_entreprise, id_user, categorie, nom_parametre, valeur_parametre, type_parametre, description)
  VALUES 
    (NEW.id_entreprise, NEW.id_user, 'systeme', 'maintenance_mode', 'false', 'boolean', 'Mode maintenance du site'),
    (NEW.id_entreprise, NEW.id_user, 'systeme', 'session_timeout_minutes', '60', 'number', 'Durée de la session en minutes'),
    (NEW.id_entreprise, NEW.id_user, 'systeme', 'max_sessions_per_user', '5', 'number', 'Nombre maximum de sessions par utilisateur'),
    (NEW.id_entreprise, NEW.id_user, 'systeme', 'fuseau_horaire', 'UTC', 'text', 'Fuseau horaire du système'),
    (NEW.id_entreprise, NEW.id_user, 'systeme', 'devise', 'XOF', 'text', 'Devise par défaut'),
    (NEW.id_entreprise, NEW.id_user, 'systeme', 'langue', 'fr', 'text', 'Langue de l''interface'),
    
    -- Paramètres de sauvegarde
    (NEW.id_entreprise, NEW.id_user, 'sauvegarde', 'backup_frequency', 'daily', 'text', 'Fréquence des sauvegardes automatiques'),
    (NEW.id_entreprise, NEW.id_user, 'sauvegarde', 'backup_retention_days', '30', 'number', 'Nombre de jours de conservation des sauvegardes'),
    (NEW.id_entreprise, NEW.id_user, 'sauvegarde', 'auto_backup_enabled', 'true', 'boolean', 'Activer les sauvegardes automatiques'),
    (NEW.id_entreprise, NEW.id_user, 'sauvegarde', 'backup_location', '/backups', 'text', 'Emplacement des sauvegardes'),
    (NEW.id_entreprise, NEW.id_user, 'sauvegarde', 'backup_type', 'full', 'text', 'Type de sauvegarde'),
    
    -- Paramètres de notification
    (NEW.id_entreprise, NEW.id_user, 'notification', 'email_enabled', 'true', 'boolean', 'Activer les notifications par email'),
    (NEW.id_entreprise, NEW.id_user, 'notification', 'push_enabled', 'false', 'boolean', 'Activer les notifications push'),
    (NEW.id_entreprise, NEW.id_user, 'notification', 'alertes_stock', 'true', 'boolean', 'Alertes de seuil de stock'),
    (NEW.id_entreprise, NEW.id_user, 'notification', 'alertes_commandes', 'true', 'boolean', 'Alertes de commandes'),
    (NEW.id_entreprise, NEW.id_user, 'notification', 'rapports_hebdo', 'false', 'boolean', 'Rapports hebdomadaires automatiques'),
    (NEW.id_entreprise, NEW.id_user, 'notification', 'alertes_systeme', 'true', 'boolean', 'Alertes système'),
    
    -- Paramètres de sécurité
    (NEW.id_entreprise, NEW.id_user, 'securite', 'password_min_length', '8', 'number', 'Longueur minimale du mot de passe'),
    (NEW.id_entreprise, NEW.id_user, 'securite', 'password_complexity', 'medium', 'text', 'Niveau de complexité du mot de passe'),
    (NEW.id_entreprise, NEW.id_user, 'securite', 'session_timeout', '60', 'number', 'Durée de la session en minutes'),
    (NEW.id_entreprise, NEW.id_user, 'securite', 'max_attempts', '3', 'number', 'Nombre maximum de tentatives de connexion'),
    (NEW.id_entreprise, NEW.id_user, 'securite', 'lockout_duration', '15', 'number', 'Durée de blocage en minutes'),
    (NEW.id_entreprise, NEW.id_user, 'securite', '2fa_enabled', 'false', 'boolean', 'Authentification à deux facteurs');
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Créer un trigger pour initialiser les paramètres lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS trigger_initialiser_parametres_user ON public.utilisateurs;
CREATE TRIGGER trigger_initialiser_parametres_user
AFTER INSERT ON public.utilisateurs
FOR EACH ROW
EXECUTE FUNCTION initialiser_parametres_utilisateur();

-- 11. Supprimer l'ancien trigger sur entreprises (plus nécessaire)
DROP TRIGGER IF EXISTS trigger_initialiser_parametres ON public.entreprises;

-- 12. Mettre à jour la requête dans l'application React
-- La requête devient simplement:
-- SELECT * FROM public.parametres_unifies WHERE id_user = auth.uid()

-- 13. Test pour vérifier que vous ne voyez que vos paramètres
SELECT 
  'Test - Vos paramètres uniquement' as info,
  id_user,
  categorie,
  nom_parametre,
  valeur_parametre
FROM public.parametres_unifies 
WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
ORDER BY categorie, nom_parametre;

-- 14. Compter les paramètres par utilisateur
SELECT 
  'Paramètres par utilisateur' as info,
  u.email,
  COUNT(p.id_parametre) as nombre_parametres
FROM public.utilisateurs u
LEFT JOIN public.parametres_unifies p ON u.id_user = p.id_user
GROUP BY u.id_user, u.email
ORDER BY nombre_parametres DESC;

-- 15. Afficher les nouvelles politiques
SELECT 
  'Nouvelles politiques RLS utilisateur-spécifiques' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'parametres_unifies'
ORDER BY cmd;
