const express = require("express");
const {
  createUser,
  getUserById,
  deleteUser,
  updateUser,
  checkIfUserIsWorker,
} = require("../controllers/user");
const router = express.Router();

router.post("/users", createUser);

router.get("/user/:id", getUserById);

router.delete("/user/:id", deleteUser);

router.put("/user/:id", updateUser);

router.get("/user/:id/is-worker", checkIfUserIsWorker);

module.exports = router;
