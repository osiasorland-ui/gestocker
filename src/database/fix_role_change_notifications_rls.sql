-- Script pour configurer RLS sur la table role_change_notifications
-- Assure que les notifications de changement de rôle fonctionnent correctement

-- 1. Activer RLS sur la table role_change_notifications
ALTER TABLE public.role_change_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs notifications de changement de rôle" ON public.role_change_notifications;
DROP POLICY IF EXISTS "Les admins peuvent créer des notifications de changement de rôle" ON public.role_change_notifications;

-- 3. Créer une politique pour que les utilisateurs puissent voir leurs notifications de changement de rôle
CREATE POLICY "Les utilisateurs peuvent voir leurs notifications de changement de rôle" ON public.role_change_notifications
FOR SELECT USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 4. Créer une politique pour que les utilisateurs puissent marquer leurs notifications comme lues
CREATE POLICY "Les utilisateurs peuvent modifier leurs notifications de changement de rôle" ON public.role_change_notifications
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  id_user = auth.uid()
);

-- 5. Créer une politique pour l'insertion (pour les admins qui créent des notifications)
CREATE POLICY "Les admins peuvent créer des notifications de changement de rôle" ON public.role_change_notifications
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
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
GRANT SELECT, UPDATE ON public.role_change_notifications TO authenticated;
GRANT INSERT ON public.role_change_notifications TO authenticated;

-- 7. Vérifier que les politiques sont bien créées
SELECT 
  'Politiques RLS pour role_change_notifications' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'role_change_notifications'
ORDER BY cmd;

-- 8. Test de création de notification de changement de rôle pour votre utilisateur
INSERT INTO public.role_change_notifications (
  id_user,
  ancien_role_id,
  nouveau_role_id,
  message,
  est_lu,
  created_at,
  expires_at
)
VALUES 
(
  '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid,
  '5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3'::uuid, -- Ancien rôle Admin
  'a033e29c-94f6-4eb3-9243-a9424ec20357'::uuid, -- Nouveau rôle Super User
  'Test: Votre rôle a été modifié par OSIAS ORLAND',
  false,
  now(),
  now() + interval '7 days'
);

-- 9. Vérifier que vous pouvez voir la notification de changement de rôle
SELECT 
  'Test - Vos notifications de changement de rôle' as info,
  id_notification,
  ancien_role_id,
  nouveau_role_id,
  message,
  est_lu,
  created_at,
  expires_at
FROM public.role_change_notifications 
WHERE id_user = '7c82ed08-bff7-4c38-b8da-9fc46ef91797'::uuid
ORDER BY created_at DESC
LIMIT 5;

-- 10. Afficher les rôles pour référence
SELECT 
  'Rôles disponibles' as info,
  id_role,
  libelle
FROM public.roles
ORDER BY libelle;
