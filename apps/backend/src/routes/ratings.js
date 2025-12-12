const express = require("express");
const {
  createRating,
  getRatingByOrder,
  getWorkerRatings,
  deleteRating,
} = require("../controllers/ratings");

const router = express.Router();

// Create rating
router.post("/ratings", createRating);

// Get rating for a specific order
router.get("/ratings/order/:orderId", getRatingByOrder);

// Get all ratings for a worker
router.get("/ratings/worker/:workerId", getWorkerRatings);

// Delete rating
router.delete("/ratings/:id", deleteRating);

module.exports = router;
