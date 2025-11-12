const express = require("express");
const dotenv = require("dotenv");
const { prisma } = require("./prisma"); // Make sure this file exists

dotenv.config();

const app = express();
app.use(express.json());

// root route
app.get("/", (req, res) => {
  res.send("Washly backend is running ✅");
});

// health check
app.get("/healthz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// database test
app.get("/test-db", async (_req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ ok: true, users: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT ;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
