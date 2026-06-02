const express = require("express");
const multer = require("multer");

const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getWorkerOrderHistory,
  uploadBitProof,
  confirmBitPayment,
  rejectBitPayment,
} = require("../controllers/order");

const router = express.Router();

const upload = multer({
  dest: "uploads/payment-proofs/",
});

// Create order + get all orders
router.post("/orders", createOrder);
router.get("/orders", getAllOrders);

// Worker orders
router.get("/orders/worker/:id", getWorkerOrderHistory);

// Get one order
router.get("/orders/:id", getOrderById);

// Update order status
router.patch("/orders/:id/status", updateOrderStatus);

// Bit payment proof upload
router.post("/orders/:id/bit-proof", upload.single("proof"), uploadBitProof);

router.patch("/orders/:id/bit-payment/confirm", confirmBitPayment);
router.patch("/orders/:id/bit-payment/reject", rejectBitPayment);

// Delete order
router.delete("/orders/:id", deleteOrder);

module.exports = router;
