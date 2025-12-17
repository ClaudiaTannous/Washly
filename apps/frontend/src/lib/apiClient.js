"use client"; // IMPORTANT: apiClient must run on the client side

const API_BASE_URL = "http://localhost:5000";

/* -----------------------------------------------------
   UNIVERSAL API WRAPPER
----------------------------------------------------- */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const defaultHeaders = {};

  // Only add JSON header if body is JSON, not FormData
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
    credentials: "include", // Required for cookie-based JWT
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
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return apiFetch("/api/auth/me", { method: "GET" });
}

export function logout() {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

/* -----------------------------------------------------
   WORKERS
----------------------------------------------------- */

export async function createWorker(payload) {
  return apiFetch("/api/workers", {
    method: "POST",
    body: JSON.stringify(payload),
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
   SERVICE CATALOG
----------------------------------------------------- */

export function getServiceCatalog() {
  return apiFetch(`/api/services`);
}

export function getServiceByCode(code) {
  return apiFetch(`/api/services/${code}`);
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
export function addWorkerBusinessHoursBulk(workerId, hours) {
  return apiFetch(`/api/workers/${workerId}/hours/bulk`, {
    method: "POST",
    body: JSON.stringify(hours),
  });
}

export function createRating({ orderId, raterId, workerId, score, comment }) {
  return apiFetch("/api/ratings", {
    method: "POST",
    body: JSON.stringify({
      orderId,
      raterId,
      workerId,
      score,
      comment,
    }),
  });
}

/**
 * Get rating by order ID
 * Used to check if an order was already rated
 */
export function getRatingByOrder(orderId) {
  return apiFetch(`/api/ratings/order/${orderId}`, {
    method: "GET",
  });
}

/**
 * Get all ratings for a worker
 * Used for WorkerDashboard → RatingSection
 */
export function getWorkerRatings(workerId) {
  return apiFetch(`/api/ratings/worker/${workerId}`, {
    method: "GET",
  });
}

/**
 * Delete a rating (admin / moderation / user action)
 */
export function deleteRating(ratingId) {
  return apiFetch(`/api/ratings/${ratingId}`, {
    method: "DELETE",
  });
}

// Get or create conversation
export function getAIConversation(workerId) {
  return apiFetch(`/api/ai/worker/${workerId}`);
}

// Send message to AI
export function sendAIMessage(conversationId, text) {
  return apiFetch(`/api/ai/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: text }),
  });
}
/* -----------------------------------------------------
   WORKER SERVICES
----------------------------------------------------- */

export function getWorkerServices(workerId) {
  return apiFetch(`/api/workers/${workerId}/services`);
}

/* -----------------------------------------------------
   WORKER BUSINESS HOURS
----------------------------------------------------- */

export function getWorkerBusinessHours(workerId) {
  return apiFetch(`/api/workers/${workerId}/hours`);
}
