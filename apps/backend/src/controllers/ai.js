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
      })),
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
    const image = req.file;

    if (!/^\d+$/.test(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation id format" });
    }

    if ((!content || !content.trim()) && !image) {
      return res.status(400).json({ error: "Missing content or image" });
    }

    const convId = BigInt(conversationId);

    const conv = await prisma.aIConversation.findUnique({
      where: { id: convId },
    });

    if (!conv) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const userText = content?.trim() || "Please analyze this image.";

    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "USER",
        content: image ? `${userText}\n[Image uploaded]` : userText,
      },
    });

    const history = await prisma.aIMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const openAIInput = [
      {
        role: "system",
        content:
          "You are Washly's Worker Assistant. Help the worker improve ratings, earnings, scheduling, and customer communication. Be concise and actionable.",
      },
      ...toOpenAIInput(history.slice(0, -1)),
    ];

    const currentUserContent = [
      {
        type: "input_text",
        text: userText,
      },
    ];

    if (image) {
      const base64Image = image.buffer.toString("base64");

      currentUserContent.push({
        type: "input_image",
        image_url: `data:${image.mimetype};base64,${base64Image}`,
      });
    }

    openAIInput.push({
      role: "user",
      content: currentUserContent,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: openAIInput,
    });

    const aiText =
      (response.output_text || "").trim() ||
      "I couldn't generate a reply. Please try again.";

    await prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: "AI",
        content: aiText,
      },
    });

    return res.status(201).json({
      reply: aiText,
      imageReceived: Boolean(image),
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ error: error.message });
  }
};
