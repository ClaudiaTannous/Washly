const prisma = require("../prisma");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- HELPERS ---------------- */

function toOpenAIInput(messages) {
  return messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
}

/* ---------------- GET / CREATE CONVERSATION ---------------- */

exports.getOrCreateConversation = async (req, res) => {
  try {
    const workerIdRaw = req.params.workerId;

    if (!/^\d+$/.test(workerIdRaw)) {
      return res.status(400).json({ error: "Invalid worker id format" });
    }

    const workerId = BigInt(workerIdRaw);

    const conv = await prisma.aIConversation.upsert({
      where: { worker_id: workerId },
      update: {},
      create: { worker_id: workerId },
    });

    return res.json({
      id: conv.id.toString(),
      workerId: conv.worker_id.toString(),
    });
  } catch (error) {
    console.error("getOrCreateConversation error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ---------------- GET MESSAGES ---------------- */

exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!/^\d+$/.test(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation id format" });
    }

    const convId = BigInt(conversationId);

    const messages = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
    });

    return res.json(
      messages.map((m) => ({
        id: m.id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
    );
  } catch (error) {
    console.error("getConversationMessages error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ---------------- SEND MESSAGE ---------------- */

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    if (!/^\d+$/.test(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation id format" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Missing content" });
    }

    const convId = BigInt(conversationId);

    const conv = await prisma.aIConversation.findUnique({
      where: { id: convId },
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Save USER message
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "USER",
        content: content.trim(),
      },
    });

    // Load history
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    // Call OpenAI
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are Washly's Worker Assistant. Help the worker improve ratings, earnings, scheduling, and customer communication. Be concise and actionable.",
        },
        ...toOpenAIInput(history),
      ],
    });

    const aiText =
      (response.output_text || "").trim() ||
      "I couldn't generate a reply. Please try again.";

    // Save AI message
    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "AI",
        content: aiText,
      },
    });

    return res.status(201).json({
      reply: aiText,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ error: error.message });
  }
};
