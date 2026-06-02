const prisma = require("../prisma");

// =======================
// CREATE WORKER
// =======================
exports.createWorker = async (req, res) => {
  try {
    // 🔐 take user id from JWT, not from body
    const userIdBigInt = BigInt(req.user.userId);

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
      service_codes,
      services,
    } = req.body;

    // 1) check that user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userIdBigInt },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2) check not already a worker
    const existingWorker = await prisma.worker.findUnique({
      where: { id: userIdBigInt },
    });

    if (existingWorker) {
      return res
        .status(400)
        .json({ error: "Worker already exists for this user" });
    }

    // 3) build data (only override if provided; Prisma has defaults)
    const data = { id: userIdBigInt };

    if (typeof is_professional === "boolean")
      data.is_professional = is_professional;
    if (typeof pickup_available === "boolean")
      data.pickup_available = pickup_available;
    if (typeof delivery_available === "boolean")
      data.delivery_available = delivery_available;
    if (description !== undefined) data.description = description;
    if (image_url !== undefined) data.image_url = image_url;
    if (typeof is_online === "boolean") data.is_online = is_online;
    if (typeof max_orders_per_day === "number")
      data.max_orders_per_day = max_orders_per_day;
    if (typeof min_notice_minutes === "number")
      data.min_notice_minutes = min_notice_minutes;
    if (typeof max_items_per_wash === "number")
      data.max_items_per_wash = max_items_per_wash;
    if (typeof price_per_wash === "number")
      data.price_per_wash = price_per_wash;

    const newWorker = await prisma.worker.create({
      data: {
        ...data,
        Services:
          Array.isArray(services) && services.length > 0
            ? {
                create: services.map((service) => ({
                  service_code: service.service_code,
                  base_price: Number(service.base_price || 0),
                  is_active: true,
                })),
              }
            : Array.isArray(service_codes) && service_codes.length > 0
              ? {
                  create: service_codes.map((code) => ({
                    service_code: code,
                    base_price: Number(price_per_wash || 0),
                    is_active: true,
                  })),
                }
              : undefined,
      },
      include: {
        user: true,
        Services: {
          include: {
            Service: true,
          },
        },
      },
    });

    return res.status(201).json(newWorker);
  } catch (error) {
    console.error("createWorker error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET WORKERS LIST WITH FILTERS
// ---------------------------
exports.getWorkers = async (req, res) => {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      serviceCode,
      serviceActive,
      pickupAvailable,
      online,
    } = req.query;

    const where = {};

    // ---- city filter (from related User.city_name) ----
    if (city) {
      where.user = {
        city_name: {
          equals: city,
          mode: "insensitive",
        },
      };
    }

    // ---- price_per_wash filter ----
    const priceFilter = {};
    const minP = minPrice ? parseInt(minPrice, 10) : undefined;
    const maxP = maxPrice ? parseInt(maxPrice, 10) : undefined;

    if (!Number.isNaN(minP) && minP !== undefined) {
      priceFilter.gte = minP;
    }
    if (!Number.isNaN(maxP) && maxP !== undefined) {
      priceFilter.lte = maxP;
    }
    if (Object.keys(priceFilter).length > 0) {
      where.price_per_wash = priceFilter;
    }

    // helper to parse booleans from query string
    const parseBoolean = (value) => {
      if (value === undefined) return undefined;
      if (value === "true" || value === "1") return true;
      if (value === "false" || value === "0") return false;
      return undefined;
    };

    // ---- pickup_available filter ----
    const pickupBool = parseBoolean(pickupAvailable);
    if (pickupBool !== undefined) {
      where.pickup_available = pickupBool;
    }

    // ---- is_online filter ----
    const onlineBool = parseBoolean(online);
    if (onlineBool !== undefined) {
      where.is_online = onlineBool;
    }

    // ---- service filter (WorkerService) ----
    const serviceFilter = {};
    const serviceActiveBool = parseBoolean(serviceActive);

    if (serviceCode) {
      serviceFilter.service_code = serviceCode;
    }
    if (serviceActiveBool !== undefined) {
      serviceFilter.is_active = serviceActiveBool;
    }

    if (Object.keys(serviceFilter).length > 0) {
      // worker must have at least one WorkerService matching these conditions
      where.Services = {
        some: serviceFilter,
      };
    }

    const workers = await prisma.worker.findMany({
      where,
      include: {
        user: true,
        Services: {
          include: {
            Service: true, // from ServiceCatalog
          },
        },
        Hours: true,
      },
    });

    return res.json(workers);
  } catch (error) {
    console.error("Get Workers (with filters) Error:", error);
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
      where: { id: BigInt(req.params.id) },
      include: { user: true }, // ✅ needed for name/city/street/phone
    });

    if (!worker)
      return res.status(404).json({ ok: false, error: "Worker not found" });

    return res.json({ ok: true, data: worker }); // wrapping is fine now (frontend unwraps)

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

// ---------------------------
// UPLOAD / CHANGE WORKER AVATAR
// ---------------------------
// POST /workers/:id/avatar
// (multer puts the file on disk and sets req.file)
exports.uploadWorkerAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workerId = BigInt(id);

    // URL that the frontend can reach (served from index.js with app.use("/uploads", express.static(...)))
    const imageUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: { image_url: imageUrl },
      include: {
        user: true,
        Services: true,
        Hours: true,
      },
    });

    return res.json(updatedWorker);
  } catch (error) {
    console.error("Upload Worker Avatar Error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Worker not found" });
    }

    return res.status(500).json({ error: error.message });
  }
};
