const express = require("express");
const multer = require("multer");

const {
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
} = require("../controllers/ai");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/ai/worker/:workerId", getOrCreateConversation);

router.get("/ai/:conversationId/messages", getConversationMessages);

router.post(
  "/ai/:conversationId/messages",
  upload.single("image"),
  sendMessage,
);

module.exports = router;
