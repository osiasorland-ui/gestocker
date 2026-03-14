-- Tables pour les mouvements de stock par type

-- Table pour les entrées de stock
CREATE TABLE public.entrees_stock (
  id_entree uuid NOT NULL DEFAULT gen_random_uuid(),
  reference character varying,
  date_entree timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  quantite integer NOT NULL CHECK (quantite > 0),
  prix_unitaire numeric,
  prix_total numeric GENERATED ALWAYS AS (quantite * COALESCE(prix_unitaire, 0)) STORED,
  motif text NOT NULL,
  id_produit uuid NOT NULL,
  id_entrepot uuid NOT NULL,
  id_fournisseur uuid,
  id_user uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT entrees_stock_pkey PRIMARY KEY (id_entree),
  CONSTRAINT entrees_stock_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT entrees_stock_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT entrees_stock_id_fournisseur_fkey FOREIGN KEY (id_fournisseur) REFERENCES public.fournisseurs(id_fournisseur),
  CONSTRAINT entrees_stock_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT entrees_stock_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);

-- Table pour les sorties de stock
CREATE TABLE public.sorties_stock (
  id_sortie uuid NOT NULL DEFAULT gen_random_uuid(),
  reference character varying,
  date_sortie timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  quantite integer NOT NULL CHECK (quantite > 0),
  prix_unitaire numeric,
  prix_total numeric GENERATED ALWAYS AS (quantite * COALESCE(prix_unitaire, 0)) STORED,
  motif text NOT NULL,
  id_produit uuid NOT NULL,
  id_entrepot uuid NOT NULL,
  id_client uuid,
  id_user uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sorties_stock_pkey PRIMARY KEY (id_sortie),
  CONSTRAINT sorties_stock_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT sorties_stock_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT sorties_stock_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.clients(id_client),
  CONSTRAINT sorties_stock_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT sorties_stock_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);

-- Table pour les ajustements de stock
CREATE TABLE public.ajustements_stock (
  id_ajustement uuid NOT NULL DEFAULT gen_random_uuid(),
  reference character varying,
  date_ajustement timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  type_ajustement text NOT NULL CHECK (type_ajustement = ANY (ARRAY['AUGMENTATION'::text, 'DIMINUTION'::text])),
  quantite integer NOT NULL,
  quantite_absolue integer NOT NULL CHECK (quantite_absolue > 0),
  motif text NOT NULL,
  id_produit uuid NOT NULL,
  id_entrepot uuid NOT NULL,
  id_user uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ajustements_stock_pkey PRIMARY KEY (id_ajustement),
  CONSTRAINT ajustements_stock_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT ajustements_stock_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT ajustements_stock_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT ajustements_stock_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);

-- Index pour optimiser les performances
CREATE INDEX idx_entrees_stock_entreprise ON public.entrees_stock(id_entreprise);
CREATE INDEX idx_entrees_stock_entrepot ON public.entrees_stock(id_entrepot);
CREATE INDEX idx_entrees_stock_produit ON public.entrees_stock(id_produit);
CREATE INDEX idx_entrees_stock_date ON public.entrees_stock(date_entree);

CREATE INDEX idx_sorties_stock_entreprise ON public.sorties_stock(id_entreprise);
CREATE INDEX idx_sorties_stock_entrepot ON public.sorties_stock(id_entrepot);
CREATE INDEX idx_sorties_stock_produit ON public.sorties_stock(id_produit);
CREATE INDEX idx_sorties_stock_date ON public.sorties_stock(date_sortie);

CREATE INDEX idx_ajustements_stock_entreprise ON public.ajustements_stock(id_entreprise);
CREATE INDEX idx_ajustements_stock_entrepot ON public.ajustements_stock(id_entrepot);
CREATE INDEX idx_ajustements_stock_produit ON public.ajustements_stock(id_produit);
CREATE INDEX idx_ajustements_stock_date ON public.ajustements_stock(date_ajustement);

