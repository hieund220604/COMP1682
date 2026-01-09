"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controller/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/signup', authController_1.authController.signUp);
// Verify OTP and activate account
router.post('/verify-otp', authController_1.authController.verifyOTP);
// Resend OTP
router.post('/resend-otp', authController_1.authController.resendOTP);
// Login
router.post('/login', authController_1.authController.loginUser);
// Reset password with token
router.post('/reset-password', authController_1.authController.resetPassword);
// Get current user info
router.get('/me', authMiddleware_1.authMiddleware, authController_1.authController.getCurrentUser);
// Update user profile
router.patch('/profile', authMiddleware_1.authMiddleware, authController_1.authController.updateProfile);
exports.default = router;
