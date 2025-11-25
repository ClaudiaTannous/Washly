const express = require("express");
const {
  createService,
  getAllServices,
  getServiceByCode,
  updateService,
  deleteService,
} = require("../controllers/serviceCatalog");

const router = express.Router();

router.post("/services", createService);
router.get("/services", getAllServices);
router.get("/services/:service_code", getServiceByCode);
router.patch("/services/:service_code", updateService);
router.delete("/services/:service_code", deleteService);

module.exports = router;
