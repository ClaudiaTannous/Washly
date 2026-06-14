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

const upload = multer({
  dest: "uploads/ratings/",
});

router.post("/ratings", requireAuth, upload.array("photos", 5), createRating);

router.get("/ratings/order/:orderId", getRatingByOrder);

router.get("/ratings/worker/:workerId", getWorkerRatings);

router.delete("/ratings/:id", requireAuth, deleteRating);

module.exports = router;