-- Fonctions pour générer des références automatiques
CREATE OR REPLACE FUNCTION generer_reference_entree()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'ENT-' || to_char(now(), 'YYYY-MM-DD') || '-' || substr(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generer_reference_sortie()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'SOR-' || to_char(now(), 'YYYY-MM-DD') || '-' || substr(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generer_reference_ajustement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := 'AJU-' || to_char(now(), 'YYYY-MM-DD') || '-' || substr(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour générer les références automatiquement
CREATE TRIGGER trigger_generer_reference_entree
  BEFORE INSERT ON public.entrees_stock
  FOR EACH ROW
  EXECUTE FUNCTION generer_reference_entree();

CREATE TRIGGER trigger_generer_reference_sortie
  BEFORE INSERT ON public.sorties_stock
  FOR EACH ROW
  EXECUTE FUNCTION generer_reference_sortie();

CREATE TRIGGER trigger_generer_reference_ajustement
  BEFORE INSERT ON public.ajustements_stock
  FOR EACH ROW
  EXECUTE FUNCTION generer_reference_ajustement();

-- Trigger pour mettre à jour le stock automatiquement après chaque mouvement
CREATE OR REPLACE FUNCTION mettre_a_jour_stock_entree()
RETURNS TRIGGER AS $$
BEGIN
  -- Augmenter le stock disponible
  INSERT INTO public.stocks (id_produit, id_entrepot, quantite_disponible, id_entreprise)
  VALUES (NEW.id_produit, NEW.id_entrepot, NEW.quantite, NEW.id_entreprise)
  ON CONFLICT (id_produit, id_entrepot) 
  DO UPDATE SET 
    quantite_disponible = stocks.quantite_disponible + NEW.quantite;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mettre_a_jour_stock_sortie()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le stock est suffisant
  DECLARE
    stock_disponible integer;
  BEGIN
    SELECT quantite_disponible INTO stock_disponible
    FROM public.stocks
    WHERE id_produit = NEW.id_produit AND id_entrepot = NEW.id_entrepot;
    
    IF stock_disponible < NEW.quantite THEN
      RAISE EXCEPTION 'Stock insuffisant. Disponible: %, Demandé: %', stock_disponible, NEW.quantite;
    END IF;
    
    -- Diminuer le stock disponible
    UPDATE public.stocks 
    SET quantite_disponible = quantite_disponible - NEW.quantite
    WHERE id_produit = NEW.id_produit AND id_entrepot = NEW.id_entrepot;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mettre_a_jour_stock_ajustement()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le stock selon le type d'ajustement
  IF NEW.type_ajustement = 'AUGMENTATION' THEN
    INSERT INTO public.stocks (id_produit, id_entrepot, quantite_disponible, id_entreprise)
    VALUES (NEW.id_produit, NEW.id_entrepot, NEW.quantite_absolue, NEW.id_entreprise)
    ON CONFLICT (id_produit, id_entrepot) 
    DO UPDATE SET 
      quantite_disponible = stocks.quantite_disponible + NEW.quantite_absolue;
  ELSIF NEW.type_ajustement = 'DIMINUTION' THEN
    UPDATE public.stocks 
    SET quantite_disponible = GREATEST(0, stocks.quantite_disponible - NEW.quantite_absolue)
    WHERE id_produit = NEW.id_produit AND id_entrepot = NEW.id_entrepot;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour la mise à jour automatique du stock
CREATE TRIGGER trigger_mettre_a_jour_stock_entree
  AFTER INSERT ON public.entrees_stock
  FOR EACH ROW
  EXECUTE FUNCTION mettre_a_jour_stock_entree();

CREATE TRIGGER trigger_mettre_a_jour_stock_sortie
  AFTER INSERT ON public.sorties_stock
  FOR EACH ROW
  EXECUTE FUNCTION mettre_a_jour_stock_sortie();

CREATE TRIGGER trigger_mettre_a_jour_stock_ajustement
  AFTER INSERT ON public.ajustements_stock
  FOR EACH ROW
  EXECUTE FUNCTION mettre_a_jour_stock_ajustement();
