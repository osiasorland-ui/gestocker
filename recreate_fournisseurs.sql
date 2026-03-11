-- Suppression et recréation de la table fournisseurs
-- Exécuter ce script pour recréer la table avec la nouvelle structure

-- 1. Supprimer la table existante
DROP TABLE IF EXISTS public.fournisseurs CASCADE;

-- 2. Recréer la table avec la nouvelle structure
CREATE TABLE public.fournisseurs (
  id_fournisseur uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_fournisseur character varying NOT NULL CHECK (nom_fournisseur IS NOT NULL AND nom_fournisseur::text <> ''::text),
  telephone_fournisseur character varying NOT NULL CHECK (telephone_fournisseur IS NOT NULL AND telephone_fournisseur::text <> ''::text),
  email_fournisseur character varying NOT NULL CHECK (email_fournisseur IS NOT NULL AND email_fournisseur::text <> ''::text AND email_fournisseur::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  contact_nom character varying NOT NULL CHECK (contact_nom IS NOT NULL AND contact_nom::text <> ''::text),
  contact_telephone character varying NOT NULL CHECK (contact_telephone IS NOT NULL AND contact_telephone::text <> ''::text),
  contact_email character varying NOT NULL CHECK (contact_email IS NOT NULL AND contact_email::text <> ''::text AND contact_email::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  adresse text NOT NULL,
  conditions_paiement text NOT NULL DEFAULT ''::text,
  delai_livraison text NOT NULL DEFAULT ''::text,
  rating numeric CHECK (rating >= 1.0 AND rating <= 5.0),
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fournisseurs_pkey PRIMARY KEY (id_fournisseur),
  CONSTRAINT fournisseurs_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise),
  CONSTRAINT fournisseurs_nom_fournisseur_unique UNIQUE (nom_fournisseur, id_entreprise),
  CONSTRAINT fournisseurs_telephone_fournisseur_unique UNIQUE (telephone_fournisseur, id_entreprise),
  CONSTRAINT fournisseurs_email_fournisseur_unique UNIQUE (email_fournisseur, id_entreprise),
  CONSTRAINT fournisseurs_contact_telephone_unique UNIQUE (contact_telephone, id_entreprise),
  CONSTRAINT fournisseurs_contact_email_unique UNIQUE (contact_email, id_entreprise)
);

-- 3. Recréer les index si nécessaire
CREATE INDEX IF NOT EXISTS idx_fournisseurs_entreprise ON public.fournisseurs(id_entreprise);
CREATE INDEX IF NOT EXISTS idx_fournisseurs_nom ON public.fournisseurs(nom_fournisseur);

-- 4. Vérification de la structure
\d public.fournisseurs;
