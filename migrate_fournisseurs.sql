-- Migration pour modifier la table fournisseurs
-- Exécuter ces commandes dans l'ordre pour mettre à jour la structure existante

-- 1. Ajouter les nouveaux champs (permettant NULL temporairement)
ALTER TABLE public.fournisseurs 
ADD COLUMN telephone_fournisseur character varying;

ALTER TABLE public.fournisseurs 
ADD COLUMN email_fournisseur character varying;

-- 2. Mettre à jour les enregistrements existants avec des valeurs réelles ou NULL
-- (À adapter selon vos données existantes)
UPDATE public.fournisseurs 
SET telephone_fournisseur = contact_telephone 
WHERE telephone_fournisseur IS NULL AND contact_telephone IS NOT NULL;

UPDATE public.fournisseurs 
SET email_fournisseur = contact_email 
WHERE email_fournisseur IS NULL AND contact_email IS NOT NULL;

-- 3. Ajouter les contraintes pour les nouveaux champs
ALTER TABLE public.fournisseurs 
ADD CONSTRAINT telephone_fournisseur_not_null CHECK (telephone_fournisseur IS NOT NULL AND telephone_fournisseur::text <> ''::text);

ALTER TABLE public.fournisseurs 
ADD CONSTRAINT email_fournisseur_not_null CHECK (email_fournisseur IS NOT NULL AND email_fournisseur::text <> ''::text AND email_fournisseur::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text);

-- 4. Renforcer les contraintes pour les champs existants
ALTER TABLE public.fournisseurs 
ADD CONSTRAINT contact_nom_not_null CHECK (contact_nom IS NOT NULL AND contact_nom::text <> ''::text);

ALTER TABLE public.fournisseurs 
ADD CONSTRAINT contact_email_not_null CHECK (contact_email IS NOT NULL AND contact_email::text <> ''::text AND contact_email::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text);

-- 4. Supprimer les champs ville et pays
ALTER TABLE public.fournisseurs DROP COLUMN IF EXISTS ville;

ALTER TABLE public.fournisseurs DROP COLUMN IF EXISTS pays;

-- 5. Ajouter les contraintes d'unicité pour éviter la redondance
ALTER TABLE public.fournisseurs 
ADD CONSTRAINT fournisseurs_nom_fournisseur_unique UNIQUE (nom_fournisseur, id_entreprise);

ALTER TABLE public.fournisseurs 
ADD CONSTRAINT fournisseurs_telephone_fournisseur_unique UNIQUE (telephone_fournisseur, id_entreprise);

ALTER TABLE public.fournisseurs 
ADD CONSTRAINT fournisseurs_email_fournisseur_unique UNIQUE (email_fournisseur, id_entreprise);

ALTER TABLE public.fournisseurs 
ADD CONSTRAINT fournisseurs_contact_telephone_unique UNIQUE (contact_telephone, id_entreprise);

ALTER TABLE public.fournisseurs 
ADD CONSTRAINT fournisseurs_contact_email_unique UNIQUE (contact_email, id_entreprise);

-- 6. Nettoyage des données temporaires (optionnel - à exécuter après avoir mis à jour les données réelles)
-- UPDATE public.fournisseurs 
-- SET telephone_fournisseur = contact_telephone, 
--     email_fournisseur = contact_email 
-- WHERE telephone_fournisseur = 'temp_telephone' 
--    OR email_fournisseur = 'temp@email.com';

-- 7. Vérification de la structure
\d public.fournisseurs;
