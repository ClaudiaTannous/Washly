const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

/* ----------------------------------------------------
   REQUIRE AUTH — USER MUST BE LOGGED IN
---------------------------------------------------- */
exports.requireAuth = (req, res, next) => {
  let token = null;

  // 1️⃣ Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2️⃣ HTTP-only cookie fallback
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  // No token at all
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Save token payload: { userId, email, iat, exp }
    req.user = decoded;

    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/* ----------------------------------------------------
   REQUIRE WORKER — USER MUST BE A WORKER
---------------------------------------------------- */
exports.requireWorker = async (req, res, next) => {
  try {
    const userId = BigInt(req.user.userId);

    const worker = await prisma.worker.findUnique({
      where: { id: userId },
    });

    if (!worker) {
      return res.status(403).json({ error: "Worker access only" });
    }

    next();
  } catch (error) {
    console.error("requireWorker error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
