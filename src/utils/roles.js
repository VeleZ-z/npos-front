export const ROLES = {
  ADMIN: "Admin",
  CASHIER: "Cashier",
  WAITER: "Waiter",
  CUSTOMER: "Customer",
};

export const normalizeRole = (role) => {
  if (!role) return "";
  return String(role).toLowerCase();
};

export const isAdmin = (role) => normalizeRole(role) === "admin";

export const isCashier = (role) => normalizeRole(role) === "cashier";

export const isWaiter = (role) => normalizeRole(role) === "waiter";

export const isCustomer = (role) => normalizeRole(role) === "customer";

export const isStaff = (role) => {
  const r = normalizeRole(role);
  return r === "admin" || r === "cashier";
};

export const isStaffOrWaiter = (role) => {
  const r = normalizeRole(role);
  return r === "admin" || r === "cashier" || r === "waiter";
};

export const hasRole = (role, allowedRoles) => {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;
  const r = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(r);
};

export const getRoleLabel = (role) => {
  const r = normalizeRole(role);
  switch (r) {
    case "admin":
      return "Administrador";
    case "cashier":
      return "Cajero";
    case "waiter":
      return "Mesero";
    case "customer":
      return "Cliente";
    default:
      return role || "—";
  }
};