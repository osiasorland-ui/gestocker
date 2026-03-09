-- Ajouter le champ first_time_login pour gérer la première connexion
ALTER TABLE public.utilisateurs 
ADD COLUMN first_time_login BOOLEAN DEFAULT true;

-- Créer un index pour optimiser les recherches
CREATE INDEX idx_utilisateurs_first_time_login ON public.utilisateurs(first_time_login);

-- Mettre à jour les utilisateurs existants pour qu'ils ne soient pas considérés comme nouvelle connexion
UPDATE public.utilisateurs 
SET first_time_login = false 
WHERE created_at < NOW() - INTERVAL '1 day';
