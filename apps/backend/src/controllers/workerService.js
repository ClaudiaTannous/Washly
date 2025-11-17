const prisma = require("../prisma");

// convert possible numeric strings to Decimal-friendly input
function toDecimalOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null; // Prisma Decimal accepts numbers/strings
}

exports.createWorkerService = async (req, res) => {
  try {
    const { workerId } = req.params;
    const {
      service_code,
      is_active = true,
      base_price,
      min_qty,
      max_qty,
      turnaround_proximate_hours,
      notes,
    } = req.body;

    if (!/^\d+$/.test(workerId)) {
      return res.status(400).json({ error: "Invalid workerId (must be numeric)" });
    }
    if (!service_code) {
      return res.status(400).json({ error: "service_code is required" });
    }
    if (base_price === undefined || base_price === null || base_price === "") {
      return res.status(400).json({ error: "base_price is required" });
    }

    // ensure service exists
    const svc = await prisma.serviceCatalog.findUnique({ where: { service_code } });
    if (!svc) return res.status(404).json({ error: "service_code not found" });

    const created = await prisma.workerService.create({
      data: {
        worker_id: BigInt(workerId),
        service_code,
        is_active: Boolean(is_active),
        base_price: toDecimalOrNull(base_price),
        min_qty: toDecimalOrNull(min_qty),
        max_qty: toDecimalOrNull(max_qty),
        turnaround_proximate_hours:
          turnaround_proximate_hours ?? null,
        notes: notes ?? null,
      },
    });

    return res.status(201).json(created);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Worker already offers this service" });
    }
    if (error.code === "P2003") {
      return res.status(400).json({ error: "Invalid worker_id or service_code (FK failed)" });
    }
    console.error("Create WorkerService Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getWorkerServices = async (req, res) => {
  try {
    const { workerId } = req.params;
    if (!/^\d+$/.test(workerId)) {
      return res.status(400).json({ error: "Invalid workerId (must be numeric)" });
    }

    const list = await prisma.workerService.findMany({
      where: { worker_id: BigInt(workerId) },
      include: { Service: true }, // include catalog info
      orderBy: [{ service_code: "asc" }],
    });

    return res.json(list);
  } catch (error) {
    console.error("Get WorkerServices Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getWorkerService = async (req, res) => {
  try {
    const { workerId, service_code } = req.params;
    if (!/^\d+$/.test(workerId)) {
      return res.status(400).json({ error: "Invalid workerId (must be numeric)" });
    }

    const item = await prisma.workerService.findUnique({
      where: {
        worker_id_service_code: {
          worker_id: BigInt(workerId),
          service_code,
        },
      },
      include: { Service: true },
    });

    if (!item) return res.status(404).json({ error: "Worker service not found" });
    return res.json(item);
  } catch (error) {
    console.error("Get WorkerService Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.updateWorkerService = async (req, res) => {
  try {
    const { workerId, service_code } = req.params;
    const {
      is_active,
      base_price,
      min_qty,
      max_qty,
      turnaround_proximate_hours,
      notes,
    } = req.body;

    if (!/^\d+$/.test(workerId)) {
      return res.status(400).json({ error: "Invalid workerId (must be numeric)" });
    }

    const updated = await prisma.workerService.update({
      where: {
        worker_id_service_code: {
          worker_id: BigInt(workerId),
          service_code,
        },
      },
      data: {
        ...(is_active !== undefined && { is_active: Boolean(is_active) }),
        ...(base_price !== undefined && { base_price: toDecimalOrNull(base_price) }),
        ...(min_qty !== undefined && { min_qty: toDecimalOrNull(min_qty) }),
        ...(max_qty !== undefined && { max_qty: toDecimalOrNull(max_qty) }),
        ...(turnaround_proximate_hours !== undefined && {
          turnaround_proximate_hours,
        }),
        ...(notes !== undefined && { notes }),
      },
    });

    return res.json(updated);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker service not found" });
    }
    console.error("Update WorkerService Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteWorkerService = async (req, res) => {
  try {
    const { workerId, service_code } = req.params;
    if (!/^\d+$/.test(workerId)) {
      return res.status(400).json({ error: "Invalid workerId (must be numeric)" });
    }

    // Optional safety: prevent delete if used in order items
    const used = await prisma.orderItem.count({
      where: { worker_id: BigInt(workerId), service_code },
    });
    if (used > 0) {
      return res.status(409).json({
        error: "Cannot delete: this worker service is referenced by existing order items",
      });
    }

    await prisma.workerService.delete({
      where: {
        worker_id_service_code: {
          worker_id: BigInt(workerId),
          service_code,
        },
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker service not found" });
    }
    console.error("Delete WorkerService Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
