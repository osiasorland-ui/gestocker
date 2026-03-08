import React from "react";
import { Search, X } from "lucide-react";

const FiltragesUsers = ({
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  filterStatus,
  setFilterStatus,
  availableRoles,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par nom ou prénom..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          <label className="text-sm text-gray-600 mr-2">Rôle:</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Tous les rôles</option>
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.libelle}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="text-sm text-gray-600 mr-2">Statut:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
        <button
          onClick={() => {
            setFilterRole("");
            setFilterStatus("");
            setSearchTerm("");
          }}
          className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 mr-1" />
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default FiltragesUsers;
