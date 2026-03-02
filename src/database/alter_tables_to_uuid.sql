-- ==========================================
-- ALTER TABLES POUR PASSER EN UUID
-- ==========================================

-- Extension UUID requise
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. MODIFICATION TABLES EXISTANTES
-- ==========================================

-- Ajouter les colonnes UUID temporaires
ALTER TABLE roles ADD COLUMN IF NOT EXISTS id_role_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS id_permission_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS id_user_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS id_categorie_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE produits ADD COLUMN IF NOT EXISTS id_produit_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE entrepots ADD COLUMN IF NOT EXISTS id_entrepot_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS id_stock_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE fournisseurs ADD COLUMN IF NOT EXISTS id_fournisseur_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_client_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE mouvements_stock ADD COLUMN IF NOT EXISTS id_mvt_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE transferts ADD COLUMN IF NOT EXISTS id_transfert_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE commandes ADD COLUMN IF NOT EXISTS id_commande_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE lignes_commande ADD COLUMN IF NOT EXISTS id_ligne_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE factures ADD COLUMN IF NOT EXISTS id_facture_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE paiements ADD COLUMN IF NOT EXISTS id_paiement_uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS id_notif_uuid UUID DEFAULT gen_random_uuid();

-- ==========================================
-- 2. MISE À JOUR DES CLÉS ÉTRANGÈRES
-- ==========================================

-- Mettre à jour les références dans role_permission
UPDATE role_permission SET id_role = (SELECT id_role_uuid FROM roles WHERE roles.id_role = role_permission.id_role);
UPDATE role_permission SET id_permission = (SELECT id_permission_uuid FROM permissions WHERE permissions.id_permission = role_permission.id_permission);

-- Mettre à jour les références dans utilisateurs
UPDATE utilisateurs SET id_role = (SELECT id_role_uuid FROM roles WHERE roles.id_role = utilisateurs.id_role);

-- Mettre à jour les références dans categories
UPDATE categories SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = categories.id_entreprise);

-- Mettre à jour les références dans produits
UPDATE produits SET id_categorie = (SELECT id_categorie_uuid FROM categories WHERE categories.id_categorie = produits.id_categorie);
UPDATE produits SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = produits.id_entreprise);

-- Mettre à jour les références dans entrepots
UPDATE entrepots SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = entrepots.id_entreprise);

-- Mettre à jour les références dans stocks
UPDATE stocks SET id_produit = (SELECT id_produit_uuid FROM produits WHERE produits.id_produit = stocks.id_produit);
UPDATE stocks SET id_entrepot = (SELECT id_entrepot_uuid FROM entrepots WHERE entrepots.id_entrepot = stocks.id_entrepot);
UPDATE stocks SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = stocks.id_entreprise);

-- Mettre à jour les références dans fournisseurs
UPDATE fournisseurs SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = fournisseurs.id_entreprise);

-- Mettre à jour les références dans clients
UPDATE clients SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = clients.id_entreprise);

-- Mettre à jour les références dans mouvements_stock
UPDATE mouvements_stock SET id_produit = (SELECT id_produit_uuid FROM produits WHERE produits.id_produit = mouvements_stock.id_produit);
UPDATE mouvements_stock SET id_entrepot = (SELECT id_entrepot_uuid FROM entrepots WHERE entrepots.id_entrepot = mouvements_stock.id_entrepot);
UPDATE mouvements_stock SET id_user = (SELECT id_user_uuid FROM utilisateurs WHERE utilisateurs.id_user = mouvements_stock.id_user);
UPDATE mouvements_stock SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = mouvements_stock.id_entreprise);

-- Mettre à jour les références dans transferts
UPDATE transferts SET id_produit = (SELECT id_produit_uuid FROM produits WHERE produits.id_produit = transferts.id_produit);
UPDATE transferts SET id_entrepot_source = (SELECT id_entrepot_uuid FROM entrepots WHERE entrepots.id_entrepot = transferts.id_entrepot_source);
UPDATE transferts SET id_entrepot_dest = (SELECT id_entrepot_uuid FROM entrepots WHERE entrepots.id_entrepot = transferts.id_entrepot_dest);
UPDATE transferts SET id_user = (SELECT id_user_uuid FROM utilisateurs WHERE utilisateurs.id_user = transferts.id_user);
UPDATE transferts SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = transferts.id_entreprise);

