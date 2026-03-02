-- ==========================================
-- 0. EXTENSIONS & PRÉREQUIS
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MODULE ENTREPRISE (RACINE)
-- ==========================================
CREATE TABLE entreprises (
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

-- ==========================================
-- 2. MODULE SÉCURITÉ (RBAC)
-- ==========================================
CREATE TABLE roles (
    id_role UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    libelle VARCHAR(50) NOT NULL
);

CREATE TABLE permissions (
    id_permission UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_action VARCHAR(100) NOT NULL
);

CREATE TABLE role_permission (
    id_role UUID REFERENCES roles(id_role) ON DELETE CASCADE,
    id_permission UUID REFERENCES permissions(id_permission) ON DELETE CASCADE,
    PRIMARY KEY (id_role, id_permission)
);

CREATE TABLE utilisateurs (
    id_user UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    id_role UUID REFERENCES roles(id_role),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 3. MODULE CATALOGUE & LOGISTIQUE
-- ==========================================
CREATE TABLE categories (
    id_categorie UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_categorie VARCHAR(100) NOT NULL,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE produits (
    id_produit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    designation VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    prix_unitaire DECIMAL(10, 2),
    id_categorie UUID REFERENCES categories(id_categorie),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    UNIQUE(sku, id_entreprise) -- Le SKU est unique par entreprise
);

CREATE TABLE entrepots (
    id_entrepot UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_entrepot VARCHAR(100) NOT NULL,
    adresse TEXT,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE stocks (
    id_stock UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantite_disponible INT DEFAULT 0,
    seuil_alerte INT DEFAULT 5,
    id_produit UUID REFERENCES produits(id_produit),
    id_entrepot UUID REFERENCES entrepots(id_entrepot),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 4. MODULE TIERS
-- ==========================================
CREATE TABLE fournisseurs (
    id_fournisseur UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_societe VARCHAR(150) NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE clients (
    id_client UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id_mvt UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_mvt TEXT CHECK (type_mvt IN ('ENTREE', 'SORTIE', 'AJUSTEMENT')),
    quantite INT NOT NULL,
    date_mvt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motif TEXT,
    id_produit UUID REFERENCES produits(id_produit),
    id_entrepot UUID REFERENCES entrepots(id_entrepot),
    id_user UUID REFERENCES utilisateurs(id_user),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE transferts (
    id_transfert UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantite INT NOT NULL,
    date_transfert TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_produit UUID REFERENCES produits(id_produit),
    id_entrepot_source UUID REFERENCES entrepots(id_entrepot),
    id_entrepot_dest UUID REFERENCES entrepots(id_entrepot),
    id_user UUID REFERENCES utilisateurs(id_user),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 6. MODULE COMMERCIAL
-- ==========================================
CREATE TABLE commandes (
    id_commande UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50),
    date_commande TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    type_commande TEXT CHECK (type_commande IN ('ACHAT', 'VENTE')),
    statut TEXT DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'ANNULE')),
    id_client UUID REFERENCES clients(id_client),
    id_fournisseur UUID REFERENCES fournisseurs(id_fournisseur),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    UNIQUE(reference, id_entreprise)
);

CREATE TABLE lignes_commande (
    id_ligne UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quantite INT NOT NULL,
    prix_unitaire_applique DECIMAL(10, 2),
    id_commande UUID REFERENCES commandes(id_commande) ON DELETE CASCADE,
    id_produit UUID REFERENCES produits(id_produit),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- 7. MODULE FINANCE & SYSTÈME
-- ==========================================
CREATE TABLE factures (
    id_facture UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    num_facture VARCHAR(50),
    date_facturation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    montant_ttc DECIMAL(10, 2),
    id_commande UUID REFERENCES commandes(id_commande),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE,
    UNIQUE(num_facture, id_entreprise)
);

CREATE TABLE paiements (
    id_paiement UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date_paiement TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    montant_verse DECIMAL(10, 2),
    mode_paiement TEXT CHECK (mode_paiement IN ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE')),
    id_facture UUID REFERENCES factures(id_facture),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id_notif UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    date_envoi TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    est_lu BOOLEAN DEFAULT FALSE,
    id_user UUID REFERENCES utilisateurs(id_user),
    id_entreprise UUID REFERENCES entreprises(id_entreprise) ON DELETE CASCADE
);

-- ==========================================
-- INSERTIONS DES DONNÉES INITIALES
-- ==========================================

INSERT INTO roles (libelle) VALUES 
('Admin'), 
('Super User'), 
('Gerant Principal'), 
('Gerant'), 
('Comptable'), 
('Employés');

INSERT INTO permissions (nom_action) VALUES 
('dashboard.view'),
('users.view'),
('users.create'),
('users.edit'),
('users.delete'),
('companies.view'),
('companies.edit'),
('products.view'),
('products.create'),
('products.edit'),
('products.delete'),
('stocks.view'),
('stocks.create'),
('stocks.edit'),
('stocks.delete'),
('clients.view'),
('clients.create'),
('clients.edit'),
('clients.delete'),
('suppliers.view'),
('suppliers.create'),
('suppliers.edit'),
('suppliers.delete'),
('orders.view'),
('orders.create'),
('orders.edit'),
('orders.delete');

-- Attribution de toutes les permissions au rôle Admin
INSERT INTO role_permission (id_role, id_permission)
SELECT r.id_role, p.id_permission
FROM roles r, permissions p
WHERE r.libelle = 'Admin';

-- ==========================================
-- INDEX POUR PERFORMANCES
-- ==========================================

CREATE INDEX idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_role ON utilisateurs(id_role);
CREATE INDEX idx_utilisateurs_entreprise ON utilisateurs(id_entreprise);
CREATE INDEX idx_entreprises_email ON entreprises(email_entreprise);
CREATE INDEX idx_entreprises_ifu ON entreprises(ifu);
CREATE INDEX idx_roles_libelle ON roles(libelle);
CREATE INDEX idx_permissions_action ON permissions(nom_action);
CREATE INDEX idx_produits_entreprise ON produits(id_entreprise);
CREATE INDEX idx_stocks_entreprise ON stocks(id_entreprise);
CREATE INDEX idx_categories_entreprise ON categories(id_entreprise);
CREATE INDEX idx_clients_entreprise ON clients(id_entreprise);
CREATE INDEX idx_fournisseurs_entreprise ON fournisseurs(id_entreprise);
CREATE INDEX idx_commandes_entreprise ON commandes(id_entreprise);

-- ==========================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================

ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour utilisateurs
CREATE POLICY "Users can view their own company users" ON utilisateurs
    FOR SELECT USING (
        id_entreprise IN (
            SELECT id_entreprise FROM utilisateurs 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Users can insert users for their company" ON utilisateurs
    FOR INSERT WITH CHECK (
        id_entreprise IN (
            SELECT id_entreprise FROM utilisateurs 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Users can update users for their company" ON utilisateurs
    FOR UPDATE USING (
        id_entreprise IN (
            SELECT id_entreprise FROM utilisateurs 
            WHERE email = auth.email()
        )
    );

-- Politiques RLS pour entreprises
CREATE POLICY "Users can view their own company" ON entreprises
    FOR SELECT USING (
        id_entreprise IN (
            SELECT id_entreprise FROM utilisateurs 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Users can update their own company" ON entreprises
    FOR UPDATE USING (
        id_entreprise IN (
            SELECT id_entreprise FROM utilisateurs 
            WHERE email = auth.email()
        )
    );
