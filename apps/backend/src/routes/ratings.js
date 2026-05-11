const express = require("express");

const {
  createRating,
  getRatingByOrder,
  getWorkerRatings,
  deleteRating,
} = require("../controllers/ratings");

const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

// Create rating
// POST /api/ratings
router.post("/ratings", requireAuth, createRating);

// Get rating for a specific order
// GET /api/ratings/order/:orderId
router.get("/ratings/order/:orderId", getRatingByOrder);

// Get all ratings for a worker
// GET /api/ratings/worker/:workerId
router.get("/ratings/worker/:workerId", getWorkerRatings);

// Delete rating
// DELETE /api/ratings/:id
router.delete("/ratings/:id", requireAuth, deleteRating);

module.exports = router;