-- Mettre à jour les références dans commandes
UPDATE commandes SET id_client = (SELECT id_client_uuid FROM clients WHERE clients.id_client = commandes.id_client);
UPDATE commandes SET id_fournisseur = (SELECT id_fournisseur_uuid FROM fournisseurs WHERE fournisseurs.id_fournisseur = commandes.id_fournisseur);
UPDATE commandes SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = commandes.id_entreprise);

-- Mettre à jour les références dans lignes_commande
UPDATE lignes_commande SET id_commande = (SELECT id_commande_uuid FROM commandes WHERE commandes.id_commande = lignes_commande.id_commande);
UPDATE lignes_commande SET id_produit = (SELECT id_produit_uuid FROM produits WHERE produits.id_produit = lignes_commande.id_produit);
UPDATE lignes_commande SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = lignes_commande.id_entreprise);

-- Mettre à jour les références dans factures
UPDATE factures SET id_commande = (SELECT id_commande_uuid FROM commandes WHERE commandes.id_commande = factures.id_commande);
UPDATE factures SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = factures.id_entreprise);

-- Mettre à jour les références dans paiements
UPDATE paiements SET id_facture = (SELECT id_facture_uuid FROM factures WHERE factures.id_facture = paiements.id_facture);
UPDATE paiements SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = paiements.id_entreprise);

-- Mettre à jour les références dans notifications
UPDATE notifications SET id_user = (SELECT id_user_uuid FROM utilisateurs WHERE utilisateurs.id_user = notifications.id_user);
UPDATE notifications SET id_entreprise = (SELECT id_entreprise FROM entreprises WHERE entreprises.id_entreprise = notifications.id_entreprise);

-- ==========================================
-- 3. SUPPRESSION DES ANCIENNES COLONNES ET CRÉATION DES NOUVELLES
-- ==========================================

-- Supprimer les contraintes foreign key existantes
ALTER TABLE role_permission DROP CONSTRAINT IF EXISTS role_permission_id_role_fkey;
ALTER TABLE role_permission DROP CONSTRAINT IF EXISTS role_permission_id_permission_fkey;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_id_role_fkey;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_id_entreprise_fkey;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_id_entreprise_fkey;
ALTER TABLE produits DROP CONSTRAINT IF EXISTS produits_id_categorie_fkey;
ALTER TABLE produits DROP CONSTRAINT IF EXISTS produits_id_entreprise_fkey;
ALTER TABLE entrepots DROP CONSTRAINT IF EXISTS entrepots_id_entreprise_fkey;
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_id_produit_fkey;
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_id_entrepot_fkey;
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_id_entreprise_fkey;
ALTER TABLE fournisseurs DROP CONSTRAINT IF EXISTS fournisseurs_id_entreprise_fkey;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_id_entreprise_fkey;
ALTER TABLE mouvements_stock DROP CONSTRAINT IF EXISTS mouvements_stock_id_produit_fkey;
ALTER TABLE mouvements_stock DROP CONSTRAINT IF EXISTS mouvements_stock_id_entrepot_fkey;
ALTER TABLE mouvements_stock DROP CONSTRAINT IF EXISTS mouvements_stock_id_user_fkey;
ALTER TABLE mouvements_stock DROP CONSTRAINT IF EXISTS mouvements_stock_id_entreprise_fkey;
ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_id_produit_fkey;
ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_id_entrepot_source_fkey;
ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_id_entrepot_dest_fkey;
ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_id_user_fkey;
ALTER TABLE transferts DROP CONSTRAINT IF EXISTS transferts_id_entreprise_fkey;
ALTER TABLE commandes DROP CONSTRAINT IF EXISTS commandes_id_client_fkey;
ALTER TABLE commandes DROP CONSTRAINT IF EXISTS commandes_id_fournisseur_fkey;
ALTER TABLE commandes DROP CONSTRAINT IF EXISTS commandes_id_entreprise_fkey;
ALTER TABLE lignes_commande DROP CONSTRAINT IF EXISTS lignes_commande_id_commande_fkey;
ALTER TABLE lignes_commande DROP CONSTRAINT IF EXISTS lignes_commande_id_produit_fkey;
ALTER TABLE lignes_commande DROP CONSTRAINT IF EXISTS lignes_commande_id_entreprise_fkey;
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_id_commande_fkey;
ALTER TABLE factures DROP CONSTRAINT IF EXISTS factures_id_entreprise_fkey;
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_id_facture_fkey;
ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_id_entreprise_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_id_user_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_id_entreprise_fkey;

