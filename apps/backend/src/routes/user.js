const express = require("express");
const {
  createUser,
  getUserById,
  deleteUser,
  updateUser,
  checkIfUserIsWorker,
} = require("../controllers/user");
const router = express.Router();

const { getUserOrders } = require("../controllers/order");

router.post("/users", createUser);

router.get("/user/:id", getUserById);

router.delete("/user/:id", deleteUser);

router.put("/user/:id", updateUser);

router.get("/user/:id/is-worker", checkIfUserIsWorker);

router.get("/user/:id/orders", getUserOrders);

module.exports = router;
