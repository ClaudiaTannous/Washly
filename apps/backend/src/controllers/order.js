const prisma = require("../prisma");
const { canWorkerTakeOrder } = require("../utils/availability");

// Allowed enum values
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
// HELPER: CREATE NOTIFICATION
// ---------------------------
async function createNotification({ userId, orderId, type, title, message }) {
  return prisma.notification.create({
    data: {
      user_id: BigInt(userId),
      order_id: orderId ? BigInt(orderId) : null,
      type,
      title,
      message,
    },
  });
}

// ---------------------------
// HELPER: STATUS MESSAGE
// ---------------------------
function getStatusNotification(status) {
  switch (status) {
    case "CONFIRMED":
      return {
        type: "ORDER_ACCEPTED",
        title: "Order accepted",
        message: "Your laundry order was accepted by the worker.",
      };

    case "IN_PROGRESS":
      return {
        type: "ORDER_STATUS_UPDATED",
        title: "Order in progress",
        message: "The worker started working on your laundry order.",
      };

    case "COMPLETED":
      return {
        type: "ORDER_COMPLETED",
        title: "Order completed",
        message: "Your laundry order was completed.",
      };

    case "CANCELLED_BY_WORKER":
      return {
        type: "ORDER_CANCELLED",
        title: "Order cancelled",
        message: "Your laundry order was cancelled by the worker.",
      };

    case "CANCELLED_BY_CUSTOMER":
      return {
        type: "ORDER_CANCELLED",
        title: "Order cancelled",
        message: "The customer cancelled the laundry order.",
      };

    default:
      return {
        type: "ORDER_STATUS_UPDATED",
        title: "Order updated",
        message: `Your order status was updated to ${status}.`,
      };
  }
}

