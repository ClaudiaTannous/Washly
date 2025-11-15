const express = require("express");
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/order");

const router = express.Router();

router.post("/orders", createOrder);
router.get("/orders", getAllOrders);
router.get("/order/:id", getOrderById);
router.patch("/order/:id/status", updateOrderStatus);
router.delete("/order/:id", deleteOrder);

module.exports = router;
