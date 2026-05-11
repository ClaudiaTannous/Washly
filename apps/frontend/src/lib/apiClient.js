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

export function getWorkerOrders(workerId) {
  return apiFetch(`/api/orders/worker/${workerId}`);
}

export function getWorkerOrderHistory(workerId) {
  return apiFetch(`/api/workers/${workerId}/orders/history`);
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

export async function getServiceCatalog() {
  const res = await apiFetch(`/api/services`);
  return res.data ?? res;
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

export async function updateUser(userId, data) {
  const res = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // IMPORTANT (JWT cookie)
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update user");
  }

  return res.json();
}

/* -----------------------------------------------------
   NOTIFICATIONS
----------------------------------------------------- */

export function getUserNotifications(userId) {
  return apiFetch(`/api/notifications/user/${userId}`, {
    method: "GET",
  });
}

export function markNotificationAsRead(notificationId) {
  return apiFetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsAsRead(userId) {
  return apiFetch(`/api/notifications/user/${userId}/read-all`, {
    method: "PATCH",
  });
}

/* -----------------------------------------------------
   WORKER BUSINESS HOURS
----------------------------------------------------- */

export function addWorkerBusinessHoursBulk(workerId, hours) {
  return apiFetch(`/api/workers/${workerId}/hours/bulk`, {
    method: "POST",
    body: JSON.stringify(hours),
  });
}

export function getWorkerBusinessHours(workerId) {
  return apiFetch(`/api/workers/${workerId}/hours`);
}

export function updateWorkerBusinessHours(
  workerId,
  { day_of_week, start_hhmm },
  { new_start_hhmm, new_end_hhmm },
) {
  const query = new URLSearchParams({
    day_of_week,
    start_hhmm,
  }).toString();

  return apiFetch(`/api/workers/${workerId}/hours?${query}`, {
    method: "PATCH",
    body: JSON.stringify({
      new_start_hhmm,
      new_end_hhmm,
    }),
  });
}

export function addWorkerBusinessHours(workerId, hour) {
  // hour = { day_of_week, start_hhmm, end_hhmm }
  return apiFetch(`/api/workers/${workerId}/hours`, {
    method: "POST",
    body: JSON.stringify(hour),
  });
}

/* -----------------------------------------------------
   RATINGS
----------------------------------------------------- */

export function createRating({ orderId, score, comment }) {
  return apiFetch("/api/ratings", {
    method: "POST",
    body: JSON.stringify({
      orderId,
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

/* -----------------------------------------------------
   AI ASSISTANT
----------------------------------------------------- */

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
   WORKER SERVICES (CRUD)
----------------------------------------------------- */

// CREATE
export function createWorkerService(workerId, payload) {
  return apiFetch(`/api/workers/${workerId}/services`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// UPDATE
export function updateWorkerService(workerId, serviceCode, payload) {
  return apiFetch(`/api/workers/${workerId}/services/${serviceCode}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// DELETE
export function deleteWorkerService(workerId, serviceCode) {
  return apiFetch(`/api/workers/${workerId}/services/${serviceCode}`, {
    method: "DELETE",
  });
}

/* -----------------------------------------------------
   WORKER UPDATE
----------------------------------------------------- */

export async function updateWorker(workerId, data) {
  const res = await fetch(`${API_BASE_URL}/api/workers/${workerId}`, {
    method: "PUT", // IMPORTANT (not PATCH)
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update worker");
  }

  return res.json();
}

export async function getWorker(workerId) {
  const res = await apiFetch(`/api/workers/${workerId}`);
  return res.data ?? res; // unwrap { ok, data } if present
}
export function updateOrderStatus(orderId, status) {
  return apiFetch(`/api/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function acceptOrder(orderId) {
  return updateOrderStatus(orderId, "CONFIRMED");
}

export function startOrder(orderId) {
  return updateOrderStatus(orderId, "IN_PROGRESS");
}

export function completeOrder(orderId) {
  return updateOrderStatus(orderId, "COMPLETED");
}

export function cancelOrderByWorker(orderId) {
  return updateOrderStatus(orderId, "CANCELLED_BY_WORKER");
}

export function cancelOrderByCustomer(orderId) {
  return updateOrderStatus(orderId, "CANCELLED_BY_CUSTOMER");
}
