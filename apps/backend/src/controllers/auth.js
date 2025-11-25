const prisma = require("../prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { Worker: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const role = user.Worker ? "worker" : "customer";

    const token = signToken({
      userId: String(user.id),
      role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only over HTTPS in prod
      sameSite: "lax", // or "strict" if you want
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.json({
      token,
      user: {
        id: String(user.id),
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = BigInt(req.user.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { Worker: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const role = user.Worker ? "worker" : "customer";

    return res.json({
      id: String(user.id),
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role,
    });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
};
