import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Calendar,
  User,
} from "lucide-react";

function Mouvements() {
  const [mouvements, setMouvements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState("tous");
  const [dateFilter, setDateFilter] = useState("");
  const [formData, setFormData] = useState({
    id_produit: "",
    id_entrepot: "",
    type_mvt: "ENTREE",
    quantite: "",
    motif: "",
  });

  useEffect(() => {
    setMouvements([]);
  }, []);

  const filteredMouvements = mouvements.filter((mouvement) => {
    const matchesSearch =
      mouvement.produit_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mouvement.motif?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      filterType === "tous" || mouvement.type_mvt === filterType.toUpperCase();
    const matchesDate =
      !dateFilter ||
      new Date(mouvement.date_mvt).toISOString().split("T")[0] === dateFilter;

    return matchesSearch && matchesType && matchesDate;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMouvement = {
      id_mvt: `temp_${mouvements.length + 1}`,
      ref: mouvements.length + 1, // Numérotation automatique
      ...formData,
      quantite: parseInt(formData.quantite),
      date_mvt: new Date().toISOString(),
      produit_nom: "Produit sélectionné",
      entrepot_nom: "Entrepôt sélectionné",
      user_nom: "Utilisateur actuel",
    };
    setMouvements([newMouvement, ...mouvements]);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      id_produit: "",
      id_entrepot: "",
      type_mvt: "ENTREE",
      quantite: "",
      motif: "",
    });
    setShowAddModal(false);
  };

  const getTypeIcon = (type) => {
    return type === "ENTREE" ? (
      <ArrowDownLeft className="w-4 h-4 text-green-600" />
    ) : type === "SORTIE" ? (
      <ArrowUpRight className="w-4 h-4 text-red-600" />
    ) : (
      <Package className="w-4 h-4 text-blue-600" />
    );
  };

  const getTypeColor = (type) => {
    return type === "ENTREE"
      ? "text-green-600 bg-green-50"
      : type === "SORTIE"
        ? "text-red-600 bg-red-50"
        : "text-blue-600 bg-blue-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Mouvements de Stock
          </h1>
          <p className="text-gray-600">
            Suivez les entrées et sorties de produits
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau mouvement
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
          >
            <option value="tous">Tous les types</option>
            <option value="entree">Entrées</option>
            <option value="sortie">Sorties</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
          />

          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Filter className="w-4 h-4" />
            Plus de filtres
          </button>
        </div>
      </div>

      {/* Mouvements Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  REF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMouvements.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun mouvement trouvé</p>
                  </td>
                </tr>
              ) : (
                filteredMouvements.map((mouvement) => (
                  <tr key={mouvement.id_mvt} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{mouvement.ref}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">{mouvement.date}</div>
                        <div className="text-gray-500">{mouvement.heure}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(mouvement.type_mvt)}`}
                      >
                        {getTypeIcon(mouvement.type_mvt)}
                        {mouvement.type_mvt === "ENTREE"
                          ? "Entrée"
                          : mouvement.type_mvt === "SORTIE"
                            ? "Sortie"
                            : "Ajustement"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {mouvement.produit_nom}
                      </div>
                      <div className="text-sm text-gray-500">
                        {mouvement.id_mvt?.slice(0, 8) || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`text-sm font-medium ${
                          mouvement.type_mvt === "ENTREE"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {mouvement.type_mvt === "ENTREE" ? "+" : "-"}
                        {mouvement.quantite}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mouvement.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mouvement.motif || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {mouvement.id_mvt?.slice(0, 8) || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {mouvement.user_nom}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Movement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Nouveau Mouvement de Stock
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de mouvement *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="entree">Entrée de stock</option>
                    <option value="sortie">Sortie de stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit *
                  </label>
                  <select
                    required
                    value={formData.produit_id}
                    onChange={(e) =>
                      setFormData({ ...formData, produit_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un produit</option>
                    <option value="1">Ordinateur Portable (LP001)</option>
                    <option value="2">Clavier USB (KB001)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantite}
                    onChange={(e) =>
                      setFormData({ ...formData, quantite: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif *
                </label>
                <input
                  type="text"
                  required
                  value={formData.motif}
                  onChange={(e) =>
                    setFormData({ ...formData, motif: e.target.value })
                  }
                  placeholder="ex: Nouvelle livraison, Vente client"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              {formData.type === "entree" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fournisseur
                  </label>
                  <select
                    value={formData.fournisseur_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fournisseur_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un fournisseur</option>
                    <option value="1">TechSupplier</option>
                    <option value="2">GlobalComponents</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) =>
                      setFormData({ ...formData, client_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Sélectionner un client</option>
                    <option value="1">Jean Dupont</option>
                    <option value="2">Marie Martin</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Mouvements;
