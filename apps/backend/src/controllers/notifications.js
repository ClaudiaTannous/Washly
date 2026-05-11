const prisma = require("../prisma");

// ---------------------------
// GET USER NOTIFICATIONS
// ---------------------------
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!/^\d+$/.test(String(userId))) {
      return res.status(400).json({
        error: "Invalid user id format",
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: BigInt(userId),
      },
      orderBy: {
        created_at: "desc",
      },
      include: {
        Order: {
          select: {
            id: true,
            status: true,
            amount: true,
            created_at: true,
          },
        },
      },
    });

    return res.json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// MARK ONE NOTIFICATION AS READ
// ---------------------------
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        error: "Invalid notification id format",
      });
    }

    const notification = await prisma.notification.update({
      where: {
        id: BigInt(id),
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return res.json(notification);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    console.error("Mark Notification Read Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

// ---------------------------
// MARK ALL USER NOTIFICATIONS AS READ
// ---------------------------
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!/^\d+$/.test(String(userId))) {
      return res.status(400).json({
        error: "Invalid user id format",
      });
    }

    await prisma.notification.updateMany({
      where: {
        user_id: BigInt(userId),
        is_read: false,
      },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return res.json({
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
