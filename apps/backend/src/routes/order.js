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

router.post("/orders", createOrder);
router.get("/orders", getAllOrders);

router.get("/orders/worker/:id", getWorkerOrderHistory);

router.get("/orders/:id", getOrderById);

router.patch("/orders/:id/status", updateOrderStatus);

router.post("/orders/:id/bit-proof", upload.single("proof"), uploadBitProof);

router.patch("/orders/:id/bit-payment/confirm", confirmBitPayment);
router.patch("/orders/:id/bit-payment/reject", rejectBitPayment);

router.delete("/orders/:id", deleteOrder);

module.exports = router;
