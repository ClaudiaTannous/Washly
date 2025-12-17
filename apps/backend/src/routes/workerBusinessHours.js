const express = require("express");
const {
  addWorkerBusinessHours,
  getWorkerBusinessHours,
  updateWorkerBusinessHours,
  deleteWorkerBusinessHours,
  addWorkerBusinessHoursBulk,
} = require("../controllers/workerBusinessHours");

const router = express.Router();

// ADD
router.post("/workers/:workerId/hours", addWorkerBusinessHours);

// GET
router.get("/workers/:workerId/hours", getWorkerBusinessHours);

// UPDATE
router.patch("/workers/:workerId/hours", updateWorkerBusinessHours);

// DELETE
router.delete("/workers/:workerId/hours", deleteWorkerBusinessHours);

router.post("/workers/:workerId/hours/bulk", addWorkerBusinessHoursBulk);

module.exports = router;