-- Supprimer les anciennes colonnes primary key
ALTER TABLE roles DROP COLUMN IF EXISTS id_role;
ALTER TABLE permissions DROP COLUMN IF EXISTS id_permission;
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS id_user;
ALTER TABLE categories DROP COLUMN IF EXISTS id_categorie;
ALTER TABLE produits DROP COLUMN IF EXISTS id_produit;
ALTER TABLE entrepots DROP COLUMN IF EXISTS id_entrepot;
ALTER TABLE stocks DROP COLUMN IF EXISTS id_stock;
ALTER TABLE fournisseurs DROP COLUMN IF EXISTS id_fournisseur;
ALTER TABLE clients DROP COLUMN IF EXISTS id_client;
ALTER TABLE mouvements_stock DROP COLUMN IF EXISTS id_mvt;
ALTER TABLE transferts DROP COLUMN IF EXISTS id_transfert;
ALTER TABLE commandes DROP COLUMN IF EXISTS id_commande;
ALTER TABLE lignes_commande DROP COLUMN IF EXISTS id_ligne;
ALTER TABLE factures DROP COLUMN IF EXISTS id_facture;
ALTER TABLE paiements DROP COLUMN IF EXISTS id_paiement;
ALTER TABLE notifications DROP COLUMN IF EXISTS id_notif;

-- Renommer les colonnes UUID
ALTER TABLE roles RENAME COLUMN id_role_uuid TO id_role;
ALTER TABLE permissions RENAME COLUMN id_permission_uuid TO id_permission;
ALTER TABLE utilisateurs RENAME COLUMN id_user_uuid TO id_user;
ALTER TABLE categories RENAME COLUMN id_categorie_uuid TO id_categorie;
ALTER TABLE produits RENAME COLUMN id_produit_uuid TO id_produit;
ALTER TABLE entrepots RENAME COLUMN id_entrepot_uuid TO id_entrepot;
ALTER TABLE stocks RENAME COLUMN id_stock_uuid TO id_stock;
ALTER TABLE fournisseurs RENAME COLUMN id_fournisseur_uuid TO id_fournisseur;
ALTER TABLE clients RENAME COLUMN id_client_uuid TO id_client;
ALTER TABLE mouvements_stock RENAME COLUMN id_mvt_uuid TO id_mvt;
ALTER TABLE transferts RENAME COLUMN id_transfert_uuid TO id_transfert;
ALTER TABLE commandes RENAME COLUMN id_commande_uuid TO id_commande;
ALTER TABLE lignes_commande RENAME COLUMN id_ligne_uuid TO id_ligne;
ALTER TABLE factures RENAME COLUMN id_facture_uuid TO id_facture;
ALTER TABLE paiements RENAME COLUMN id_paiement_uuid TO id_paiement;
ALTER TABLE notifications RENAME COLUMN id_notif_uuid TO id_notif;

-- Recréer les contraintes primary key
ALTER TABLE roles ADD PRIMARY KEY (id_role);
ALTER TABLE permissions ADD PRIMARY KEY (id_permission);
ALTER TABLE utilisateurs ADD PRIMARY KEY (id_user);
ALTER TABLE categories ADD PRIMARY KEY (id_categorie);
ALTER TABLE produits ADD PRIMARY KEY (id_produit);
ALTER TABLE entrepots ADD PRIMARY KEY (id_entrepot);
ALTER TABLE stocks ADD PRIMARY KEY (id_stock);
ALTER TABLE fournisseurs ADD PRIMARY KEY (id_fournisseur);
ALTER TABLE clients ADD PRIMARY KEY (id_client);
ALTER TABLE mouvements_stock ADD PRIMARY KEY (id_mvt);
ALTER TABLE transferts ADD PRIMARY KEY (id_transfert);
ALTER TABLE commandes ADD PRIMARY KEY (id_commande);
ALTER TABLE lignes_commande ADD PRIMARY KEY (id_ligne);
ALTER TABLE factures ADD PRIMARY KEY (id_facture);
ALTER TABLE paiements ADD PRIMARY KEY (id_paiement);
ALTER TABLE notifications ADD PRIMARY KEY (id_notif);

