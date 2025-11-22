const prisma = require("../prisma");

// ---------------------------
// CREATE WORKER
// ---------------------------
exports.createWorker = async (req, res) => {
  try {
    const {
      user_id,
      is_professional,
      pickup_available,
      delivery_available,
      description,
      image_url,
      is_online,
      max_orders_per_day,
      min_notice_minutes,
      max_items_per_wash,
      price_per_wash,
    } = req.body;

    if (!user_id || !/^\d+$/.test(String(user_id))) {
      return res.status(400).json({ error: "Valid user_id is required" });
    }

    const userIdBigInt = BigInt(user_id);

    const existingUser = await prisma.user.findUnique({
      where: { id: userIdBigInt },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found for this user_id" });
    }

    const existingWorker = await prisma.worker.findUnique({
      where: { id: userIdBigInt },
    });

    if (existingWorker) {
      return res
        .status(400)
        .json({ error: "Worker already exists for this user" });
    }

    const data = {
      id: userIdBigInt,
      is_professional:
        typeof is_professional === "boolean" ? is_professional : false,
      pickup_available:
        typeof pickup_available === "boolean" ? pickup_available : false,
      delivery_available:
        typeof delivery_available === "boolean" ? delivery_available : false,
      description,
      image_url,
    };

    if (typeof is_online === "boolean") {
      data.is_online = is_online;
    }
    if (typeof max_orders_per_day === "number") {
      data.max_orders_per_day = max_orders_per_day;
    }
    if (typeof min_notice_minutes === "number") {
      data.min_notice_minutes = min_notice_minutes;
    }

    if (typeof max_items_per_wash === "number") {
      data.max_items_per_wash = max_items_per_wash;
    }
    if (typeof price_per_wash === "number") {
      data.price_per_wash = price_per_wash;
    }

    const newWorker = await prisma.worker.create({
      data,
      include: {
        user: true,
      },
    });

    return res.status(201).json(newWorker);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET WORKER BY ID
// ---------------------------
exports.getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const worker = await prisma.worker.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: true,
        Services: true,
        Hours: true,
      },
    });

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.json(worker);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// UPDATE WORKER
// ---------------------------
exports.updateWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const {
      is_professional,
      pickup_available,
      delivery_available,
      description,
      image_url,

      is_online,
      max_orders_per_day,
      min_notice_minutes,

      max_items_per_wash,
      price_per_wash,
    } = req.body;

    const updateData = {};

    if (typeof is_professional === "boolean") {
      updateData.is_professional = is_professional;
    }
    if (typeof pickup_available === "boolean") {
      updateData.pickup_available = pickup_available;
    }
    if (typeof delivery_available === "boolean") {
      updateData.delivery_available = delivery_available;
    }

    if (description !== undefined) {
      updateData.description = description;
    }
    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    if (typeof is_online === "boolean") {
      updateData.is_online = is_online;
    }
    if (typeof max_orders_per_day === "number") {
      updateData.max_orders_per_day = max_orders_per_day;
    }
    if (typeof min_notice_minutes === "number") {
      updateData.min_notice_minutes = min_notice_minutes;
    }

    if (typeof max_items_per_wash === "number") {
      updateData.max_items_per_wash = max_items_per_wash;
    }
    if (typeof price_per_wash === "number") {
      updateData.price_per_wash = price_per_wash;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        user: true,
        Services: true,
        Hours: true,
      },
    });

    return res.json(updatedWorker);
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// DELETE WORKER
// ---------------------------
exports.deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    await prisma.worker.delete({
      where: { id: BigInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    console.error(error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET WORKER ORDERS (today / upcoming / all)
// ---------------------------
exports.getWorkerOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = req.query.scope || "today";

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const workerId = BigInt(id);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const where = {
      worker_id: workerId,
      ...(scope === "today"
        ? { scheduled_pickup: { gte: startOfDay, lte: endOfDay } }
        : scope === "upcoming"
          ? { scheduled_pickup: { gt: endOfDay } }
          : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        Customer: true,
      },
      orderBy: { scheduled_pickup: "asc" },
    });

    return res.json(orders);
  } catch (error) {
    console.error("Get Worker Orders Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// UPDATE WORKER WEEKLY SCHEDULE
// ---------------------------
// PUT /worker/:id/schedule
// Body: [{ day_of_week, start_hhmm, end_hhmm }, ...]
exports.updateWorkerSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const workerId = BigInt(id);
    const rules = req.body;

    if (!Array.isArray(rules)) {
      return res
        .status(400)
        .json({ error: "Body must be an array of schedule rules" });
    }

    // delete existing hours
    await prisma.workerBusinessHours.deleteMany({
      where: { worker_id: workerId },
    });

    // insert new hours if provided
    if (rules.length > 0) {
      await prisma.workerBusinessHours.createMany({
        data: rules.map((r) => ({
          worker_id: workerId,
          day_of_week: r.day_of_week,
          start_hhmm: r.start_hhmm,
          end_hhmm: r.end_hhmm,
        })),
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Update Worker Schedule Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// SET WORKER ONLINE / OFFLINE
// ---------------------------
// PATCH /worker/:id/online
// Body: { is_online: true/false }
exports.setWorkerOnlineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_online } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    if (typeof is_online !== "boolean") {
      return res
        .status(400)
        .json({ error: "is_online must be a boolean (true/false)" });
    }

    const workerId = BigInt(id);

    const updated = await prisma.worker.update({
      where: { id: workerId },
      data: { is_online },
      select: {
        id: true,
        is_online: true,
        max_orders_per_day: true,
        min_notice_minutes: true,
        max_items_per_wash: true,
        price_per_wash: true,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error("Set Worker Online Status Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};
