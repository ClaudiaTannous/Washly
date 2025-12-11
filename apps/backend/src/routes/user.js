const express = require("express");
const {
  createUser,
  getUserById,
  deleteUser,
  updateUser,
  checkIfUserIsWorker,
  login,
  getCurrentUser,
} = require("../controllers/user");

const { getUserOrders } = require("../controllers/order");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

/* ============================
   AUTH ROUTES
============================= */

// Login (email + password)
router.post("/auth/login", login);

// Get current logged-in user (requires JWT)
router.get("/auth/me", requireAuth, getCurrentUser);

/* ============================
   USER CRUD
============================= */

// Create user (signup)
router.post("/users", createUser);

// Get user by ID
router.get("/user/:id", getUserById);

// Delete user
router.delete("/user/:id", deleteUser);

// Update profile
router.put("/user/:id", updateUser);

/* ============================
   USER → WORKER RELATION
============================= */

// Check if user is also a worker
router.get("/user/:id/is-worker", checkIfUserIsWorker);

/* ============================
   USER ORDERS
============================= */

// Get all customer orders
router.get("/user/:id/orders", getUserOrders);

module.exports = router;
