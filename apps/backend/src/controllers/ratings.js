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
    // The frontend should only send: orderId, score, comment
    if (!body.orderId || body.score == null) {
      return res.status(400).json({
        error: "Missing required fields (orderId, score)",
      });
    }

    // 2) Validate orderId format
    if (!/^\d+$/.test(String(body.orderId))) {
      return res.status(400).json({
        error: "Invalid order id format",
      });
    }

    const orderId = BigInt(body.orderId);

    // Important:
    // raterId must come from the logged-in user, not from the request body
    const loggedInUserId = req.user?.userId ?? req.user?.id;

    if (!loggedInUserId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const raterId = BigInt(loggedInUserId);
    const score = Number(body.score);

    // 3) Validate score
    if (!Number.isInteger(score) || score < MIN_SCORE || score > MAX_SCORE) {
      return res.status(400).json({
        error: `score must be an integer between ${MIN_SCORE} and ${MAX_SCORE}`,
      });
    }

    // 4) Load order and validate ownership/status
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        status: true,
        customer_user_id: true,
        worker_id: true,
        Rating: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // Only the customer who placed the order can rate it
    if (order.customer_user_id !== raterId) {
      return res.status(403).json({
        error: "Only the customer who placed the order can rate it",
      });
    }

    // Order must be completed before rating
    if (order.status !== "COMPLETED") {
      return res.status(400).json({
        error: "Order must be COMPLETED before it can be rated",
      });
    }

    // Prevent duplicate ratings
    if (order.Rating) {
      return res.status(409).json({
        error: "Order has already been rated",
      });
    }

    // 5) Create rating
    const rating = await prisma.rating.create({
      data: {
        order_id: orderId,
        rater_id: raterId,
        rated_worker: order.worker_id,
        score,
        comment: body.comment || null,

        Photos: req.files?.length
          ? {
              create: req.files.map((file, index) => ({
                image_url: `/uploads/ratings/${file.filename}`,
                is_cover: index === 0,
              })),
            }
          : undefined,
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
        Order: {
          select: {
            id: true,
            status: true,
          },
        },
        Photos: true,
      },
    });

    return res.status(201).json({
      message: "Rating created successfully",
      rating,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Duplicate rating",
      });
    }

    console.error("Create Rating Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// GET RATING BY ORDER ID
// ---------------------------
exports.getRatingByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!/^\d+$/.test(String(orderId))) {
      return res.status(400).json({
        error: "Invalid order id format",
      });
    }

    const rating = await prisma.rating.findUnique({
      where: {
        order_id: BigInt(orderId),
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
        Order: {
          select: {
            id: true,
            status: true,
            customer_user_id: true,
            worker_id: true,
          },
        },

        // Your schema has RatingPhoto, but no Media relation
        Photos: true,
      },
    });

    if (!rating) {
      return res.status(404).json({
        error: "Rating not found",
      });
    }

    return res.json(rating);
  } catch (error) {
    console.error("Get Rating Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// GET ALL RATINGS FOR WORKER
// ---------------------------
exports.getWorkerRatings = async (req, res) => {
  try {
    const { workerId } = req.params;

    // 1) Validate workerId format
    if (!/^\d+$/.test(String(workerId))) {
      return res.status(400).json({
        error: "Invalid worker id format",
      });
    }

    // 2) Query ratings
    const ratings = await prisma.rating.findMany({
      where: {
        rated_worker: BigInt(workerId),
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        // Customer who wrote the rating
        Rater: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },

        // Photos attached to rating
        // No Media include because Media is not in your current schema
        Photos: true,

        // Related order info
        Order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // 3) Calculate rating summary
    const averageScore =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating.score, 0) /
          ratings.length
        : 0;

    const ratingsWithPhotoUrls = ratings.map((rating) => ({
      ...rating,
      Photos: rating.Photos.map((photo) => ({
        ...photo,
        full_image_url: `${req.protocol}://${req.get("host")}${photo.image_url}`,
      })),
    }));

    return res.json({
      ratings: ratingsWithPhotoUrls,
      averageScore: Number(averageScore.toFixed(1)),
      totalRatings: ratings.length,
    });
  } catch (error) {
    console.error("Get Worker Ratings Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// DELETE RATING
// ---------------------------
exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid rating id format",
      });
    }

    await prisma.rating.delete({
      where: {
        id: BigInt(id),
      },
    });

    return res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Rating not found",
      });
    }

    console.error("Delete Rating Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};
