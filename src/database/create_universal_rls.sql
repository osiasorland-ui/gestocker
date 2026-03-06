-- Script RLS universel pour toutes les entreprises (existantes et futures)
-- Ce script crée des politiques dynamiques qui s'adaptent à toutes les entreprises

-- 1. Activer RLS sur toutes les tables concernées
ALTER TABLE public.parametres_unifies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les paramètres de leur entreprise" ON public.parametres_unifies;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les paramètres de leur entreprise" ON public.parametres_unifies;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent insérer des paramètres pour leur entreprise" ON public.parametres_unifies;

-- 3. Créer une politique universelle de lecture pour les paramètres
CREATE POLICY "Politique universelle de lecture des paramètres" ON public.parametres_unifies
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.utilisateurs 
    WHERE id_user = auth.uid() 
    AND id_entreprise = parametres_unifies.id_entreprise
    AND statut = 'actif'
  )
);

-- 4. Créer une politique universelle de modification pour les paramètres
CREATE POLICY "Politique universelle de modification des paramètres" ON public.parametres_unifies
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.utilisateurs 
    WHERE id_user = auth.uid() 
    AND id_entreprise = parametres_unifies.id_entreprise
    AND statut = 'actif'
  )
);

-- 5. Créer une politique universelle d'insertion pour les paramètres
CREATE POLICY "Politique universelle d'insertion des paramètres" ON public.parametres_unifies
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.utilisateurs 
    WHERE id_user = auth.uid() 
    AND id_entreprise = parametres_unifies.id_entreprise
    AND statut = 'actif'
  )
);

-- 6. Créer une politique universelle de suppression pour les paramètres
CREATE POLICY "Politique universelle de suppression des paramètres" ON public.parametres_unifies
FOR DELETE USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (
    SELECT 1 FROM public.utilisateurs 
    WHERE id_user = auth.uid() 
    AND id_entreprise = parametres_unifies.id_entreprise
    AND statut = 'actif'
  )
);

-- 7. Politiques pour la table utilisateurs (pour que les utilisateurs puissent voir leur entreprise)
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur profil" ON public.utilisateurs;
CREATE POLICY "Les utilisateurs peuvent voir leur profil" ON public.utilisateurs
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 8. Politique pour que les utilisateurs puissent modifier leur propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur profil" ON public.utilisateurs
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 9. Donner les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parametres_unifies TO authenticated;
GRANT SELECT, UPDATE ON public.utilisateurs TO authenticated;

-- 10. Créer une fonction pour initialiser automatiquement les paramètres pour les nouvelles entreprises
CREATE OR REPLACE FUNCTION initialiser_parametres_entreprise()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer les paramètres système
  INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description)
  VALUES 
    (NEW.id_entreprise, 'systeme', 'maintenance_mode', 'false', 'boolean', 'Mode maintenance du site'),
    (NEW.id_entreprise, 'systeme', 'session_timeout_minutes', '60', 'number', 'Durée de la session en minutes'),
    (NEW.id_entreprise, 'systeme', 'max_sessions_per_user', '5', 'number', 'Nombre maximum de sessions par utilisateur'),
    (NEW.id_entreprise, 'systeme', 'fuseau_horaire', 'UTC', 'text', 'Fuseau horaire du système'),
    (NEW.id_entreprise, 'systeme', 'devise', 'XOF', 'text', 'Devise par défaut'),
    (NEW.id_entreprise, 'systeme', 'langue', 'fr', 'text', 'Langue de l''interface'),
    
    -- Paramètres de sauvegarde
    (NEW.id_entreprise, 'sauvegarde', 'backup_frequency', 'daily', 'text', 'Fréquence des sauvegardes automatiques'),
    (NEW.id_entreprise, 'sauvegarde', 'backup_retention_days', '30', 'number', 'Nombre de jours de conservation des sauvegardes'),
    (NEW.id_entreprise, 'sauvegarde', 'auto_backup_enabled', 'true', 'boolean', 'Activer les sauvegardes automatiques'),
    (NEW.id_entreprise, 'sauvegarde', 'backup_location', '/backups', 'text', 'Emplacement des sauvegardes'),
    (NEW.id_entreprise, 'sauvegarde', 'backup_type', 'full', 'text', 'Type de sauvegarde'),
    
    -- Paramètres de notification
    (NEW.id_entreprise, 'notification', 'email_enabled', 'true', 'boolean', 'Activer les notifications par email'),
    (NEW.id_entreprise, 'notification', 'push_enabled', 'false', 'boolean', 'Activer les notifications push'),
    (NEW.id_entreprise, 'notification', 'alertes_stock', 'true', 'boolean', 'Alertes de seuil de stock'),
    (NEW.id_entreprise, 'notification', 'alertes_commandes', 'true', 'boolean', 'Alertes de commandes'),
    (NEW.id_entreprise, 'notification', 'rapports_hebdo', 'false', 'boolean', 'Rapports hebdomadaires automatiques'),
    (NEW.id_entreprise, 'notification', 'alertes_systeme', 'true', 'boolean', 'Alertes système'),
    
    -- Paramètres de sécurité
    (NEW.id_entreprise, 'securite', 'password_min_length', '8', 'number', 'Longueur minimale du mot de passe'),
    (NEW.id_entreprise, 'securite', 'password_complexity', 'medium', 'text', 'Niveau de complexité du mot de passe'),
    (NEW.id_entreprise, 'securite', 'session_timeout', '60', 'number', 'Durée de la session en minutes'),
    (NEW.id_entreprise, 'securite', 'max_attempts', '3', 'number', 'Nombre maximum de tentatives de connexion'),
    (NEW.id_entreprise, 'securite', 'lockout_duration', '15', 'number', 'Durée de blocage en minutes'),
    (NEW.id_entreprise, 'securite', '2fa_enabled', 'false', 'boolean', 'Authentification à deux facteurs');
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Créer un trigger pour initialiser automatiquement les paramètres lors de la création d'une entreprise
DROP TRIGGER IF EXISTS trigger_initialiser_parametres ON public.entreprises;
CREATE TRIGGER trigger_initialiser_parametres
AFTER INSERT ON public.entreprises
FOR EACH ROW
EXECUTE FUNCTION initialiser_parametres_entreprise();

-- 12. Vérifier que tout est bien configuré
SELECT 
  'Configuration RLS universelle terminée' as info,
  'Toutes les entreprises futures auront automatiquement leurs paramètres' as description;

-- 13. Afficher les politiques créées
SELECT 
  'Politiques RLS créées' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('parametres_unifies', 'utilisateurs')
ORDER BY tablename, cmd;
