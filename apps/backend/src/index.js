// Make BigInt JSON-safe (for Prisma IDs)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // 👈 NEW
const prisma = require("./prisma");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const workerRoutes = require("./routes/worker");
const workerBusinessHoursRoutes = require("./routes/workerBusinessHours");
const orderRoutes = require("./routes/order");
const serviceCatalogRoutes = require("./routes/serviceCatalog");
const workerServiceRoutes = require("./routes/workerService");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Washly backend is running");
});

app.get("/healthz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get("/test-db", async (_req, res) => {
  try {
    const count = await prisma.user.count();
    res.json({ ok: true, users: count });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 🔹 API routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", workerRoutes);
app.use("/api", workerBusinessHoursRoutes);
app.use("/api", orderRoutes);
app.use("/api", serviceCatalogRoutes);
app.use("/api", workerServiceRoutes);

// 🔹 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // optional, useful for tests
