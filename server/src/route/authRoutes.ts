import { Router } from 'express';
import { authController } from '../controller/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/signup', authController.signUp);

// Verify OTP and activate account
router.post('/verify-otp', authController.verifyOTP);

// Resend OTP
router.post('/resend-otp', authController.resendOTP);

// Login
router.post('/login', authController.loginUser);

// Reset password with token
router.post('/reset-password', authController.resetPassword);

// Get current user info
router.get('/me', authMiddleware, authController.getCurrentUser);

// Update user profile
router.patch('/profile', authMiddleware, authController.updateProfile);

export default router;
