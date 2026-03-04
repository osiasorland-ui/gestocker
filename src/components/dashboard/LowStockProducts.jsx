import React from "react";
import { Package } from "lucide-react";

const LowStockProducts = ({ products = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Produits en stock bas
      </h3>
      {products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                <p className="text-xs text-gray-500">{product.sku}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  product.stock <= product.threshold ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {product.stock} unités
                </p>
                <p className="text-xs text-gray-500">Seuil: {product.threshold}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // État vide
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-2">Aucun produit en stock bas</p>
          <p className="text-sm text-gray-400">
            Tous vos produits ont un stock suffisant
          </p>
        </div>
      )}
    </div>
  );
};

export default LowStockProducts;
