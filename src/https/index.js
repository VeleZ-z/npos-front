import { axiosWrapper } from "./axiosWrapper";

// API Endpoints

// Auth Endpoints (Google One Tap only)
export const googleLogin = (credential, state) =>
  axiosWrapper.post("/api/user/google-login", { credential, state });

// Auth state for GIS (CSRF protection)
export const getAuthState = () => axiosWrapper.get("/api/auth/state");
export const getUserData = async () => axiosWrapper.get("/api/user");
export const getDocTypes = () => axiosWrapper.get('/api/user/doc-types');
export const updateProfile = (payload) => axiosWrapper.put('/api/user/profile', payload);
export const logout = () => axiosWrapper.post("/api/user/logout");

// Table Endpoints
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);



// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const getOrders = () => axiosWrapper.get("/api/order", { params: { guest: true } });
export const updateOrderStatus = ({ orderId, orderStatus, tableId }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus, tableId });
export const deleteOrder = (orderId) =>
  axiosWrapper.delete(`/api/order/${orderId}`);

// Invoice Endpoints
export const createInvoice = (data) => axiosWrapper.post("/api/invoice", data);
export const getInvoices = (params) => axiosWrapper.get("/api/invoice", { params });
export const getInvoice = (invoiceId) => axiosWrapper.get(`/api/invoice/${invoiceId}`);
export const getCustomerInvoices = (customerId) => axiosWrapper.get(`/api/invoice/customer/${customerId}`);
export const cancelInvoice = (invoiceId) => axiosWrapper.patch(`/api/invoice/${invoiceId}/cancel`);
export const getOrderById = (orderId) => axiosWrapper.get(`/api/order/${orderId}`);
// Sales endpoints
export const getOrderByTable = (mesaId) => axiosWrapper.get(`/api/order/table/${mesaId}`);
export const addItemToTable = (mesaId, payload) =>
  axiosWrapper.post(`/api/order/table/${mesaId}/item`, payload);
export const getOrderItems = (orderId) => axiosWrapper.get(`/api/order/${orderId}/items`);
export const updateOrderItem = (orderId, itemId, payload) => axiosWrapper.put(`/api/order/${orderId}/item/${itemId}`, payload);
export const deleteOrderItem = (orderId, itemId) => axiosWrapper.delete(`/api/order/${orderId}/item/${itemId}`);
export const moveOrderItem = (orderId, itemId, mesaId) => axiosWrapper.post(`/api/order/${orderId}/item/${itemId}/move`, { mesaId });
export const setOrderCustomer = (orderId, payload) => axiosWrapper.put(`/api/order/${orderId}/customer`, payload);
export const markOrderItemsPrinted = (orderId, items) => axiosWrapper.post(`/api/order/${orderId}/printed`, { items });

// Category Endpoints
export const addCategory = (data) => axiosWrapper.post("/api/category", data);
export const getCategories = () => axiosWrapper.get("/api/category", { params: { guest: true } });
export const updateCategory = (id, data) => axiosWrapper.put(`/api/category/${id}`, data);
export const deleteCategory = (id) => axiosWrapper.delete(`/api/category/${id}`);

// Product Endpoints
export const addProduct = (data) => axiosWrapper.post("/api/product", data);
export const getProducts = () => axiosWrapper.get("/api/product", { params: { guest: true } });
export const updateProduct = (id, data) => axiosWrapper.put(`/api/product/${id}`, data);
export const deleteProduct = (id) => axiosWrapper.delete(`/api/product/${id}`);
export const updateProductStockState = (id, data) =>
  axiosWrapper.patch(`/api/product/${id}/stock-state`, data);
export const uploadProductImage = (id, file) => {
  const form = new FormData();
  form.append('image', file);
  return axiosWrapper.post(`/api/product/${id}/image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export const getTaxes = () => axiosWrapper.get('/api/tax');

// States (estados)
export const getStates = (type) => axiosWrapper.get('/api/state', { params: { type } });
// Discounts
export const getDiscounts = () => axiosWrapper.get('/api/discount');
export const getAdminDiscounts = () => axiosWrapper.get('/api/discount/admin');
export const createDiscountAdmin = (formData) =>
  axiosWrapper.post('/api/discount', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateDiscountAdmin = (id, formData) =>
  axiosWrapper.put(`/api/discount/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const resendDiscount = (id) =>
  axiosWrapper.post(`/api/discount/${id}/resend`);

// Providers Endpoints
export const getProviders = () => axiosWrapper.get('/api/provider');
export const getProvider = (id) => axiosWrapper.get(`/api/provider/${id}`);
export const addProvider = (data) => axiosWrapper.post('/api/provider', data);
export const updateProvider = (id, data) => axiosWrapper.put(`/api/provider/${id}`, data);
export const deleteProvider = (id) => axiosWrapper.delete(`/api/provider/${id}`);

// Purchases Endpoints
export const getPurchases = () => axiosWrapper.get('/api/purchase');
export const addPurchase = (data) => axiosWrapper.post('/api/purchase', data);
export const updatePurchase = (id, data) => axiosWrapper.put(`/api/purchase/${id}`, data);
export const deletePurchase = (id) => axiosWrapper.delete(`/api/purchase/${id}`);
export const updatePurchaseStock = (id, quantity) => axiosWrapper.put(`/api/purchase/${id}/stock`, { quantity });

// Alerts Endpoints
export const getMyAlerts = () => axiosWrapper.get('/api/alert');
export const ackMyAlert = (id) => axiosWrapper.post(`/api/alert/${id}/ack`);


// Admin users
export const getUsers = () => axiosWrapper.get('/api/user/all');
export const updateUser = (id, payload) => axiosWrapper.put(`/api/user/${id}`, payload);
export const setUserRole = (id, role) => axiosWrapper.put(`/api/user/${id}/role`, { role });
export const getRoles = () => axiosWrapper.get('/api/user/roles');
export const searchUsers = (params) => axiosWrapper.get('/api/user/search', { params });

// Payment Methods
export const getPayMethods = () => axiosWrapper.get('/api/paymethod');
export const addPayMethod = (data) => axiosWrapper.post('/api/paymethod', data);
export const updatePayMethod = (id, data) => axiosWrapper.put(`/api/paymethod/${id}`, data);
export const deletePayMethod = (id) => axiosWrapper.delete(`/api/paymethod/${id}`);
export const setPayMethodEstado = (id, estado_id) => axiosWrapper.put(`/api/paymethod/${id}/estado`, { estado_id });

// Stats
export const getPopularProductsStats = (params) =>
  axiosWrapper.get('/api/stats/popular-products', { params });
export const getTodayStats = () => axiosWrapper.get('/api/stats/today');

// Cash Desk
export const getCurrentCashDesk = () => axiosWrapper.get('/api/cash-desk/current');
export const openCashDesk = (payload) => axiosWrapper.post('/api/cash-desk/open', payload);
export const closeCashDesk = (payload) => axiosWrapper.post('/api/cash-desk/close', payload);
export const getCashDeskMovements = (params) =>
  axiosWrapper.get('/api/cash-desk/movements', { params });
export const exportCashDeskMovements = (params) =>
  axiosWrapper.get('/api/cash-desk/export', { params, responseType: 'blob' });
