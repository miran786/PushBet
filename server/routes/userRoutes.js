const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/get-by-email", userController.getUserByEmail);
router.get("/leaderboard/all", userController.getLeaderboard);
router.get("/:id", userController.getUserById);

module.exports = router;
