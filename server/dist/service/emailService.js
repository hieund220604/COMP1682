"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Store OTP in memory (in production, use Redis or database)
const otpStore = new Map();
// Configure your email service here
const transporter = nodemailer_1.default.createTransport({
    // For Gmail:
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
    },
    // For other services, use:
    // host: process.env.EMAIL_HOST,
    // port: parseInt(process.env.EMAIL_PORT || '587'),
    // secure: process.env.EMAIL_SECURE === 'true',
    // auth: {
    //   user: process.env.EMAIL_USER,
    //   pass: process.env.EMAIL_PASSWORD,
    // },
});
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
exports.emailService = {
    /**
     * Send OTP to email
     */
    async sendOTP(email) {
        const otp = generateOTP();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        otpStore.set(email, {
            otp,
            expiresAt,
            attempts: 0,
        });
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: 'OTP Verification Code - SplitPay',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Account</h2>
            <p>Your OTP verification code is:</p>
            <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <h1 style="color: #333; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #666; font-size: 12px;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
            });
            return otp;
        }
        catch (error) {
            console.error('Failed to send OTP:', error);
            throw new Error('Failed to send OTP email');
        }
    },
    /**
     * Verify OTP
     */
    verifyOTP(email, otp) {
        const record = otpStore.get(email);
        if (!record) {
            return false;
        }
        // Check if OTP is expired
        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return false;
        }
        // Check if OTP matches
        if (record.otp !== otp) {
            record.attempts += 1;
            // Delete after 3 failed attempts
            if (record.attempts >= 3) {
                otpStore.delete(email);
            }
            else {
                otpStore.set(email, record);
            }
            return false;
        }
        // OTP is valid, delete it
        otpStore.delete(email);
        return true;
    },
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset - SplitPay',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </div>
        `,
            });
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    },
    /**
     * Send welcome email
     */
    async sendWelcomeEmail(email, displayName) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
                to: email,
                subject: 'Welcome to SplitPay',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome ${displayName ? `${displayName}` : 'to SplitPay'}!</h2>
            <p>Your account has been successfully activated!</p>
            <p>You can now log in and start using the SplitPay app.</p>
            <p style="color: #666; font-size: 12px;">Thank you for joining our community!</p>
          </div>
        `,
            });
        }
        catch (error) {
            console.error('Failed to send welcome email:', error);
            // Don't throw error for welcome email
        }
    },
};