// ---------------------------
// CREATE ORDER
// ---------------------------
exports.createOrder = async (req, res) => {
  try {
    console.log("createOrder req.body:", JSON.stringify(req.body, null, 2));

    const body = req.body;

    if (
      !body.customerUserId ||
      !body.workerId ||
      !body.pickup ||
      !body.delivery ||
      !body.scheduledPickup ||
      body.itemsCount == null ||
      !body.paymentMethod
    ) {
      return res.status(400).json({
        error:
          "Missing required fields (customerUserId, workerId, pickup, delivery, scheduledPickup, itemsCount, paymentMethod)",
      });
    }

    if (!PAYMENT_METHODS.includes(body.paymentMethod)) {
      return res.status(400).json({
        error: "paymentMethod must be CASH or BIT",
      });
    }

    const itemsCount = Number(body.itemsCount);

    if (!Number.isFinite(itemsCount) || itemsCount <= 0) {
      return res.status(400).json({
        error: "itemsCount must be a positive number",
      });
    }

    const pickupDate = new Date(body.scheduledPickup);

    if (isNaN(pickupDate.getTime())) {
      return res.status(400).json({
        error: "Invalid scheduledPickup datetime",
      });
    }

    const customerIdBigInt = BigInt(body.customerUserId);
    const workerIdBigInt = BigInt(body.workerId);

    const worker = await prisma.worker.findUnique({
      where: {
        id: workerIdBigInt,
      },
      include: {
        Hours: true,
        Orders: true,
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({
        error: "Worker not found",
      });
    }
    console.log("RAW scheduledPickup:", req.body.scheduledPickup);
    console.log("PARSED pickupDate:", pickupDate);
    console.log("DAY:", pickupDate.getDay());
    console.log("TIME:", pickupDate.toTimeString().slice(0, 5));
    console.log("WORKER HOURS:", worker.Hours);

    if (!canWorkerTakeOrder(worker, pickupDate)) {
      return res.status(400).json({
        error: "Worker is not available at the requested pickup time",
      });
    }

    const maxItemsPerWash =
      typeof worker.max_items_per_wash === "number" &&
      worker.max_items_per_wash > 0
        ? worker.max_items_per_wash
        : 10;

    const pricePerWash =
      typeof worker.price_per_wash === "number" && worker.price_per_wash > 0
        ? worker.price_per_wash
        : 30;

    const washesCount = Math.ceil(itemsCount / maxItemsPerWash);

    const selectedServices = Array.isArray(body.selectedServices)
      ? body.selectedServices
      : [];

    const workerServices = await prisma.workerService.findMany({
      where: {
        worker_id: workerIdBigInt,
        service_code: {
          in: selectedServices,
        },
        is_active: true,
      },
    });

    const extraServicesPrice = workerServices.reduce(
      (sum, service) => sum + Number(service.base_price || 0),
      0,
    );

    const totalAmount = washesCount * pricePerWash + extraServicesPrice;

    let status = "REQUESTED";

    if (body.status && ORDER_STATUSES.includes(body.status)) {
      status = body.status;
    }

    const paymentStatus = "UNPAID";

    const order = await prisma.order.create({
      data: {
        customer_user_id: customerIdBigInt,
        worker_id: workerIdBigInt,

        status,

        pickup_city: body.pickup.city,
        pickup_street: body.pickup.street,
        pickup_building: body.pickup.building ?? null,
        pickup_apartment_house: body.pickup.apartmentHouse ?? 0,
        pickup_floor: body.pickup.floor ?? null,

        delivery_city: body.delivery.city,
        delivery_street: body.delivery.street,
        delivery_building: body.delivery.building ?? null,
        delivery_apartment_house: body.delivery.apartmentHouse ?? 0,
        delivery_floor: body.delivery.floor ?? null,

        scheduled_pickup: pickupDate,
        scheduled_dropoff: body.scheduledDropoff
          ? new Date(body.scheduledDropoff)
          : null,

        items_count: itemsCount,
        washes_count: washesCount,
        amount: totalAmount,
        Services: {
          create: workerServices.map((service) => ({
            service_code: service.service_code,
            price: service.base_price,
          })),
        },

        payment_method: body.paymentMethod,
        payment_status: paymentStatus,
        payment_notes: body.paymentNotes || null,

        notes: body.notes || null,
      },
      include: {
        Customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            city_name: true,
          },
        },
        Services: {
          include: {
            Service: true,
          },
        },
        Worker: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        PaymentProofs: true,
        Notifications: true,
      },
    });

    // await createNotification({
    //   userId: workerIdBigInt,
    //   orderId: order.id,
    //   type: "ORDER_RECEIVED",
    //   title: "New order received",
    //   message: "You received a new laundry order from a customer.",
    // });

    return res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// GET ALL ORDERS
// ---------------------------
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      include: {
        Customer: true,
        Rating: true,
        PaymentProofs: true,
        Notifications: {
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// GET ORDER BY ID
// ---------------------------
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid order id format",
      });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        Customer: true,
        Worker: {
          include: {
            user: true,
          },
        },
        Rating: true,
        PaymentProofs: true,
        // Notifications: {
        //   orderBy: {
        //     created_at: "desc",
        //   },
        // },
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    return res.json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// UPDATE ORDER STATUS
// ---------------------------
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid order id format",
      });
    }

    if (!status || !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Must be one of: " + ORDER_STATUSES.join(", "),
      });
    }

    const existingOrder = await prisma.order.findUnique({
      where: {
        id: BigInt(id),
      },
      select: {
        id: true,
        status: true,
        customer_user_id: true,
        worker_id: true,
        payment_status: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const updateData = {
      status,
      updated_at: new Date(),
    };

    // In Washly, when the worker marks the order as completed,
    // it means the worker met the customer, received the payment,
    // and finished the order.
    if (status === "COMPLETED") {
      updateData.payment_status = "PAID";
      updateData.payment_confirmed_at = new Date();
      updateData.payment_confirmed_by = existingOrder.worker_id;
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: BigInt(id),
      },
      data: updateData,
      include: {
        Customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        Worker: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        Rating: true,
      },
    });

    const notification = getStatusNotification(status);

    let notificationUserId = existingOrder.customer_user_id;

    if (status === "CANCELLED_BY_CUSTOMER") {
      notificationUserId = existingOrder.worker_id;
    }

    await createNotification({
      userId: notificationUserId,
      orderId: existingOrder.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
    });

    return res.json(updatedOrder);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// DELETE ORDER
// ---------------------------
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid order id format",
      });
    }

    await prisma.order.delete({
      where: {
        id: BigInt(id),
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    console.error("Delete Order Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// GET USER ORDER HISTORY
// ---------------------------
exports.getUserOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid user id format",
      });
    }

    const where = {
      customer_user_id: BigInt(id),
      ...(status ? { status } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      include: {
        Worker: {
          include: {
            user: true,
          },
        },
        Rating: true,
        // Notifications: {
        //   orderBy: {
        //     created_at: "desc",
        //   },
        // },
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error("Get User Orders Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// GET WORKER ORDER HISTORY
// ---------------------------
exports.getWorkerOrderHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid worker id format",
      });
    }

    const where = {
      worker_id: BigInt(id),
      ...(status ? { status } : {}),
    };

    const orders = await prisma.order.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      include: {
        Customer: true,
        Rating: true,
        // Notifications: {
        //   orderBy: {
        //     created_at: "desc",
        //   },
        // },
      },
    });

    return res.json(orders);
  } catch (error) {
    console.error("Get Worker Orders Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// UPLOAD BIT PAYMENT PROOF
// ---------------------------
exports.uploadBitProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { uploadedBy } = req.body;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    if (!uploadedBy) {
      return res.status(400).json({ error: "uploadedBy is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Payment proof image is required" });
    }

    const orderId = BigInt(id);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customer_user_id: true,
        worker_id: true,
        payment_method: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.payment_method !== "BIT") {
      return res.status(400).json({
        error: "Payment proof can only be uploaded for Bit payments",
      });
    }

    const imageUrl = `/uploads/payment-proofs/${req.file.filename}`;

    await prisma.orderPaymentProof.create({
      data: {
        order_id: orderId,
        image_url: imageUrl,
        uploaded_by: BigInt(uploadedBy),
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_status: "PENDING_VERIFICATION",
        updated_at: new Date(),
      },
      include: {
        Customer: true,
        Worker: {
          include: {
            user: true,
          },
        },
        PaymentProofs: true,
      },
    });

    await createNotification({
      userId: order.worker_id,
      orderId: order.id,
      type: "PAYMENT_UPDATED",
      title: "Bit payment proof uploaded",
      message: "The customer uploaded a Bit payment confirmation screenshot.",
    });

    return res.status(201).json(updatedOrder);
  } catch (error) {
    console.error("Upload Bit Proof Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// CONFIRM BIT PAYMENT
// ---------------------------
exports.confirmBitPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedBy } = req.body;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    if (!confirmedBy) {
      return res.status(400).json({ error: "confirmedBy is required" });
    }

    const orderId = BigInt(id);

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customer_user_id: true,
        worker_id: true,
        payment_method: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existingOrder.payment_method !== "BIT") {
      return res.status(400).json({
        error: "Only Bit payments can be confirmed here",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_status: "PAID",
        payment_confirmed_at: new Date(),
        payment_confirmed_by: BigInt(confirmedBy),
        updated_at: new Date(),
      },
      include: {
        Customer: true,
        Worker: {
          include: {
            user: true,
          },
        },
        PaymentProofs: true,
      },
    });

    await createNotification({
      userId: existingOrder.customer_user_id,
      orderId: existingOrder.id,
      type: "PAYMENT_UPDATED",
      title: "Payment confirmed",
      message: "Your Bit payment was confirmed by the worker.",
    });

    return res.json(updatedOrder);
  } catch (error) {
    console.error("Confirm Bit Payment Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// REJECT BIT PAYMENT
// ---------------------------
exports.rejectBitPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const orderId = BigInt(id);

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customer_user_id: true,
        payment_method: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (existingOrder.payment_method !== "BIT") {
      return res.status(400).json({
        error: "Only Bit payments can be rejected here",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_status: "REJECTED",
        payment_notes: reason || "Bit payment proof was rejected.",
        updated_at: new Date(),
      },
      include: {
        Customer: true,
        Worker: {
          include: {
            user: true,
          },
        },
        PaymentProofs: true,
      },
    });

    await createNotification({
      userId: existingOrder.customer_user_id,
      orderId: existingOrder.id,
      type: "PAYMENT_UPDATED",
      title: "Bit payment rejected",
      message: reason || "Your Bit payment proof was rejected.",
    });

    return res.json(updatedOrder);
  } catch (error) {
    console.error("Reject Bit Payment Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
