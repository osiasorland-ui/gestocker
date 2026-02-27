-- ==========================================
-- 0. EXTENSIONS & PRÉREQUIS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MODULE ENTREPRISE (RACINE)
-- ==========================================
CREATE TABLE entreprises (
    id_entreprise UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nom_commercial VARCHAR(150) NOT NULL,
    raison_sociale VARCHAR(150),
    ifu VARCHAR(50) UNIQUE NOT NULL,
    registre_commerce VARCHAR(100) UNIQUE NOT NULL,
    adresse_siege TEXT,
    telephone_contact VARCHAR(20),
    email_entreprise VARCHAR(150),
    logo_path TEXT,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. MODULE SÉCURITÉ (RBAC)
-- ==========================================
CREATE TABLE roles (
    id_role SERIAL PRIMARY KEY,
    libelle VARCHAR(50) NOT NULL,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE permissions (
    id_permission SERIAL PRIMARY KEY,
    nom_action VARCHAR(100) NOT NULL,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE role_permission (
    id_role INT REFERENCES roles(id_role) ON DELETE CASCADE,
    id_permission INT REFERENCES permissions(id_permission) ON DELETE CASCADE,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    PRIMARY KEY (id_role, id_permission)
);

CREATE TABLE utilisateurs (
    id_user SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    id_role INT REFERENCES roles(id_role),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 3. MODULE CATALOGUE & LOGISTIQUE
-- ==========================================
CREATE TABLE categories (
    id_categorie SERIAL PRIMARY KEY,
    nom_categorie VARCHAR(100) NOT NULL,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE produits (
    id_produit SERIAL PRIMARY KEY,
    designation VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    prix_unitaire DECIMAL(10, 2),
    id_categorie INT REFERENCES categories(id_categorie),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    UNIQUE(sku, id_entreprise) -- Le SKU est unique par entreprise
);

CREATE TABLE entrepots (
    id_entrepot SERIAL PRIMARY KEY,
    nom_entrepot VARCHAR(100) NOT NULL,
    adresse TEXT,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE stocks (
    id_stock SERIAL PRIMARY KEY,
    quantite_disponible INT DEFAULT 0,
    seuil_alerte INT DEFAULT 5,
    id_produit INT REFERENCES produits(id_produit),
    id_entrepot INT REFERENCES entrepots(id_entrepot),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 4. MODULE TIERS
-- ==========================================
CREATE TABLE fournisseurs (
    id_fournisseur SERIAL PRIMARY KEY,
    nom_societe VARCHAR(150) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE clients (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(150),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 5. MODULE MOUVEMENTS & FLUX
-- ==========================================
CREATE TABLE mouvements_stock (
    id_mvt SERIAL PRIMARY KEY,
    type_mvt TEXT CHECK (type_mvt IN ('ENTREE', 'SORTIE', 'AJUSTEMENT')),
    quantite INT NOT NULL,
    date_mvt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    id_produit INT REFERENCES produits(id_produit),
    id_entrepot INT REFERENCES entrepots(id_entrepot),
    id_user INT REFERENCES utilisateurs(id_user),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE transferts (
    id_transfert SERIAL PRIMARY KEY,
    quantite INT NOT NULL,
    date_transfert TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_produit INT REFERENCES produits(id_produit),
    id_entrepot_source INT REFERENCES entrepots(id_entrepot),
    id_entrepot_dest INT REFERENCES entrepots(id_entrepot),
    id_user INT REFERENCES utilisateurs(id_user),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 6. MODULE COMMERCIAL
-- ==========================================
CREATE TABLE commandes (
    id_commande SERIAL PRIMARY KEY,
    reference VARCHAR(50),
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type_commande TEXT CHECK (type_commande IN ('ACHAT', 'VENTE')),
    statut TEXT DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'ANNULE')),
    id_client INT REFERENCES clients(id_client),
    id_fournisseur INT REFERENCES fournisseurs(id_fournisseur),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    UNIQUE(reference, id_entreprise)
);

CREATE TABLE lignes_commande (
    id_ligne SERIAL PRIMARY KEY,
    quantite INT NOT NULL,
    prix_unitaire_applique DECIMAL(10, 2),
    id_commande INT REFERENCES commandes(id_commande) ON DELETE CASCADE,
    id_produit INT REFERENCES produits(id_produit),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 7. MODULE FINANCE & SYSTÈME
-- ==========================================
CREATE TABLE factures (
    id_facture SERIAL PRIMARY KEY,
    num_facture VARCHAR(50),
    date_facturation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    montant_ttc DECIMAL(10, 2),
    id_commande INT REFERENCES commandes(id_commande),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    UNIQUE(num_facture, id_entreprise)
);

CREATE TABLE paiements (
    id_paiement SERIAL PRIMARY KEY,
    date_paiement TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    montant_verse DECIMAL(10, 2),
    mode_paiement TEXT CHECK (mode_paiement IN ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE')),
    id_facture INT REFERENCES factures(id_facture),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id_notif SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    date_envoi TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    est_lu BOOLEAN DEFAULT FALSE,
    id_user INT REFERENCES utilisateurs(id_user),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);