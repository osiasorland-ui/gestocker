-- Script pour créer la table des sauvegardes automatiques
-- Cette table stocke les sauvegardes automatiques déclenchées par les changements de paramètres

CREATE TABLE IF NOT EXISTS public.sauvegardes (
  id_sauvegarde uuid NOT NULL DEFAULT gen_random_uuid(),
  id_entreprise uuid NOT NULL,
  type_sauvegarde character varying NOT NULL DEFAULT 'auto',
  donnees_sauvegarde jsonb NOT NULL,
  statut character varying NOT NULL DEFAULT 'complete',
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT sauvegardes_pkey PRIMARY KEY (id_sauvegarde),
  CONSTRAINT sauvegardes_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise),
  CONSTRAINT sauvegardes_type_sauvegarde_check CHECK (type_sauvegarde IN ('auto', 'manuel', 'sequentielle')),
  CONSTRAINT sauvegardes_statut_check CHECK (statut IN ('complete', 'en_cours', 'erreur'))
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sauvegardes_entreprise_created ON public.sauvegardes(id_entreprise, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sauvegardes_type ON public.sauvegardes(type_sauvegarde);

-- Insérer les paramètres de sauvegarde par défaut s'ils n'existent pas
INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description, est_actif)
SELECT 
  e.id_entreprise,
  'sauvegarde',
  'backup_type',
  'auto',
  'text',
  'Type de sauvegarde (Auto, Séquentielle)',
  true
FROM public.entreprises e
WHERE NOT EXISTS (
  SELECT 1 FROM public.parametres_unifies p 
  WHERE p.id_entreprise = e.id_entreprise 
  AND p.categorie = 'sauvegarde' 
  AND p.nom_parametre = 'backup_type'
);

INSERT INTO public.parametres_unifies (id_entreprise, categorie, nom_parametre, valeur_parametre, type_parametre, description, est_actif)
SELECT 
  e.id_entreprise,
  'sauvegarde',
  'backup_frequency',
  'daily',
  'text',
  'Fréquence sauvegarde (jour, hebdo, mensuelle, annuelle)',
  true
FROM public.entreprises e
WHERE NOT EXISTS (
  SELECT 1 FROM public.parametres_unifies p 
  WHERE p.id_entreprise = e.id_entreprise 
  AND p.categorie = 'sauvegarde' 
  AND p.nom_parametre = 'backup_frequency'
);

-- Vérification de la création
SELECT 'Table sauvegardes créée avec succès' as status;
SELECT COUNT(*) as nombre_parametres_sauvegarde FROM public.parametres_unifies WHERE categorie = 'sauvegarde';
