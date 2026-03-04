import React from "react";
import { TrendingUp } from "lucide-react";

const RecentActivities = ({ activities = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Activités récentes
      </h3>
      {activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className={`w-2 h-2 rounded-full ${
                  activity.priority === 'high' ? 'bg-gray-800' :
                  activity.priority === 'medium' ? 'bg-gray-600' : 'bg-gray-400'
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // État vide
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">Aucune activité récente</p>
          <p className="text-sm text-gray-400">
            Commencez par ajouter des produits ou des commandes
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivities;
