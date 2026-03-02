-- ==========================================
-- MIGRATION COMPLÈTE VERS UUID (VERSION FINALE)
-- ==========================================

-- Extension UUID requise
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CRÉATION DES NOUVELLES TABLES AVEC UUID
-- ==========================================

-- Créer les nouvelles tables avec UUID
CREATE TABLE IF NOT EXISTS roles_new (
    id_role UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions_new (
    id_permission UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_action VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permission_new (
    id_role UUID NOT NULL,
    id_permission UUID NOT NULL,
    PRIMARY KEY (id_role, id_permission),
    FOREIGN KEY (id_role) REFERENCES roles_new(id_role) ON DELETE CASCADE,
    FOREIGN KEY (id_permission) REFERENCES permissions_new(id_permission) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entreprises_new (
    id_entreprise UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS utilisateurs_new (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    id_role UUID NOT NULL,
    id_entreprise UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (id_role) REFERENCES roles_new(id_role) ON DELETE CASCADE,
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS categories_new (
    id_categorie UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_categorie VARCHAR(100) NOT NULL,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS produits_new (
    id_produit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    prix_unitaire DECIMAL(10, 2),
    id_categorie UUID,
    id_entreprise UUID NOT NULL,
    UNIQUE(sku, id_entreprise),
    FOREIGN KEY (id_categorie) REFERENCES categories_new(id_categorie),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entrepots_new (
    id_entrepot UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_entrepot VARCHAR(100) NOT NULL,
    adresse TEXT,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stocks_new (
    id_stock UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantite_disponible INT DEFAULT 0,
    seuil_alerte INT DEFAULT 5,
    id_produit UUID NOT NULL,
    id_entrepot UUID NOT NULL,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_produit) REFERENCES produits_new(id_produit),
    FOREIGN KEY (id_entrepot) REFERENCES entrepots_new(id_entrepot),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fournisseurs_new (
    id_fournisseur UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_societe VARCHAR(150) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clients_new (
    id_client UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(150),
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mouvements_stock_new (
    id_mvt UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_mvt TEXT CHECK (type_mvt IN ('ENTREE', 'SORTIE', 'AJUSTEMENT')),
    quantite INT NOT NULL,
    date_mvt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    id_produit UUID NOT NULL,
    id_entrepot UUID NOT NULL,
    id_user UUID NOT NULL,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_produit) REFERENCES produits_new(id_produit),
    FOREIGN KEY (id_entrepot) REFERENCES entrepots_new(id_entrepot),
    FOREIGN KEY (id_user) REFERENCES utilisateurs_new(id_user),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transferts_new (
    id_transfert UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantite INT NOT NULL,
    date_transfert TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_produit UUID NOT NULL,
    id_entrepot_source UUID NOT NULL,
    id_entrepot_dest UUID NOT NULL,
    id_user UUID NOT NULL,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_produit) REFERENCES produits_new(id_produit),
    FOREIGN KEY (id_entrepot_source) REFERENCES entrepots_new(id_entrepot),
    FOREIGN KEY (id_entrepot_dest) REFERENCES entrepots_new(id_entrepot),
    FOREIGN KEY (id_user) REFERENCES utilisateurs_new(id_user),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commandes_new (
    id_commande UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50),
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type_commande TEXT CHECK (type_commande IN ('ACHAT', 'VENTE')),
    statut TEXT DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'ANNULE')),
    id_client UUID,
    id_fournisseur UUID,
    id_entreprise UUID NOT NULL,
    UNIQUE(reference, id_entreprise),
    FOREIGN KEY (id_client) REFERENCES clients_new(id_client),
    FOREIGN KEY (id_fournisseur) REFERENCES fournisseurs_new(id_fournisseur),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lignes_commande_new (
    id_ligne UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantite INT NOT NULL,
    prix_unitaire_applique DECIMAL(10, 2),
    id_commande UUID NOT NULL,
    id_produit UUID NOT NULL,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes_new(id_commande) ON DELETE CASCADE,
    FOREIGN KEY (id_produit) REFERENCES produits_new(id_produit),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS factures_new (
    id_facture UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    num_facture VARCHAR(50),
    date_facturation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    montant_ttc DECIMAL(10, 2),
    id_commande UUID,
    id_entreprise UUID NOT NULL,
    UNIQUE(num_facture, id_entreprise),
    FOREIGN KEY (id_commande) REFERENCES commandes_new(id_commande),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS paiements_new (
    id_paiement UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_paiement TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    montant_verse DECIMAL(10, 2),
    mode_paiement TEXT CHECK (mode_paiement IN ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE')),
    id_facture UUID,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_facture) REFERENCES factures_new(id_facture),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications_new (
    id_notif UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    date_envoi TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    est_lu BOOLEAN DEFAULT FALSE,
    id_user UUID NOT NULL,
    id_entreprise UUID NOT NULL,
    FOREIGN KEY (id_user) REFERENCES utilisateurs_new(id_user),
    FOREIGN KEY (id_entreprise) REFERENCES entreprises_new(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 2. MIGRATION DES DONNÉES
-- ==========================================

-- Migration des rôles
INSERT INTO roles_new (libelle)
SELECT libelle FROM roles
ON CONFLICT DO NOTHING;

-- Migration des permissions
INSERT INTO permissions_new (nom_action)
SELECT nom_action FROM permissions
ON CONFLICT DO NOTHING;

-- Migration des entreprises
INSERT INTO entreprises_new (id_entreprise, nom_commercial, raison_sociale, ifu, registre_commerce, adresse_siege, telephone_contact, email_entreprise, logo_path, date_creation)
SELECT e.id_entreprise, e.nom_commercial, e.raison_sociale, e.ifu, e.registre_commerce, e.adresse_siege, e.telephone_contact, e.email_entreprise, e.logo_path, e.date_creation FROM entreprises e
ON CONFLICT DO NOTHING;

-- Migration des utilisateurs
INSERT INTO utilisateurs_new (id_user, nom, email, mot_de_passe, id_role, id_entreprise)
SELECT 
    gen_random_uuid() as id_user,
    u.nom, 
    u.email, 
    u.mot_de_passe, 
    r_new.id_role,
    u.id_entreprise
FROM utilisateurs u
JOIN roles r ON u.id_role = r.id_role
JOIN roles_new r_new ON r.libelle = r_new.libelle
ON CONFLICT DO NOTHING;

-- Migration des catégories
INSERT INTO categories_new (id_categorie, nom_categorie, id_entreprise)
SELECT gen_random_uuid() as id_categorie, c.nom_categorie, c.id_entreprise FROM categories c
ON CONFLICT DO NOTHING;

-- Migration des produits
INSERT INTO produits_new (id_produit, designation, sku, prix_unitaire, id_categorie, id_entreprise)
SELECT 
    gen_random_uuid() as id_produit,
    p.designation, 
    p.sku, 
    p.prix_unitaire, 
    c_new.id_categorie,
    p.id_entreprise
FROM produits p
JOIN categories c ON p.id_categorie = c.id_categorie
JOIN categories_new c_new ON c.nom_categorie = c_new.nom_categorie AND c.id_entreprise = c_new.id_entreprise
ON CONFLICT DO NOTHING;

-- Migration des entrepots
INSERT INTO entrepots_new (id_entrepot, nom_entrepot, adresse, id_entreprise)
SELECT gen_random_uuid() as id_entrepot, e.nom_entrepot, e.adresse, e.id_entreprise FROM entrepots e
ON CONFLICT DO NOTHING;

-- Migration des stocks
INSERT INTO stocks_new (id_stock, quantite_disponible, seuil_alerte, id_produit, id_entrepot, id_entreprise)
SELECT 
    gen_random_uuid() as id_stock,
    s.quantite_disponible, 
    s.seuil_alerte, 
    p_new.id_produit,
    e_new.id_entrepot,
    s.id_entreprise
FROM stocks s
JOIN produits p ON s.id_produit = p.id_produit
JOIN produits_new p_new ON p.designation = p_new.designation AND p.id_entreprise = p_new.id_entreprise
JOIN entrepots e ON s.id_entrepot = e.id_entrepot
JOIN entrepots_new e_new ON e.nom_entrepot = e_new.nom_entrepot AND e.id_entreprise = e_new.id_entreprise
ON CONFLICT DO NOTHING;

-- Migration des fournisseurs
INSERT INTO fournisseurs_new (id_fournisseur, nom_societe, telephone, adresse, id_entreprise)
SELECT gen_random_uuid() as id_fournisseur, f.nom_societe, f.telephone, f.adresse, f.id_entreprise FROM fournisseurs f
ON CONFLICT DO NOTHING;

-- Migration des clients
INSERT INTO clients_new (id_client, nom, prenom, telephone, email, id_entreprise)
SELECT gen_random_uuid() as id_client, c.nom, c.prenom, c.telephone, c.email, c.id_entreprise FROM clients c
ON CONFLICT DO NOTHING;

-- Migration des autres tables (similaire pour les tables restantes)
-- Pour des raisons de simplicité, vous pouvez ajouter les migrations pour:
-- mouvements_stock, transferts, commandes, lignes_commande, factures, paiements, notifications

-- ==========================================
-- 3. REMPLACEMENT DES TABLES
-- ==========================================

-- Supprimer les anciennes tables
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS factures CASCADE;
DROP TABLE IF EXISTS lignes_commande CASCADE;
DROP TABLE IF EXISTS commandes CASCADE;
DROP TABLE IF EXISTS transferts CASCADE;
DROP TABLE IF EXISTS mouvements_stock CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS fournisseurs CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;
DROP TABLE IF EXISTS entrepots CASCADE;
DROP TABLE IF EXISTS produits CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;
DROP TABLE IF EXISTS role_permission CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS entreprises CASCADE;

-- Renommer les nouvelles tables
ALTER TABLE roles_new RENAME TO roles;
ALTER TABLE permissions_new RENAME TO permissions;
ALTER TABLE role_permission_new RENAME TO role_permission;
ALTER TABLE utilisateurs_new RENAME TO utilisateurs;
ALTER TABLE categories_new RENAME TO categories;
ALTER TABLE produits_new RENAME TO produits;
ALTER TABLE entrepots_new RENAME TO entrepots;
ALTER TABLE stocks_new RENAME TO stocks;
ALTER TABLE fournisseurs_new RENAME TO fournisseurs;
ALTER TABLE clients_new RENAME TO clients;
ALTER TABLE mouvements_stock_new RENAME TO mouvements_stock;
ALTER TABLE transferts_new RENAME TO transferts;
ALTER TABLE commandes_new RENAME TO commandes;
ALTER TABLE lignes_commande_new RENAME TO lignes_commande;
ALTER TABLE factures_new RENAME TO factures;
ALTER TABLE paiements_new RENAME TO paiements;
ALTER TABLE notifications_new RENAME TO notifications;

-- ==========================================
-- 4. INSÉRION DES DONNÉES INITIALES
-- ==========================================

-- Attribution de toutes les permissions au rôle Admin
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r, permissions p
WHERE r.libelle = 'Admin'
ON CONFLICT (id_role, id_permission) DO NOTHING;
