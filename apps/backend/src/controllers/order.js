const prisma = require("../prisma");
const { canWorkerTakeOrder } = require("../utils/availability");

// Allowed enum values (keep in sync with schema.prisma)
const ORDER_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED_BY_WORKER",
  "CANCELLED_BY_CUSTOMER",
];

const PAYMENT_METHODS = ["CASH", "BIT"];

// ---------------------------
// CREATE ORDER (with booking + wash pricing + payment)
// ---------------------------
exports.createOrder = async (req, res) => {
  try {
    const body = req.body;

    // 1) Validate required fields from client
    if (
      !body.customerUserId ||
      !body.workerId ||
      !body.pickup ||
      !body.delivery ||
      !body.scheduledPickup ||
      body.itemsCount == null || // must exist, can be 0+ but we'll check >0
      !body.paymentMethod
    ) {
      return res.status(400).json({
        error:
          "Missing required fields (customerUserId, workerId, pickup, delivery, scheduledPickup, itemsCount, paymentMethod)",
      });
    }

    // Validate payment method enum
    if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
      return res
        .status(400)
        .json({ error: "paymentMethod must be CASH or BIT" });
    }

    // Parse and validate items count
    const itemsCount = Number(body.itemsCount);
    if (!Number.isFinite(itemsCount) || itemsCount <= 0) {
      return res
        .status(400)
        .json({ error: "itemsCount must be a positive number" });
    }

    // 2) Parse pickup datetime
    const pickupDate = new Date(body.scheduledPickup);
    if (isNaN(pickupDate.getTime())) {
      return res
        .status(400)
        .json({ error: "Invalid scheduledPickup datetime" });
    }

    const customerIdBigInt = BigInt(body.customerUserId);
    const workerIdBigInt = BigInt(body.workerId);

    // 3) Load worker with schedule & existing orders + pricing
    const worker = await prisma.worker.findUnique({
      where: { id: workerIdBigInt },
      include: {
        Hours: true, // WorkerBusinessHours
        Orders: true, // used by canWorkerTakeOrder to count today's bookings
      },
    });

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    // 4) Check if worker can take this order at this time (booking rules)
    if (!canWorkerTakeOrder(worker, pickupDate)) {
      return res.status(400).json({
        error: "Worker is not available at the requested pickup time",
      });
    }

    // 5) Calculate washes and total amount based on worker's capacity & price
    const maxItemsPerWash =
      typeof worker.max_items_per_wash === "number" &&
      worker.max_items_per_wash > 0
        ? worker.max_items_per_wash
        : 10; // fallback

    const pricePerWash =
      typeof worker.price_per_wash === "number" && worker.price_per_wash > 0
        ? worker.price_per_wash
        : 30; // fallback

    const washesCount = Math.ceil(itemsCount / maxItemsPerWash);
    const totalAmount = washesCount * pricePerWash;

    // 6) Determine initial status (optional override from body)
    let status = "REQUESTED";
    if (body.status && ORDER_STATUSES.includes(body.status)) {
      status = body.status;
    }

    // 7) Create order with all logic applied
    const order = await prisma.order.create({
      data: {
        customer_user_id: customerIdBigInt,
        worker_id: workerIdBigInt,

        status,

        pickup_city: body.pickup.city,
        pickup_street: body.pickup.street,
        pickup_building: body.pickup.building ?? null,
        pickup_apartment_house: body.pickup.apartmentHouse ?? null,
        pickup_floor: body.pickup.floor ?? null,

        delivery_city: body.delivery.city,
        delivery_street: body.delivery.street,
        delivery_building: body.delivery.building ?? null,
        delivery_apartment_house: body.delivery.apartmentHouse ?? null,
        delivery_floor: body.delivery.floor ?? null,

        scheduled_pickup: pickupDate,
        scheduled_dropoff: body.scheduledDropoff
          ? new Date(body.scheduledDropoff)
          : null,

        // 🧺 quantity & pricing
        items_count: itemsCount,
        washes_count: washesCount,
        amount: totalAmount,

        // 💰 payment
        payment_method: body.paymentMethod, // CASH or BIT
        // payment_status defaults to UNPAID in schema
        payment_notes: body.paymentNotes || null,

        notes: body.notes || null,
      },
      include: {
        Customer: true,
        Worker: true,
      },
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET ALL ORDERS
// ---------------------------
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        Customer: true,
        Worker: true,
        // no Items relation anymore
      },
      orderBy: { created_at: "desc" },
    });

    return res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET ORDER BY ID
// ---------------------------
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        Customer: true,
        Worker: true,
        // no Items relation anymore
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// UPDATE ORDER STATUS
// ---------------------------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + ORDER_STATUSES.join(", "),
      });
    }

    // Optional rule: cannot mark COMPLETED if payment not PAID
    if (status === "COMPLETED") {
      const existing = await prisma.order.findUnique({
        where: { id: BigInt(id) },
        select: { payment_status: true },
      });

      if (!existing) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (existing.payment_status !== "PAID") {
        return res.status(400).json({
          error: "Order cannot be completed until payment_status is PAID",
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: BigInt(id) },
      data: { status },
      select: {
        id: true,
        status: true,
        updated_at: true,
      },
    });

    return res.json(updatedOrder);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }

    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// DELETE ORDER
// ---------------------------
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    await prisma.order.delete({
      where: { id: BigInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Order not found" });
    }

    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
