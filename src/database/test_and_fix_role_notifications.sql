-- Script pour vérifier les utilisateurs et tester les notifications de changement de rôle

-- 1. Vérifier tous les utilisateurs existants
SELECT 
  'Utilisateurs existants' as info,
  id_user,
  email,
  nom,
  prenom,
  id_role,
  statut,
  created_at
FROM public.utilisateurs 
ORDER BY created_at DESC;

-- 2. Trouver votre utilisateur spécifique
SELECT 
  'Recherche de votre utilisateur' as info,
  id_user,
  email,
  nom,
  prenom,
  id_role,
  statut
FROM public.utilisateurs 
WHERE email = 'osiasorland@gmail.com'
LIMIT 1;

-- 3. Vérifier les rôles disponibles
SELECT 
  'Rôles disponibles' as info,
  id_role,
  libelle
FROM public.roles
ORDER BY libelle;

-- 4. Nettoyer les anciennes notifications de test si elles existent
DELETE FROM public.role_change_notifications 
WHERE message LIKE 'Test:%';

-- 5. Créer une notification de test avec le premier utilisateur trouvé
-- Cette requête utilisera le premier utilisateur disponible pour le test
DO $$
DECLARE
  user_uuid UUID;
  admin_role UUID := '5a0fa61f-9db1-4caa-a030-c1f6c5c99ee3'::uuid;
  super_user_role UUID := 'a033e29c-94f6-4eb3-9243-a9424ec20357'::uuid;
BEGIN
  -- Récupérer le premier utilisateur disponible
  SELECT id_user INTO user_uuid 
  FROM public.utilisateurs 
  LIMIT 1;
  
  IF user_uuid IS NOT NULL THEN
    INSERT INTO public.role_change_notifications (
      id_user,
      ancien_role_id,
      nouveau_role_id,
      message,
      est_lu,
      created_at,
      expires_at
    ) VALUES (
      user_uuid,
      admin_role,
      super_user_role,
      'Test: Votre rôle a été modifié par OSIAS ORLAND',
      false,
      now(),
      now() + interval '7 days'
    );
    
    RAISE NOTICE 'Notification de test créée pour l''utilisateur: %', user_uuid;
  ELSE
    RAISE NOTICE 'Aucun utilisateur trouvé pour le test';
  END IF;
END $$;

-- 6. Vérifier la notification créée
SELECT 
  'Notifications de changement de rôle créées' as info,
  rcn.id_notification,
  rcn.id_user,
  u.email as user_email,
  rcn.ancien_role_id,
  old_role.libelle as ancien_role_nom,
  rcn.nouveau_role_id,
  new_role.libelle as nouveau_role_nom,
  rcn.message,
  rcn.est_lu,
  rcn.created_at,
  rcn.expires_at
FROM public.role_change_notifications rcn
LEFT JOIN public.utilisateurs u ON rcn.id_user = u.id_user
LEFT JOIN public.roles old_role ON rcn.ancien_role_id = old_role.id_role
LEFT JOIN public.roles new_role ON rcn.nouveau_role_id = new_role.id_role
ORDER BY rcn.created_at DESC
LIMIT 5;

-- 7. Instructions pour le test manuel
SELECT 
  'Instructions pour test manuel' as info,
  'Remplacez USER_UUID ci-dessous par un vrai ID utilisateur de la première requête' as instruction1,
  'Exemple: 7c82ed08-bff7-4c38-b8da-9fc46ef91797 (si existant)' as instruction2;
