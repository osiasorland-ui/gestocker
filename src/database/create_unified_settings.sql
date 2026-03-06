-- Script pour créer la table unifiée des paramètres
-- Exécutez ce script dans l'éditeur SQL Supabase

-- 1. Créer la table unifiée des paramètres
CREATE TABLE IF NOT EXISTS public.parametres_unifies (
  id_parametre uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  id_entreprise uuid NOT NULL REFERENCES public.entreprises(id_entreprise),
  categorie varchar(50) NOT NULL, -- 'sauvegarde', 'notification', 'securite', 'systeme'
  nom_parametre varchar(100) NOT NULL,
  valeur_parametre text,
  type_parametre varchar(50) DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
  description text,
  est_actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(id_entreprise, categorie, nom_parametre)
);

-- 2. Ajouter la colonne statut si elle n'existe pas dans utilisateurs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='utilisateurs' AND column_name='statut'
  ) THEN
    ALTER TABLE public.utilisateurs ADD COLUMN statut varchar(50) DEFAULT 'actif';
  END IF;
END $$;

-- 3. Insérer tous les paramètres par défaut
INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'systeme',
  'maintenance_mode',
  'false',
  'boolean',
  'Mode maintenance du site'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'systeme',
  'session_timeout_minutes',
  '60',
  'number',
  'Durée de la session en minutes'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'systeme',
  'max_sessions_per_user',
  '5',
  'number',
  'Nombre maximum de sessions par utilisateur'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'systeme',
  'fuseau_horaire',
  'UTC',
  'text',
  'Fuseau horaire du système'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'systeme',
  'devise',
  'XOF',
  'text',
  'Devise par défaut'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'systeme',
  'langue',
  'fr',
  'text',
  'Langue de l\'interface'
FROM public.entreprises;

-- Paramètres de sauvegarde
INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'sauvegarde',
  'backup_frequency',
  'daily',
  'text',
  'Fréquence des sauvegardes automatiques'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'sauvegarde',
  'backup_retention_days',
  '30',
  'number',
  'Nombre de jours de conservation des sauvegardes'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'sauvegarde',
  'auto_backup_enabled',
  'true',
  'boolean',
  'Activer les sauvegardes automatiques'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'sauvegarde',
  'backup_location',
  '/backups',
  'text',
  'Emplacement des sauvegardes'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'sauvegarde',
  'backup_type',
  'full',
  'text',
  'Type de sauvegarde'
FROM public.entreprises;

-- Paramètres de notification
INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'notification',
  'email_enabled',
  'true',
  'boolean',
  'Activer les notifications par email'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'notification',
  'push_enabled',
  'false',
  'boolean',
  'Activer les notifications push'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'notification',
  'alertes_stock',
  'true',
  'boolean',
  'Alertes de seuil de stock'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'notification',
  'alertes_commandes',
  'true',
  'boolean',
  'Alertes de commandes'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'notification',
  'rapports_hebdo',
  'false',
  'boolean',
  'Rapports hebdomadaires automatiques'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'notification',
  'alertes_systeme',
  'true',
  'boolean',
  'Alertes système'
FROM public.entreprises;

-- Paramètres de sécurité
INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'securite',
  'password_min_length',
  '8',
  'number',
  'Longueur minimale du mot de passe'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'securite',
  'password_complexity',
  'medium',
  'text',
  'Niveau de complexité du mot de passe'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'securite',
  'session_timeout',
  '60',
  'number',
  'Durée de la session en minutes'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'securite',
  'max_attempts',
  '3',
  'number',
  'Nombre maximum de tentatives de connexion'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'securite',
  'lockout_duration',
  '15',
  'number',
  'Durée de blocage en minutes'
FROM public.entreprises;

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description) 
SELECT 
  id_entreprise,
  'securite',
  '2fa_enabled',
  'false',
  'boolean',
  'Authentification à deux facteurs'
FROM public.entreprises;

-- 4. Désactiver RLS et donner les permissions
ALTER TABLE public.parametres_unifies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.utilisateurs DISABLE ROW LEVEL SECURITY;

-- 5. Donner les permissions de lecture
GRANT SELECT ON public.parametres_unifies TO anon;
GRANT SELECT ON public.parametres_unifies TO authenticated;
GRANT SELECT ON public.utilisateurs TO anon;
GRANT SELECT ON public.utilisateurs TO authenticated;

-- 6. Donner les permissions d'écriture aux authentifiés
GRANT INSERT, UPDATE, DELETE ON public.parametres_unifies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.utilisateurs TO authenticated;

-- 7. Vérification finale
SELECT 
  'PARAMÈTRES UNIFIÉS CRÉÉS' as info,
  categorie,
  COUNT(*) as nombre_parametres
FROM public.parametres_unifies 
GROUP BY categorie
ORDER BY categorie;
