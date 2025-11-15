const prisma = require("../prisma");

// ---------------------------
// CREATE ORDER
// ---------------------------
exports.createOrder = async (req, res) => {
  try {
    const body = req.body;

    // Validate required fields
    if (
      !body.customerUserId ||
      !body.workerId ||
      !body.pickup ||
      !body.delivery ||
      !body.amount
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const order = await prisma.order.create({
      data: {
        customer_user_id: BigInt(body.customerUserId),
        worker_id: BigInt(body.workerId),
        status: body.status || "Pending",

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

        scheduled_pickup: body.scheduledPickup
          ? new Date(body.scheduledPickup)
          : null,
        scheduled_dropoff: body.scheduledDropoff
          ? new Date(body.scheduledDropoff)
          : null,

        payment_method: body.paymentMethod || null,
        amount: body.amount,
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
        Items: true,
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
        Items: true,
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

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
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
