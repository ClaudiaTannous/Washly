const API_BASE_URL = "http://localhost:5000";

// Universal fetch wrapper
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {};

  // Only set content-type if body is JSON
  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const finalOptions = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    body: options.body,
    credentials: "include", // 🔥 NECESSARY FOR COOKIE JWT AUTH
  };

  const res = await fetch(url, finalOptions);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error (${res.status}): ${text}`);
  }

  try {
    return await res.json();
  } catch {
    return {};
  }
}

/* -----------------------------------------------------
   AUTH
----------------------------------------------------- */

export function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return apiFetch("/auth/me", { method: "GET" });
}

export function logout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

/* -----------------------------------------------------
   WORKERS
----------------------------------------------------- */

export function createWorker(data) {
  return apiFetch(`/api/workers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getWorker(workerId) {
  return apiFetch(`/api/workers/${workerId}`);
}

export function getWorkerOrders(workerId) {
  return apiFetch(`/api/workers/${workerId}/orders`);
}

export function getWorkerOrderHistory(workerId) {
  return apiFetch(`/api/workers/${workerId}/orders/history`);
}

export function updateWorker(workerId, data) {
  return apiFetch(`/api/workers/${workerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateWorkerSchedule(workerId, rules) {
  return apiFetch(`/api/workers/${workerId}/schedule`, {
    method: "PUT",
    body: JSON.stringify(rules),
  });
}

export function setWorkerOnlineStatus(workerId, isOnline) {
  return apiFetch(`/api/workers/${workerId}/online`, {
    method: "PATCH",
    body: JSON.stringify({ is_online: isOnline }),
  });
}

export function uploadWorkerAvatar(workerId, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiFetch(`/api/workers/${workerId}/avatar`, {
    method: "POST",
    body: formData,
  });
}

/* -----------------------------------------------------
   CATALOG
----------------------------------------------------- */

export function getServiceCatalog() {
  return apiFetch(`/api/service-catalog`);
}

export function getServiceByCode(code) {
  return apiFetch(`/api/service-catalog/${code}`);
}

/* -----------------------------------------------------
   CUSTOMER
----------------------------------------------------- */

export function getCustomer(userId) {
  return apiFetch(`/api/user/${userId}`);
}

export function getCustomerOrders(userId) {
  return apiFetch(`/api/user/${userId}/orders`);
}

export function checkIfUserIsWorker(userId) {
  return apiFetch(`/api/user/${userId}/is-worker`);
}
