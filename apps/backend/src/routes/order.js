const express = require("express");

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getWorkerOrderHistory,
} = require("../controllers/order");

const router = express.Router();

// Create order + get all orders
router.post("/orders", createOrder);
router.get("/orders", getAllOrders);

// Worker orders
router.get("/orders/worker/:id", getWorkerOrderHistory);

// Get one order
router.get("/orders/:id", getOrderById);

// Update order status
router.patch("/orders/:id/status", updateOrderStatus);

// Delete order
router.delete("/orders/:id", deleteOrder);

module.exports = router;
