const express = require("express");
const {
  createWorkerService,
  getWorkerServices,
  getWorkerService,
  updateWorkerService,
  deleteWorkerService,
} = require("../controllers/workerService.js");

const router = express.Router();

// Worker Services (services offered by a specific worker)
router.post("/workers/:workerId/services", createWorkerService);
router.get("/workers/:workerId/services", getWorkerServices);
router.get("/workers/:workerId/services/:service_code", getWorkerService);
router.patch("/workers/:workerId/services/:service_code", updateWorkerService);
router.delete("/workers/:workerId/services/:service_code", deleteWorkerService);

module.exports = router;
