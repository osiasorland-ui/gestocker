-- ==========================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Activer RLS sur toutes les tables
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE entrepots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mouvements_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table entreprises
DROP POLICY IF EXISTS "entreprises_select_policy" ON entreprises;
CREATE POLICY "entreprises_select_policy" ON entreprises
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "entreprises_insert_policy" ON entreprises;
CREATE POLICY "entreprises_insert_policy" ON entreprises
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "entreprises_update_policy" ON entreprises;
CREATE POLICY "entreprises_update_policy" ON entreprises
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "entreprises_delete_policy" ON entreprises;
CREATE POLICY "entreprises_delete_policy" ON entreprises
    FOR DELETE USING (true);

-- Politiques pour la table utilisateurs
DROP POLICY IF EXISTS "utilisateurs_select_policy" ON utilisateurs;
CREATE POLICY "utilisateurs_select_policy" ON utilisateurs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "utilisateurs_insert_policy" ON utilisateurs;
CREATE POLICY "utilisateurs_insert_policy" ON utilisateurs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "utilisateurs_update_policy" ON utilisateurs;
CREATE POLICY "utilisateurs_update_policy" ON utilisateurs
    FOR UPDATE USING (true);

-- Politiques pour la table roles
DROP POLICY IF EXISTS "roles_select_policy" ON roles;
CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "roles_insert_policy" ON roles;
CREATE POLICY "roles_insert_policy" ON roles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "roles_update_policy" ON roles;
CREATE POLICY "roles_update_policy" ON roles
    FOR UPDATE USING (true);

-- Politiques pour la table permissions
DROP POLICY IF EXISTS "permissions_select_policy" ON permissions;
CREATE POLICY "permissions_select_policy" ON permissions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "permissions_insert_policy" ON permissions;
CREATE POLICY "permissions_insert_policy" ON permissions
    FOR INSERT WITH CHECK (true);

-- Politiques pour les autres tables (accès basique pour commencer)
-- Vous pouvez affiner ces politiques plus tard selon vos besoins

-- Categories
DROP POLICY IF EXISTS "categories_all_policy" ON categories;
CREATE POLICY "categories_all_policy" ON categories
    FOR ALL USING (true);

-- Produits
DROP POLICY IF EXISTS "produits_all_policy" ON produits;
CREATE POLICY "produits_all_policy" ON produits
    FOR ALL USING (true);

-- Entrepots
DROP POLICY IF EXISTS "entrepots_all_policy" ON entrepots;
CREATE POLICY "entrepots_all_policy" ON entrepots
    FOR ALL USING (true);

-- Stocks
DROP POLICY IF EXISTS "stocks_all_policy" ON stocks;
CREATE POLICY "stocks_all_policy" ON stocks
    FOR ALL USING (true);

-- Fournisseurs
DROP POLICY IF EXISTS "fournisseurs_all_policy" ON fournisseurs;
CREATE POLICY "fournisseurs_all_policy" ON fournisseurs
    FOR ALL USING (true);

-- Clients
DROP POLICY IF EXISTS "clients_all_policy" ON clients;
CREATE POLICY "clients_all_policy" ON clients
    FOR ALL USING (true);

-- Mouvements de stock
DROP POLICY IF EXISTS "mouvements_stock_all_policy" ON mouvements_stock;
CREATE POLICY "mouvements_stock_all_policy" ON mouvements_stock
    FOR ALL USING (true);

-- Transferts
DROP POLICY IF EXISTS "transferts_all_policy" ON transferts;
CREATE POLICY "transferts_all_policy" ON transferts
    FOR ALL USING (true);

-- Commandes
DROP POLICY IF EXISTS "commandes_all_policy" ON commandes;
CREATE POLICY "commandes_all_policy" ON commandes
    FOR ALL USING (true);

-- Lignes de commande
DROP POLICY IF EXISTS "lignes_commande_all_policy" ON lignes_commande;
CREATE POLICY "lignes_commande_all_policy" ON lignes_commande
    FOR ALL USING (true);

-- Factures
DROP POLICY IF EXISTS "factures_all_policy" ON factures;
CREATE POLICY "factures_all_policy" ON factures
    FOR ALL USING (true);

-- Paiements
DROP POLICY IF EXISTS "paiements_all_policy" ON paiements;
CREATE POLICY "paiements_all_policy" ON paiements
    FOR ALL USING (true);

-- Notifications
DROP POLICY IF EXISTS "notifications_all_policy" ON notifications;
CREATE POLICY "notifications_all_policy" ON notifications
    FOR ALL USING (true);

-- Role_permission
DROP POLICY IF EXISTS "role_permission_all_policy" ON role_permission;
CREATE POLICY "role_permission_all_policy" ON role_permission
    FOR ALL USING (true);
