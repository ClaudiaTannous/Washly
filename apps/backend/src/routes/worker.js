// routes/worker.js
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
  uploadWorkerAvatar,
  getWorkerAvailability,
} = require("../controllers/worker");

const { getWorkerOrderHistory } = require("../controllers/order");

// Middlewares
const { requireAuth, requireWorker } = require("../middlewares/auth");

const router = express.Router();

/* ----------------------------------------------------
   MULTER CONFIGURATION FOR AVATAR UPLOAD
---------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/avatars"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `worker-${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

/* ----------------------------------------------------
   PUBLIC ROUTES  (NO AUTH REQUIRED)
---------------------------------------------------- */

// ✔ Public: Get list of workers
router.get("/workers", getWorkers);

router.get("/workers/:id/availability", getWorkerAvailability);

// ✔ Public: Get worker by ID
router.get("/workers/:id", getWorkerById);

/* ----------------------------------------------------
   PROTECTED ROUTES (USER MUST BE LOGGED IN)
---------------------------------------------------- */

// ✔ Create worker profile (User → Worker)
router.post("/workers", requireAuth, createWorker);

/* ----------------------------------------------------
   WORKER-ONLY ROUTES (MUST BE LOGGED IN + MUST BE WORKER)
---------------------------------------------------- */

// ✔ Update worker profile
router.put("/workers/:id", requireAuth, requireWorker, updateWorker);

// ✔ Delete worker profile
router.delete("/workers/:id", requireAuth, requireWorker, deleteWorker);

// ✔ Worker orders (current/upcoming/today)
router.get("/workers/:id/orders", requireAuth, requireWorker, getWorkerOrders);

// ✔ Order history
router.get(
  "/workers/:id/orders/history",
  requireAuth,
  requireWorker,
  getWorkerOrderHistory
);

// ✔ Update business hours schedule
router.put(
  "/workers/:id/schedule",
  requireAuth,
  requireWorker,
  updateWorkerSchedule
);

// ✔ Toggle worker online/offline
router.patch(
  "/workers/:id/online",
  requireAuth,
  requireWorker,
  setWorkerOnlineStatus
);

// ✔ Upload worker avatar
router.post(
  "/workers/:id/avatar",
  requireAuth,
  requireWorker,
  upload.single("avatar"),
  uploadWorkerAvatar
);

module.exports = router;