-- Recréer les contraintes foreign key
ALTER TABLE role_permission ADD CONSTRAINT role_permission_id_role_fkey FOREIGN KEY (id_role) REFERENCES roles(id_role) ON DELETE CASCADE;
ALTER TABLE role_permission ADD CONSTRAINT role_permission_id_permission_fkey FOREIGN KEY (id_permission) REFERENCES permissions(id_permission) ON DELETE CASCADE;
ALTER TABLE utilisateurs ADD CONSTRAINT utilisateurs_id_role_fkey FOREIGN KEY (id_role) REFERENCES roles(id_role) ON DELETE CASCADE;
ALTER TABLE utilisateurs ADD CONSTRAINT utilisateurs_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE categories ADD CONSTRAINT categories_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE produits ADD CONSTRAINT produits_id_categorie_fkey FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie);
ALTER TABLE produits ADD CONSTRAINT produits_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE entrepots ADD CONSTRAINT entrepots_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE stocks ADD CONSTRAINT stocks_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produits(id_produit);
ALTER TABLE stocks ADD CONSTRAINT stocks_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES entrepots(id_entrepot);
ALTER TABLE stocks ADD CONSTRAINT stocks_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE fournisseurs ADD CONSTRAINT fournisseurs_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE clients ADD CONSTRAINT clients_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE mouvements_stock ADD CONSTRAINT mouvements_stock_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produits(id_produit);
ALTER TABLE mouvements_stock ADD CONSTRAINT mouvements_stock_id_entrepot_fkey FOREIGN KEY (id_entrepot) REFERENCES entrepots(id_entrepot);
ALTER TABLE mouvements_stock ADD CONSTRAINT mouvements_stock_id_user_fkey FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user);
ALTER TABLE mouvements_stock ADD CONSTRAINT mouvements_stock_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE transferts ADD CONSTRAINT transferts_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produits(id_produit);
ALTER TABLE transferts ADD CONSTRAINT transferts_id_entrepot_source_fkey FOREIGN KEY (id_entrepot_source) REFERENCES entrepots(id_entrepot);
ALTER TABLE transferts ADD CONSTRAINT transferts_id_entrepot_dest_fkey FOREIGN KEY (id_entrepot_dest) REFERENCES entrepots(id_entrepot);
ALTER TABLE transferts ADD CONSTRAINT transferts_id_user_fkey FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user);
ALTER TABLE transferts ADD CONSTRAINT transferts_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE commandes ADD CONSTRAINT commandes_id_client_fkey FOREIGN KEY (id_client) REFERENCES clients(id_client);
ALTER TABLE commandes ADD CONSTRAINT commandes_id_fournisseur_fkey FOREIGN KEY (id_fournisseur) REFERENCES fournisseurs(id_fournisseur);
ALTER TABLE commandes ADD CONSTRAINT commandes_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE lignes_commande ADD CONSTRAINT lignes_commande_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES commandes(id_commande) ON DELETE CASCADE;
ALTER TABLE lignes_commande ADD CONSTRAINT lignes_commande_id_produit_fkey FOREIGN KEY (id_produit) REFERENCES produits(id_produit);
ALTER TABLE lignes_commande ADD CONSTRAINT lignes_commande_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE factures ADD CONSTRAINT factures_id_commande_fkey FOREIGN KEY (id_commande) REFERENCES commandes(id_commande);
ALTER TABLE factures ADD CONSTRAINT factures_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE paiements ADD CONSTRAINT paiements_id_facture_fkey FOREIGN KEY (id_facture) REFERENCES factures(id_facture);
ALTER TABLE paiements ADD CONSTRAINT paiements_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT notifications_id_user_fkey FOREIGN KEY (id_user) REFERENCES utilisateurs(id_user);
ALTER TABLE notifications ADD CONSTRAINT notifications_id_entreprise_fkey FOREIGN KEY (id_entreprise) REFERENCES entreprises(id_entreprise) ON DELETE CASCADE;
