import apiClient, { unwrap } from './apiClient.js'
import { CLIENT_ENDPOINTS } from '../utils/constants.js'
import { dashboardApi } from './dashboard.js'

/**
 * Client Company Portal API service.
 *
 * Reuses existing feature services (invoice, ai, reports, dashboard)
 * for company-scoped data, and talks to the dedicated company-scoped
 * `/client/*` backend endpoints for employees, roles, settings and
 * user — the client never sends a company_id.
 */
export const clientApi = {
  // ── Client context ─────────────────────────────────────────
  getMe: () => apiClient.get(CLIENT_ENDPOINTS.me).then(unwrap),

  // ── Dashboard (reused) ──────────────────────────────────────
  getExecutiveSummary: () => dashboardApi.getExecutiveSummary(),
  getActivityFeed: (limit) => dashboardApi.getActivityFeed(limit),

  // ── Employees (company-scoped /client/*) ────────────────────
  listEmployees: (params) =>
    apiClient.get(CLIENT_ENDPOINTS.employees, { params }).then(unwrap),
  getEmployee: (id) => apiClient.get(CLIENT_ENDPOINTS.employee(id)).then(unwrap),
  createEmployee: (payload) =>
    apiClient.post(CLIENT_ENDPOINTS.employees, payload).then(unwrap),
  updateEmployee: (id, payload) =>
    apiClient.patch(CLIENT_ENDPOINTS.employee(id), payload).then(unwrap),
  deactivateEmployee: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.employeeDeactivate(id)).then(unwrap),
  activateEmployee: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.employeeActivate(id)).then(unwrap),
  resendEmployeeInvitation: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.employeeResendInvitation(id)).then(unwrap),

  // ── Customers (company-scoped /client/*) ─────────────────────
  // NOTE: backend `customers` app does not exist yet — these call a
  // `/client/customers/` contract that mirrors the employees endpoints
  // below. Wire up the Django app + serializer to match this shape.
  listCustomers: (params) =>
    apiClient.get(CLIENT_ENDPOINTS.customers, { params }).then(unwrap),
  getCustomer: (id) => apiClient.get(CLIENT_ENDPOINTS.customer(id)).then(unwrap),
  createCustomer: (payload) =>
    apiClient.post(CLIENT_ENDPOINTS.customers, payload).then(unwrap),
  updateCustomer: (id, payload) =>
    apiClient.patch(CLIENT_ENDPOINTS.customer(id), payload).then(unwrap),
    activateCustomer: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.customerActivate(id)).then(unwrap),
  deactivateCustomer: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.customerDeactivate(id)).then(unwrap),
  deleteCustomer: (id) =>
    apiClient.delete(CLIENT_ENDPOINTS.customer(id)).then(unwrap),
  getNextCustomerId: () => apiClient.get(CLIENT_ENDPOINTS.customersNextId).then(unwrap),

  // ── Vendors (company-scoped /client/*) ─────────────────────
  listVendors: (params) =>
    apiClient.get(CLIENT_ENDPOINTS.vendors, { params }).then(unwrap),
  getVendor: (id) => apiClient.get(CLIENT_ENDPOINTS.vendor(id)).then(unwrap),
  createVendor: (payload) =>
    apiClient.post(CLIENT_ENDPOINTS.vendors, payload).then(unwrap),
  updateVendor: (id, payload) =>
    apiClient.patch(CLIENT_ENDPOINTS.vendor(id), payload).then(unwrap),
   getNextVendorId: () => apiClient.get(CLIENT_ENDPOINTS.vendorsNextId).then(unwrap),
   activateVendor: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.vendorActivate(id)).then(unwrap),
  deactivateVendor: (id) =>
    apiClient.post(CLIENT_ENDPOINTS.vendorDeactivate(id)).then(unwrap),
  deleteVendor: (id) =>
    apiClient.delete(CLIENT_ENDPOINTS.vendor(id)).then(unwrap),

  // ── Partners (company-scoped /client/*) ─────────────────────
listPartners: (params) =>
  apiClient.get(CLIENT_ENDPOINTS.partners, { params }).then(unwrap),

getPartner: (id) =>
  apiClient.get(CLIENT_ENDPOINTS.partner(id)).then(unwrap),

createPartner: (payload) =>
  apiClient.post(CLIENT_ENDPOINTS.partners, payload).then(unwrap),

updatePartner: (id, payload) =>
  apiClient.patch(CLIENT_ENDPOINTS.partner(id), payload).then(unwrap),

activatePartner: (id) =>
  apiClient.post(CLIENT_ENDPOINTS.partnerActivate(id)).then(unwrap),

deactivatePartner: (id) =>
  apiClient.post(CLIENT_ENDPOINTS.partnerDeactivate(id)).then(unwrap),

deletePartner: (id) =>
  apiClient.delete(CLIENT_ENDPOINTS.partner(id)).then(unwrap),

getNextPartnerId: () => apiClient.get(CLIENT_ENDPOINTS.partnersNextId).then(unwrap),

  // ── Roles (company-scoped) ──────────────────────────────────
  listRoles: () => apiClient.get(CLIENT_ENDPOINTS.roles).then(unwrap),

  // ── Company settings (company-scoped) ───────────────────────
  getCompanySettings: () => apiClient.get(CLIENT_ENDPOINTS.settings).then(unwrap),
  updateCompanySettings: (payload) =>
    apiClient.patch(CLIENT_ENDPOINTS.settings, payload).then(unwrap),

  // ── Transaction navigation (DB-driven) ─────────────────────
  getNavigationMenu: () =>
    apiClient.get('/navigation/menu/').then(unwrap),
  
  createNavigationTab: (payload) =>
    apiClient.post('/navigation/customize/tab/', payload).then(unwrap),
  
  updateNavigationTab: (tabLevel, tabId, payload) =>
    apiClient.patch(`/navigation/customize/tab/${tabLevel}/${tabId}/`, payload).then(unwrap),

  getCenterTabs: (page = 1) =>
    apiClient.get('/navigation/center-tabs/', {
      params: { page },
    }).then(unwrap),

  getCenterTabChildren: (tabId) =>
    apiClient.get(`/navigation/center-tabs/${tabId}/children/`).then(unwrap),

  getCenterCategories: (page = 1) =>
  apiClient
    .get('/navigation/center-categories/', {
      params: { page },
    })
    .then(unwrap),

  createCenterCategory: (payload) =>
    apiClient
      .post('/navigation/center-categories/', payload)
      .then(unwrap),

  getCenterCategoryChildren: (categoryId) =>
    apiClient
      .get(`/navigation/center-categories/${categoryId}/children/`)
      .then(unwrap),

  deleteCenterTabs: (ids) =>
    apiClient
      .post('/navigation/center-tabs/bulk-delete/', { ids })
      .then(unwrap),

  deleteCenterCategories: (ids) =>
    apiClient
      .post('/navigation/center-categories/bulk-delete/', { ids })
      .then(unwrap),

  deleteNavigationTab: (tabLevel, tabId) =>
    apiClient.delete(`/navigation/customize/tab/${tabLevel}/${tabId}/`).then(unwrap),
    
  getTransactions: (params) =>
    apiClient.get('/transactions/', { params }).then(unwrap),

  createTransaction: ({ transactionType, recordType, payload }) =>
    apiClient.post('/transactions/', payload, {
      params: {
        transaction_type: transactionType,
        record_type: recordType,
      },
    }).then(unwrap),

}
