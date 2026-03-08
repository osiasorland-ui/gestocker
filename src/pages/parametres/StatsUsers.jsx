import React from "react";
import { Users, Check, X } from "lucide-react";

const StatsUsers = ({ totalUsers, activeUsers, inactiveUsers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="shrink-0">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-600">
              Total Utilisateurs
            </h3>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="shrink-0">
            <div className="p-3 bg-green-100 rounded-full">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-600">
              Utilisateurs Actifs
            </h3>
            <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="shrink-0">
            <div className="p-3 bg-red-100 rounded-full">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-600">
              Utilisateurs Inactifs
            </h3>
            <p className="text-2xl font-bold text-gray-900">{inactiveUsers}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsUsers;
