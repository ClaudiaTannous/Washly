const express = require("express");

const {
  createWorker,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getWorkerOrders,
  updateWorkerSchedule,
  setWorkerOnlineStatus,
  getWorkers,          
} = require("../controllers/worker");

const router = express.Router();

// 👇 IMPORTANT: هذا لازم يكون أول GET للـ workers
// Get workers list with filters
router.get("/workers", getWorkers);

// Create worker
const { requireAuth } = require("../middlewares/auth");

router.post("/workers", requireAuth, createWorker);


// Get worker by ID  (مهم يكون بعد الـ /workers)
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

module.exports = router;
