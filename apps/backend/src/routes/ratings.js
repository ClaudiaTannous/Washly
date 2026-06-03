const express = require("express");
const multer = require("multer");

const {
  createRating,
  getRatingByOrder,
  getWorkerRatings,
  deleteRating,
} = require("../controllers/ratings");

const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// ---------------------------
// Multer configuration
// ---------------------------
const upload = multer({
  dest: "uploads/ratings/",
});

// ---------------------------
// Create rating + upload photos
// POST /api/ratings
// ---------------------------
router.post(
  "/ratings",
  requireAuth,
  upload.array("photos", 5), // up to 5 photos
  createRating,
);

// ---------------------------
// Get rating for specific order
// GET /api/ratings/order/:orderId
// ---------------------------
router.get("/ratings/order/:orderId", getRatingByOrder);

// ---------------------------
// Get all ratings for worker
// GET /api/ratings/worker/:workerId
// ---------------------------
router.get("/ratings/worker/:workerId", getWorkerRatings);

// ---------------------------
// Delete rating
// DELETE /api/ratings/:id
// ---------------------------
router.delete("/ratings/:id", requireAuth, deleteRating);

module.exports = router;
