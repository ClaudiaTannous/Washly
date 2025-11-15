const express = require("express");
const dotenv = require("dotenv");
const prisma = require("./prisma");
const cors = require("cors");

const workerRoutes = require("./routes/worker");
const userRoutes = require("./routes/user");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Washly backend is running ");
});

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

app.use("/api", workerRoutes);
app.use("/api", userRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
