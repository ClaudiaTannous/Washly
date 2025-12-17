const express = require("express");
const {
  getOrCreateConversation,
  getConversationMessages,
  sendMessage,
} = require("../controllers/ai");

const router = express.Router();

// Get or create conversation for a worker
router.get("/ai/worker/:workerId", getOrCreateConversation);

// Get messages by conversation
router.get("/ai/:conversationId/messages", getConversationMessages);

// Send a message
router.post("/ai/:conversationId/messages", sendMessage);

module.exports = router;
