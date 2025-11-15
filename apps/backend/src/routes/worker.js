const express = require("express");

const {
  createWorker,
  getWorkerById,
  updateWorker,
  deleteWorker,
} = require("../controllers/worker");

const router = express.Router();

router.post("/workers", createWorker);

router.get("/worker/:id", getWorkerById);

router.put("/worker/:id", updateWorker);

router.delete("/worker/:id", deleteWorker);

module.exports = router;
