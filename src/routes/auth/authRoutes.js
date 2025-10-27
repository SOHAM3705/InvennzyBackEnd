const express = require("express");
const router = express.Router();
const { signup, login, forgotPassword, googleSignIn } = require("../../controllers/auth/authcontroller");

// Signup route (only for admin)
router.post("/signup", signup);

// Login route (for all user types)
router.post("/login", login);

// Forgot password route (for all user types)
router.post("/forgot-password", forgotPassword);

router.post("/google-signin", googleSignIn);

module.exports = router;