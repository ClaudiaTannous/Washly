const express = require("express");

const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notifications");

const router = express.Router();

router.get("/notifications/user/:userId", getUserNotifications);

router.patch("/notifications/:id/read", markNotificationAsRead);

router.patch(
  "/notifications/user/:userId/read-all",
  markAllNotificationsAsRead,
);

module.exports = router;
