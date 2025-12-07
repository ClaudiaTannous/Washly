const express = require("express");
const path = require("path");
const multer = require("multer");

const {
  createWorker,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkerOrders,
  updateWorkerSchedule,
  setWorkerOnlineStatus,
  getWorkers,
  uploadWorkerAvatar, // 👈 NEW
} = require("../controllers/worker");

const { getWorkerOrderHistory } = require("../controllers/order");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

/* ------------ Multer setup for avatar uploads ------------ */

// files will be saved under: <backend-root>/uploads/avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `worker-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

/* ----------------------------- Routes ----------------------------- */

// Get workers list with filters
// (IMPORTANT: keep this before /workers/:id routes)
router.get("/workers", getWorkers);

// Create worker
router.post("/workers", requireAuth, createWorker);

// Get worker by ID
router.get("/workers/:id", getWorkerById);

// Update worker
router.put("/workers/:id", updateWorker);

// Delete worker
router.delete("/workers/:id", deleteWorker);

// Get worker orders
router.get("/workers/:id/orders", getWorkerOrders);

// Update weekly schedule
router.put("/workers/:id/schedule", updateWorkerSchedule);

// Set worker online/offline
router.patch("/workers/:id/online", setWorkerOnlineStatus);

// Get worker order history
router.get("/workers/:id/orders/history", getWorkerOrderHistory);

// 👇 NEW: upload / change worker avatar
// Frontend sends multipart/form-data with field name "avatar"
router.post(
  "/workers/:id/avatar",
  requireAuth,
  upload.single("avatar"),
  uploadWorkerAvatar
);

module.exports = router;
