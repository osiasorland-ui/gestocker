// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Configuration des headers par défaut
const getHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return {
    'Content-Type': 'application/json',
    ...(user?.token && { Authorization: `Bearer ${user.token}` })
  };
};

// Fonction utilitaire pour les requêtes API
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: getHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Services d'authentification
export const authService = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (userData) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
};

// Services pour les utilisateurs
export const userService = {
  getAll: async () => {
    return apiRequest('/users');
  },

  getById: async (id) => {
    return apiRequest(`/users/${id}`);
  },

  create: async (userData) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id, userData) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};

// Services pour les produits
export const productService = {
  getAll: async () => {
    return apiRequest('/products');
  },

  getById: async (id) => {
    return apiRequest(`/products/${id}`);
  },

  create: async (productData) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  update: async (id, productData) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  getStock: async (id) => {
    return apiRequest(`/products/${id}/stock`);
  },

  updateStock: async (id, stockData) => {
    return apiRequest(`/products/${id}/stock`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  }
};

// Services pour les commandes
export const orderService = {
  getAll: async () => {
    return apiRequest('/orders');
  },

  getById: async (id) => {
    return apiRequest(`/orders/${id}`);
  },

  create: async (orderData) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  update: async (id, orderData) => {
    return apiRequest(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/orders/${id}`, {
      method: 'DELETE',
    });
  }
};

// Services pour les clients
export const clientService = {
  getAll: async () => {
    return apiRequest('/clients');
  },

  getById: async (id) => {
    return apiRequest(`/clients/${id}`);
  },

  create: async (clientData) => {
    return apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  update: async (id, clientData) => {
    return apiRequest(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/clients/${id}`, {
      method: 'DELETE',
    });
  }
};

// Services pour les fournisseurs
export const supplierService = {
  getAll: async () => {
    return apiRequest('/suppliers');
  },

  getById: async (id) => {
    return apiRequest(`/suppliers/${id}`);
  },

  create: async (supplierData) => {
    return apiRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData),
    });
  },

  update: async (id, supplierData) => {
    return apiRequest(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }
};

// Services pour les catégories
export const categoryService = {
  getAll: async () => {
    return apiRequest('/categories');
  },

  getById: async (id) => {
    return apiRequest(`/categories/${id}`);
  },

  create: async (categoryData) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id, categoryData) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  }
};

// Services pour les entrepôts
export const warehouseService = {
  getAll: async () => {
    return apiRequest('/warehouses');
  },

  getById: async (id) => {
    return apiRequest(`/warehouses/${id}`);
  },

  create: async (warehouseData) => {
    return apiRequest('/warehouses', {
      method: 'POST',
      body: JSON.stringify(warehouseData),
    });
  },

  update: async (id, warehouseData) => {
    return apiRequest(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(warehouseData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/warehouses/${id}`, {
      method: 'DELETE',
    });
  }
};

// Services pour les mouvements de stock
export const stockMovementService = {
  getAll: async () => {
    return apiRequest('/stock-movements');
  },

  getById: async (id) => {
    return apiRequest(`/stock-movements/${id}`);
  },

  create: async (movementData) => {
    return apiRequest('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(movementData),
    });
  },

  getByProduct: async (productId) => {
    return apiRequest(`/stock-movements/product/${productId}`);
  },

  getByWarehouse: async (warehouseId) => {
    return apiRequest(`/stock-movements/warehouse/${warehouseId}`);
  }
};

// Export par défaut
export default {
  authService,
  userService,
  productService,
  orderService,
  clientService,
  supplierService,
  categoryService,
  warehouseService,
  stockMovementService
};
