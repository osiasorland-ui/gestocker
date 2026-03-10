-- Ajouter la colonne id_entrepot à la table categories
ALTER TABLE categories ADD COLUMN id_entrepot UUID REFERENCES entrepots(id_entrepot);

-- Mettre à jour les catégories existantes pour leur assigner un entrepôt par défaut (optionnel)
UPDATE categories SET id_entrepot = NULL WHERE id_entrepot IS NULL;
