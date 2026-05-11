const express = require("express");

const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notifications");

const router = express.Router();

// GET /api/notifications/user/:userId
router.get("/notifications/user/:userId", getUserNotifications);

// PATCH /api/notifications/:id/read
router.patch("/notifications/:id/read", markNotificationAsRead);

// PATCH /api/notifications/user/:userId/read-all
router.patch(
  "/notifications/user/:userId/read-all",
  markAllNotificationsAsRead,
);

module.exports = router;
