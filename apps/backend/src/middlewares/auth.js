const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

exports.requireAuth = (req, res, next) => {
  let token = null;

  // 1) Try Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { userId, role, iat, exp }
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

exports.requireWorker = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (req.user.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }
  next();
};

exports.requireSelfOrAdmin = (req, res, next) => {
  const paramId = String(req.params.id);
  const loggedInId = String(req.user.userId);

  if (paramId !== loggedInId) {
    return res.status(403).json({ error: "You can only modify your own data" });
  }

  next();
};
