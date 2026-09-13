// Make BigInt JSON-safe (for Prisma IDs)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

const prisma = require("./prisma");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const workerRoutes = require("./routes/worker");
const workerBusinessHoursRoutes = require("./routes/workerBusinessHours");
const orderRoutes = require("./routes/order");
const serviceCatalogRoutes = require("./routes/serviceCatalog");
const workerServiceRoutes = require("./routes/workerService");
const ratingRoutes = require("./routes/ratings");
const searchRoutes = require("./routes/search");
const aiRoutes = require("./routes/Ai");
const notificationRoutes = require("./routes/notifications");
const geoRoutes = require("./routes/geo");

dotenv.config();

const app = express();

/* ---------------------------------------------------
   REQUIRED FOR COOKIE AUTH TO WORK CROSS-ORIGIN
--------------------------------------------------- */
app.set("trust proxy", 1);

/* ---------------------------------------------------
   CORS CONFIG — WITH COOKIES
--------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "http://10.0.0.12:3000",
  // Comma-separated list of extra origins (e.g. your deployed Vercel
  // frontend URL) — set FRONTEND_URL in the backend's environment
  // variables instead of editing this file again after every deploy.
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((s) => s.trim())
    : []),
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ---------------------------------------------------
   MIDDLEWARES
--------------------------------------------------- */
app.use(cookieParser());
app.use(express.json());

/* ---------------------------------------------------
   Ensure uploads folder exists
--------------------------------------------------- */
const uploadRoot = path.join(__dirname, "..", "uploads");
const avatarFolder = path.join(uploadRoot, "avatars");

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot);
}

if (!fs.existsSync(avatarFolder)) {
  fs.mkdirSync(avatarFolder);
}

/* ---------------------------------------------------
   Static Serving for Uploads
--------------------------------------------------- */
app.use("/uploads", express.static(uploadRoot));

/* ---------------------------------------------------
   HEALTH + BASE ROUTES
--------------------------------------------------- */
app.get("/", (req, res) => {
  res.send("Washly backend is running");
});

app.get("/healthz", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      ok: true,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

app.get("/test-db", async (_req, res) => {
  try {
    const count = await prisma.user.count();

    res.json({
      ok: true,
      users: count,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

/* ---------------------------------------------------
   API ROUTES
--------------------------------------------------- */
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", workerRoutes);
app.use("/api", workerBusinessHoursRoutes);
app.use("/api", orderRoutes);
app.use("/api", serviceCatalogRoutes);
app.use("/api", workerServiceRoutes);
app.use("/api", searchRoutes);
app.use("/api", ratingRoutes);
app.use("/api", notificationRoutes);
app.use("/api", aiRoutes);
app.use("/api", geoRoutes);

/* ---------------------------------------------------
   START SERVER
--------------------------------------------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
