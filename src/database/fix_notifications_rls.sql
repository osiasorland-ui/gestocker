-- Script pour configurer RLS sur la table notifications
-- Assure que les notifications de changement de rôle fonctionnent

-- 1. Activer RLS sur la table notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs notifications" ON public.notifications;
DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer des notifications" ON public.notifications;

-- 3. Créer une politique pour que les utilisateurs puissent voir leurs notifications
CREATE POLICY "Les utilisateurs peuvent voir leurs notifications" ON public.notifications
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 4. Créer une politique pour que les utilisateurs puissent marquer leurs notifications comme lues
CREATE POLICY "Les utilisateurs peuvent modifier leurs notifications" ON public.notifications
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 5. Créer une politique pour l'insertion (pour les admins qui créent des notifications)
CREATE POLICY "Les admins peuvent insérer des notifications" ON public.notifications
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    id_user = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.utilisateurs u
      WHERE u.id_user = auth.uid()
      AND u.id_role IN (
        '5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3', -- Admin
        'a033e29c-94f6-4eb3-9243-a9424ec20357'  -- Super User
      )
    )
  )
);

-- 6. Donner les permissions nécessaires
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;

-- 7. Vérifier que les politiques sont bien créées
SELECT 
  'Politiques RLS pour notifications' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd;

-- 8. Test de création de notification pour votre utilisateur
INSERT INTO public.notifications (
  id_user,
  id_entreprise,
  message,
  est_lu,
  date_envoi
)
SELECT 
  '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid,
  id_entreprise,
  'Test de notification - système de changement de rôle opérationnel',
  false,
  now()
FROM public.utilisateurs 
WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
LIMIT 1;

-- 9. Vérifier que vous pouvez voir la notification
SELECT 
  'Test - Vos notifications' as info,
  id_notif,
  message,
  est_lu,
  date_envoi
FROM public.notifications 
WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
ORDER BY date_envoi DESC
LIMIT 5;
