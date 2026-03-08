import React from 'react';
import { useDevise } from '../hooks/useDevise.js';

// Exemple de composant qui utilise le hook useDevise
// Les autres pages peuvent suivre ce modèle pour afficher les montants automatiquement
// avec la devise configurée dans les paramètres

const ExempleUtilisationDevise = () => {
  const { devise, formatMontant, getSymboleDevise, loading } = useDevise();

  if (loading) {
    return <div>Chargement de la devise...</div>;
  }

  const produits = [
    { nom: 'Produit A', prix: 15000 },
    { nom: 'Produit B', prix: 25000 },
    { nom: 'Produit C', prix: 8500 },
  ];

  const total = produits.reduce((sum, produit) => sum + produit.prix, 0);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">
        Exemple d'utilisation de la devise ({devise})
      </h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Devise actuelle: <span className="font-bold">{devise}</span></p>
          <p>Symbole: <span className="font-bold">{getSymboleDevise()}</span></p>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Liste des produits:</h3>
          {produits.map((produit, index) => (
            <div key={index} className="flex justify-between py-2">
              <span>{produit.nom}</span>
              <span className="font-medium">{formatMontant(produit.prix)}</span>
            </div>
          ))}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{formatMontant(total)}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
          <p className="font-semibold mb-1">💡 Comment utiliser dans vos pages:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Importez le hook: <code className="bg-gray-100 px-1">import {`{ useDevise }`} from '../hooks/useDevise.js'</code></li>
            <li>Utilisez-le dans votre composant: <code className="bg-gray-100 px-1">const {`{ formatMontant }`} = useDevise();</code></li>
            <li>Affichez les montants: <code className="bg-gray-100 px-1">{`{formatMontant(prix)}`}</code></li>
          </ol>
          <p className="mt-2">Les montants se mettront automatiquement à jour quand la devise est changée dans les paramètres !</p>
        </div>
      </div>
    </div>
  );
};

export default ExempleUtilisationDevise;
