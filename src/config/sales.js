import { supabase } from "./auth.js";

// Fonctions pour la gestion des ventes et statistiques
export const sales = {
  // Obtenir les statistiques de ventes mensuelles
  getMonthlyStats: async (entrepriseId, months = 6) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);

      const { data, error } = await supabase
        .from("mouvements_stock")
        .select(
          `
          date_mvt,
          quantite,
          produits!inner(
            id_produit,
            designation,
            prix_unitaire
          )
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .eq("type_mvt", "SORTIE")
        .gte("date_mvt", startDate.toISOString())
        .lte("date_mvt", endDate.toISOString())
        .order("date_mvt", { ascending: true });

      if (error) return { data: [], error };

      // Grouper par mois
      const monthlyData = [];
      const monthNames = [];

      for (let i = months - 1; i >= 0; i--) {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - i);

        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        const monthEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        );

        const monthSales = (data || []).filter((item) => {
          const itemDate = new Date(item.date_mvt);
          return itemDate >= monthStart && itemDate <= monthEnd;
        });

        const totalSales = monthSales.reduce((sum, sale) => {
          return sum + sale.quantite * (sale.produits?.prix_unitaire || 0);
        }, 0);

        const monthName = currentDate.toLocaleDateString("fr-FR", {
          month: "short",
        });
        monthNames.push(monthName);
        monthlyData.push(Math.round(totalSales));
      }

      return { data: monthlyData, labels: monthNames, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Obtenir la tendance de croissance
  getGrowthTrend: async (entrepriseId, months = 6) => {
    try {
      const { data, error } = await supabase
        .from("mouvements_stock")
        .select(
          `
          date_mvt,
          quantite,
          produits!inner(
            id_produit,
            designation,
            prix_unitaire
          )
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .eq("type_mvt", "SORTIE")
        .order("date_mvt", { ascending: true });

      if (error) return { data: [], error };

      // Grouper par mois et calculer les totaux
      const monthlyTotals = [];

      for (let i = months - 1; i >= 0; i--) {
        const currentDate = new Date();
        currentDate.setMonth(currentDate.getMonth() - i);

        const monthStart = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        const monthEnd = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        );

        const monthSales = (data || []).filter((item) => {
          const itemDate = new Date(item.date_mvt);
          return itemDate >= monthStart && itemDate <= monthEnd;
        });

        const totalValue = monthSales.reduce((sum, sale) => {
          return sum + sale.quantite * (sale.produits?.prix_unitaire || 0);
        }, 0);

        monthlyTotals.push(totalValue);
      }

      return { data: monthlyTotals, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },

  // Obtenir les ventes par catégorie
  getSalesByCategory: async (entrepriseId) => {
    try {
      const { data, error } = await supabase
        .from("mouvements_stock")
        .select(
          `
          quantite,
          produits!inner(
            id_categorie,
            designation,
            categories!inner(
              nom_categorie
            )
          )
        `,
        )
        .eq("id_entreprise", entrepriseId)
        .eq("type_mvt", "SORTIE");

      if (error) return { data: [], error };

      // Grouper par catégorie
      const categorySales = {};

      (data || []).forEach((sale) => {
        const categoryName =
          sale.produits?.categories?.nom_categorie || "Non catégorisé";
        const value = sale.quantite * (sale.produits?.prix_unitaire || 0);

        if (!categorySales[categoryName]) {
          categorySales[categoryName] = 0;
        }
        categorySales[categoryName] += value;
      });

      // Transformer en format pour le graphique
      const chartData = Object.entries(categorySales).map(([name, value]) => ({
        name,
        value: Math.round(value),
      }));

      return { data: chartData, error: null };
    } catch (error) {
      return { data: [], error: error.message };
    }
  },
};
