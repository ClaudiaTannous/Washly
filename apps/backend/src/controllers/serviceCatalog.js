const prisma = require("../prisma");

// Helpers
const allowedUnits = new Set(["kg", "item", "bag", "order", "hour"]);

exports.createService = async (req, res) => {
  try {
    const {
      service_code,
      display_name,
      unit,
      default_proximate_turnaround_hours,
      description,
      delicate_fabric,
    } = req.body;

    if (!service_code || !display_name || !unit) {
      return res.status(400).json({ error: "service_code, display_name, and unit are required" });
    }
    if (!allowedUnits.has(unit)) {
      return res.status(400).json({ error: `unit must be one of: ${[...allowedUnits].join(", ")}` });
    }

    const svc = await prisma.serviceCatalog.create({
      data: {
        service_code,
        display_name,
        unit,
        default_proximate_turnaround_hours:
          default_proximate_turnaround_hours ?? null,
        description: description ?? null,
        delicate_fabric: Boolean(delicate_fabric ?? false),
      },
    });

    return res.status(201).json(svc);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "service_code already exists" });
    }
    console.error("Create Service Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllServices = async (_req, res) => {
  try {
    const items = await prisma.serviceCatalog.findMany({
      select: {
        service_code: true,
        display_name: true,
        unit: true,
      },
      orderBy: { display_name: "asc" },
    });

    return res.json({ ok: true, data: items });
  } catch (error) {
    console.error("Get Services Error:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
};



exports.getServiceByCode = async (req, res) => {
  try {
    const { service_code } = req.params;
    const svc = await prisma.serviceCatalog.findUnique({
      where: { service_code },
    });
    if (!svc) return res.status(404).json({ error: "Service not found" });
    return res.json(svc);
  } catch (error) {
    console.error("Get Service Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { service_code } = req.params;
    const {
      display_name,
      unit,
      default_proximate_turnaround_hours,
      description,
      delicate_fabric,
    } = req.body;

    if (unit && !allowedUnits.has(unit)) {
      return res.status(400).json({ error: `unit must be one of: ${[...allowedUnits].join(", ")}` });
    }

    const svc = await prisma.serviceCatalog.update({
      where: { service_code },
      data: {
        ...(display_name !== undefined && { display_name }),
        ...(unit !== undefined && { unit }),
        ...(default_proximate_turnaround_hours !== undefined && {
          default_proximate_turnaround_hours,
        }),
        ...(description !== undefined && { description }),
        ...(delicate_fabric !== undefined && {
          delicate_fabric: Boolean(delicate_fabric),
        }),
      },
    });

    return res.json(svc);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Service not found" });
    }
    console.error("Update Service Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { service_code } = req.params;

    // Optional safety: refuse delete if referenced by worker services
    const wsCount = await prisma.workerService.count({ where: { service_code } });
    if (wsCount > 0) {
      return res.status(409).json({
        error: "Cannot delete: one or more workers provide this service",
      });
    }

    await prisma.serviceCatalog.delete({
      where: { service_code },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Service not found" });
    }
    console.error("Delete Service Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
