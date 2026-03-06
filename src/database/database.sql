-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id_categorie uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_categorie character varying NOT NULL,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT categories_pkey PRIMARY KEY (id_categorie),
  CONSTRAINT categories_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.clients (
  id_client uuid NOT NULL DEFAULT gen_random_uuid(),
  nom character varying,
  prenom character varying,
  telephone character varying,
  email character varying,
  id_entreprise uuid NOT NULL,
  CONSTRAINT clients_pkey PRIMARY KEY (id_client),
  CONSTRAINT clients_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.commandes (
  id_commande uuid NOT NULL DEFAULT gen_random_uuid(),
  reference character varying,
  date_commande timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  type_commande text CHECK (type_commande = ANY (ARRAY['ACHAT'::text, 'VENTE'::text])),
  statut text DEFAULT 'EN_ATTENTE'::text CHECK (statut = ANY (ARRAY['EN_ATTENTE'::text, 'VALIDE'::text, 'ANNULE'::text])),
  id_client uuid,
  id_fournisseur uuid,
  id_entreprise uuid NOT NULL,
  CONSTRAINT commandes_pkey PRIMARY KEY (id_commande),
  CONSTRAINT commandes_new_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.clients(id_client),
  CONSTRAINT commandes_new_id_fournisseur_fkey FOREIGN KEY (id_fournisseur) REFERENCES public.fournisseurs(id_fournisseur),
  CONSTRAINT commandes_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.details_livraison (
  id_detail uuid NOT NULL DEFAULT gen_random_uuid(),
  quantite_livree integer NOT NULL,
  quantite_retournee integer DEFAULT 0,
  id_livraison uuid NOT NULL,
  id_produit uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  CONSTRAINT details_livraison_pkey PRIMARY KEY (id_detail),
  CONSTRAINT details_livraison_id_livraison_fkey FOREIGN KEY (id_livraison) REFERENCES public.livraisons(id_livraison),
  CONSTRAINT details_livraison_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT details_livraison_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.entrepots (
  id_entrepot uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_entrepot character varying NOT NULL,
  adresse text,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT entrepots_pkey PRIMARY KEY (id_entrepot),
  CONSTRAINT entrepots_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.entreprises (
  id_entreprise uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_commercial character varying NOT NULL,
  raison_sociale character varying,
  ifu character varying NOT NULL UNIQUE,
  registre_commerce character varying NOT NULL UNIQUE,
  adresse_siege text,
  telephone_contact character varying,
  email_entreprise character varying,
  logo_path text,
  date_creation timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT entreprises_pkey PRIMARY KEY (id_entreprise)
);
CREATE TABLE public.factures (
  id_facture uuid NOT NULL DEFAULT gen_random_uuid(),
  num_facture character varying,
  date_facturation timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  montant_ttc numeric,
  id_commande uuid,
  id_entreprise uuid NOT NULL,
  CONSTRAINT factures_pkey PRIMARY KEY (id_facture),
  CONSTRAINT factures_new_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES public.commandes(id_commande),
  CONSTRAINT factures_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.fournisseurs (
  id_fournisseur uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_fournisseur character varying NOT NULL CHECK (nom_fournisseur IS NOT NULL AND nom_fournisseur::text <> ''::text),
  contact_telephone character varying NOT NULL CHECK (contact_telephone IS NOT NULL AND contact_telephone::text <> ''::text),
  adresse text NOT NULL,
  id_entreprise uuid NOT NULL,
  contact_nom character varying NOT NULL DEFAULT ''::character varying,
  contact_email character varying NOT NULL DEFAULT ''::character varying CHECK (contact_email IS NULL OR contact_email::text = ''::text OR contact_email::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text),
  ville character varying NOT NULL DEFAULT ''::character varying,
  pays character varying NOT NULL DEFAULT ''::character varying,
  conditions_paiement text NOT NULL DEFAULT ''::text,
  delai_livraison text NOT NULL DEFAULT ''::text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  rating numeric CHECK (rating >= 1.0 AND rating <= 5.0),
  CONSTRAINT fournisseurs_pkey PRIMARY KEY (id_fournisseur),
  CONSTRAINT fournisseurs_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.lignes_commande (
  id_ligne uuid NOT NULL DEFAULT gen_random_uuid(),
  quantite integer NOT NULL,
  prix_unitaire_applique numeric,
  id_commande uuid NOT NULL,
  id_produit uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  CONSTRAINT lignes_commande_pkey PRIMARY KEY (id_ligne),
  CONSTRAINT lignes_commande_new_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES public.commandes(id_commande),
  CONSTRAINT lignes_commande_new_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT lignes_commande_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.livraisons (
  id_livraison uuid NOT NULL DEFAULT gen_random_uuid(),
  reference character varying,
  date_livraison timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  statut text DEFAULT 'EN_ATTENTE'::text CHECK (statut = ANY (ARRAY['EN_ATTENTE'::text, 'EN_COURS'::text, 'LIVRE'::text, 'ANNULE'::text])),
  adresse_livraison text NOT NULL,
  observations text,
  id_commande uuid NOT NULL,
  id_livreur uuid NOT NULL,
  id_client uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT livraisons_pkey PRIMARY KEY (id_livraison),
  CONSTRAINT livraisons_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES public.commandes(id_commande),
  CONSTRAINT livraisons_id_livreur_fkey FOREIGN KEY (id_livreur) REFERENCES public.livreurs(id_livreur),
  CONSTRAINT livraisons_id_client_fkey FOREIGN KEY (id_client) REFERENCES public.clients(id_client),
  CONSTRAINT livraisons_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.livreurs (
  id_livreur uuid NOT NULL DEFAULT gen_random_uuid(),
  nom character varying NOT NULL,
  prenom character varying,
  telephone character varying NOT NULL,
  email character varying,
  vehicule_type character varying,
  immatriculation character varying,
  statut text DEFAULT 'ACTIF'::text CHECK (statut = ANY (ARRAY['ACTIF'::text, 'INACTIF'::text])),
  date_embauche timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  id_user uuid,
  CONSTRAINT livreurs_pkey PRIMARY KEY (id_livreur),
  CONSTRAINT livreurs_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise),
  CONSTRAINT fk_livreurs_utilisateur FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT livreurs_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user)
);
CREATE TABLE public.mouvements_stock (
  id_mvt uuid NOT NULL DEFAULT gen_random_uuid(),
  type_mvt text CHECK (type_mvt = ANY (ARRAY['ENTREE'::text, 'SORTIE'::text, 'AJUSTEMENT'::text])),
  quantite integer NOT NULL,
  date_mvt timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  motif text,
  id_produit uuid NOT NULL,
  id_entrepot uuid NOT NULL,
  id_user uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  CONSTRAINT mouvements_stock_pkey PRIMARY KEY (id_mvt),
  CONSTRAINT mouvements_stock_new_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT mouvements_stock_new_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT mouvements_stock_new_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT mouvements_stock_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.notifications (
  id_notif uuid NOT NULL DEFAULT gen_random_uuid(),
  message text NOT NULL,
  date_envoi timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  est_lu boolean DEFAULT false,
  id_user uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  CONSTRAINT notifications_pkey PRIMARY KEY (id_notif),
  CONSTRAINT notifications_new_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT notifications_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.otp_codes (
  id_otp uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  code character varying NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  attempts integer DEFAULT 0,
  is_used boolean DEFAULT false,
  last_attempt_at timestamp with time zone,
  blocked_until timestamp with time zone,
  CONSTRAINT otp_codes_pkey PRIMARY KEY (id_otp)
);
CREATE TABLE public.paiements (
  id_paiement uuid NOT NULL DEFAULT gen_random_uuid(),
  date_paiement timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  montant_verse numeric,
  mode_paiement text CHECK (mode_paiement = ANY (ARRAY['ESPECES'::text, 'CHEQUE'::text, 'VIREMENT'::text, 'CARTE'::text])),
  id_facture uuid,
  id_entreprise uuid NOT NULL,
  CONSTRAINT paiements_pkey PRIMARY KEY (id_paiement),
  CONSTRAINT paiements_new_id_facture_fkey FOREIGN KEY (id_facture) REFERENCES public.factures(id_facture),
  CONSTRAINT paiements_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.permissions (
  id_permission uuid NOT NULL DEFAULT gen_random_uuid(),
  nom_action character varying NOT NULL,
  CONSTRAINT permissions_pkey PRIMARY KEY (id_permission)
);
CREATE TABLE public.produits (
  id_produit uuid NOT NULL DEFAULT gen_random_uuid(),
  designation character varying NOT NULL,
  sku character varying,
  prix_unitaire numeric,
  id_categorie uuid,
  id_entreprise uuid NOT NULL,
  id_entrepot uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  quantite_stock integer DEFAULT 0 CHECK (quantite_stock >= 0),
  CONSTRAINT produits_pkey PRIMARY KEY (id_produit),
  CONSTRAINT produits_new_id_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES public.categories(id_categorie),
  CONSTRAINT produits_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise),
  CONSTRAINT produits_new_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES public.entrepots(id_entrepot)
);
CREATE TABLE public.role_permission (
  id_role uuid NOT NULL,
  id_permission uuid NOT NULL,
  CONSTRAINT role_permission_pkey PRIMARY KEY (id_role, id_permission),
  CONSTRAINT role_permission_new_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.roles(id_role),
  CONSTRAINT role_permission_new_id_permission_fkey FOREIGN KEY (id_permission) REFERENCES public.permissions(id_permission)
);
CREATE TABLE public.roles (
  id_role uuid NOT NULL DEFAULT gen_random_uuid(),
  libelle character varying NOT NULL,
  CONSTRAINT roles_pkey PRIMARY KEY (id_role)
);
CREATE TABLE public.stocks (
  id_stock uuid NOT NULL DEFAULT gen_random_uuid(),
  quantite_disponible integer DEFAULT 0,
  seuil_alerte integer DEFAULT 5,
  id_produit uuid NOT NULL,
  id_entrepot uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  CONSTRAINT stocks_pkey PRIMARY KEY (id_stock),
  CONSTRAINT stocks_new_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT stocks_new_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT stocks_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.transferts (
  id_transfert uuid NOT NULL DEFAULT gen_random_uuid(),
  quantite integer NOT NULL,
  date_transfert timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  id_produit uuid NOT NULL,
  id_entrepot_source uuid NOT NULL,
  id_entrepot_dest uuid NOT NULL,
  id_user uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  CONSTRAINT transferts_pkey PRIMARY KEY (id_transfert),
  CONSTRAINT transferts_new_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES public.produits(id_produit),
  CONSTRAINT transferts_new_id_entrepot_source_fkey FOREIGN KEY (id_entrepot_source) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT transferts_new_id_entrepot_dest_fkey FOREIGN KEY (id_entrepot_dest) REFERENCES public.entrepots(id_entrepot),
  CONSTRAINT transferts_new_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.utilisateurs(id_user),
  CONSTRAINT transferts_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);
CREATE TABLE public.utilisateurs (
  id_user uuid NOT NULL DEFAULT gen_random_uuid(),
  nom character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  mot_de_passe text NOT NULL,
  id_role uuid NOT NULL,
  id_entreprise uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  mot_de_passe_hash text,
  CONSTRAINT utilisateurs_pkey PRIMARY KEY (id_user),
  CONSTRAINT utilisateurs_new_id_role_fkey FOREIGN KEY (id_role) REFERENCES public.roles(id_role),
  CONSTRAINT utilisateurs_new_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)
);