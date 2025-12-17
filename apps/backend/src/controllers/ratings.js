const prisma = require("../prisma");

// Allowed rating score range
const MIN_SCORE = 1;
const MAX_SCORE = 5;

// ---------------------------
// CREATE RATING (customer → worker)
// ---------------------------
exports.createRating = async (req, res) => {
  try {
    const body = req.body;

    // 1) Validate required fields
    if (
      !body.orderId ||
      !body.raterId ||
      !body.workerId ||
      body.score == null
    ) {
      return res.status(400).json({
        error: "Missing required fields (orderId, raterId, workerId, score)",
      });
    }

    const orderId = BigInt(body.orderId);
    const raterId = BigInt(body.raterId);
    const workerId = BigInt(body.workerId);
    const score = Number(body.score);

    // 2) Validate score
    if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
      return res.status(400).json({
        error: `score must be an integer between ${MIN_SCORE} and ${MAX_SCORE}`,
      });
    }

    // 3) Load order and validate ownership & status
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        customer_user_id: true,
        worker_id: true,
        Rating: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Only the customer who placed the order can rate
    if (order.customer_user_id !== raterId) {
      return res.status(403).json({
        error: "Only the customer who placed the order can rate it",
      });
    }

    // Rating must be for the same worker
    if (order.worker_id !== workerId) {
      return res.status(400).json({
        error: "Rating worker does not match order worker",
      });
    }

    // Order must be completed
    if (order.status !== "COMPLETED") {
      return res.status(400).json({
        error: "Order must be COMPLETED before it can be rated",
      });
    }

    // Prevent duplicate ratings (enforced also by schema @unique)
    if (order.Rating) {
      return res.status(409).json({
        error: "Order has already been rated",
      });
    }

    // 4) Create rating
    const rating = await prisma.rating.create({
      data: {
        order_id: orderId,
        rater_id: raterId,
        rated_worker: workerId,
        score,
        comment: body.comment || null,
      },
      include: {
        Rater: {
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
      },
    });

    return res.status(201).json(rating);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Duplicate rating" });
    }

    console.error("Create Rating Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET RATING BY ORDER ID
// ---------------------------
exports.getRatingByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!/^\d+$/.test(orderId)) {
      return res.status(400).json({ error: "Invalid order id format" });
    }

    const rating = await prisma.rating.findUnique({
      where: {
        order_id: BigInt(orderId),
      },
      include: {
        Rater: true,
        Worker: {
          include: {
            user: true,
          },
        },
        Photos: {
          include: {
            Media: true,
          },
        },
      },
    });

    if (!rating) {
      return res.status(404).json({ error: "Rating not found" });
    }

    return res.json(rating);
  } catch (error) {
    console.error("Get Rating Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// GET ALL RATINGS FOR WORKER
// ---------------------------
exports.getWorkerRatings = async (req, res) => {
  try {
    const { workerId } = req.params;

    // 1️⃣ Validate workerId format
    if (!/^\d+$/.test(workerId)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    // 2️⃣ Query ratings
    const ratings = await prisma.rating.findMany({
      where: {
        rated_worker: BigInt(workerId),
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        // who wrote the rating
        Rater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },

        // photos attached to rating (NO Media include – not in schema)
        Photos: true,

        // related order info (minimal, safe)
        Order: {
          select: {
            id: true,
          },
        },
      },
    });

    // 3️⃣ Return result
    return res.json(ratings);
  } catch (error) {
    console.error("Get Worker Ratings Error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ---------------------------
// DELETE RATING (admin or owner – optional use)
// ---------------------------
exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid rating id format" });
    }

    await prisma.rating.delete({
      where: { id: BigInt(id) },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Rating not found" });
    }

    console.error("Delete Rating Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
