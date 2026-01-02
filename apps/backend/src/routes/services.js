const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

// GET /api/services
router.get("/services", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { display_name: "asc" },
      select: {
        service_code: true,
        display_name: true,
        unit: true,
      },
    });

    res.json({ ok: true, data: services });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
