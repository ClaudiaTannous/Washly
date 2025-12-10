const API_BASE_URL = "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {};

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

// Create Worker (Signup)
export function createWorker(data) {
  return apiFetch(`/api/workers`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export function signupWorker(data) {
  return createWorker(data);
}

// Get Worker Profile
export function getWorker(workerId) {
  return apiFetch(`/api/workers/${workerId}`);
}

// Orders (today / upcoming / all depending on query)
export function getWorkerOrders(workerId) {
  return apiFetch(`/api/workers/${workerId}/orders`);
}

// Worker Order History
export function getWorkerOrderHistory(workerId) {
  return apiFetch(`/api/workers/${workerId}/orders/history`);
}

// Update Worker Profile
export function updateWorker(workerId, data) {
  return apiFetch(`/api/workers/${workerId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Update Worker Weekly Schedule
export function updateWorkerSchedule(workerId, rules) {
  return apiFetch(`/api/workers/${workerId}/schedule`, {
    method: "PUT",
    body: JSON.stringify(rules),
  });
}

// Set Online/Offline
export function setWorkerOnlineStatus(workerId, isOnline) {
  return apiFetch(`/api/workers/${workerId}/online`, {
    method: "PATCH",
    body: JSON.stringify({ is_online: isOnline }),
  });
}

// Upload Worker Avatar
export async function uploadWorkerAvatar(workerId, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  return apiFetch(`/api/workers/${workerId}/avatar`, {
    method: "POST",
    body: formData,
  });
}

// Catalog
export function getServiceCatalog() {
  return apiFetch(`/api/service-catalog`);
}

export function getServiceByCode(serviceCode) {
  return apiFetch(`/api/service-catalog/${serviceCode}`);
}

// CUSTOMER
export function getCustomer(userId) {
  return apiFetch(`/api/user/${userId}`);
}

export function getCustomerOrders(userId) {
  return apiFetch(`/api/user/${userId}/orders`);
}

// WORKER CHECK
export function checkIfUserIsWorker(userId) {
  return apiFetch(`/api/user/${userId}/is-worker`);
}
