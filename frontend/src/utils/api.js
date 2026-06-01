const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          // Intelligently map and format FastAPI Pydantic list of validation errors
          errorMessage = data.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : '';
            // Capitalize field name for presentation
            const formattedField = field ? field.charAt(0).toUpperCase() + field.slice(1) : '';
            return `${formattedField ? formattedField + ': ' : ''}${err.msg}`;
          }).join('. ');
        } else {
          errorMessage = String(data.detail);
        }
      } else {
        errorMessage = data.message || JSON.stringify(data);
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) {
    return true;
  }
  return response.json();
}

export const api = {
  // Products
  getProducts: () => fetch(`${API_BASE_URL}/products`).then(handleResponse),
  getProduct: (id) => fetch(`${API_BASE_URL}/products/${id}`).then(handleResponse),
  createProduct: (product) => fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }).then(handleResponse),
  updateProduct: (id, product) => fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  }).then(handleResponse),
  deleteProduct: (id) => fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Customers
  getCustomers: () => fetch(`${API_BASE_URL}/customers`).then(handleResponse),
  getCustomer: (id) => fetch(`${API_BASE_URL}/customers/${id}`).then(handleResponse),
  createCustomer: (customer) => fetch(`${API_BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer)
  }).then(handleResponse),
  deleteCustomer: (id) => fetch(`${API_BASE_URL}/customers/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),

  // Orders
  getOrders: () => fetch(`${API_BASE_URL}/orders`).then(handleResponse),
  getSoldOrders: () => fetch(`${API_BASE_URL}/orders/history`).then(handleResponse),
  getOrder: (id) => fetch(`${API_BASE_URL}/orders/${id}`).then(handleResponse),
  createOrder: (order) => fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  }).then(handleResponse),
  deleteOrder: (id) => fetch(`${API_BASE_URL}/orders/${id}`, {
    method: 'DELETE'
  }).then(handleResponse),
  markOrderSold: (id) => fetch(`${API_BASE_URL}/orders/${id}/sold`, {
    method: 'PATCH'
  }).then(handleResponse),
  emailOrderDetails: (id) => fetch(`${API_BASE_URL}/orders/${id}/email`, {
    method: 'POST'
  }).then(handleResponse),

  // Dashboard
  getDashboardSummary: () => fetch(`${API_BASE_URL}/dashboard`).then(handleResponse),

  // Auth
  login: (credentials) => fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  }).then(handleResponse),

  verify2fa: (payload) => fetch(`${API_BASE_URL}/auth/verify-2fa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),

  register: (user) => fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  }).then(handleResponse)
};
