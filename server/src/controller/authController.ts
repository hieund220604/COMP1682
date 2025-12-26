import { Request, Response } from 'express';
import { authService } from '../service/authService';
import { SignUpRequest, LoginRequest, VerifyOTPRequest, ResetPasswordRequest, VeriftEmailRequest, AuthResponse } from '../type/auth';

export const authController = {
    async signUp(req: Request<{}, {}, SignUpRequest>, res: Response<AuthResponse>): Promise<void> {
        try {
            const { email, password, displayName } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required' });
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400).json({ success: false, message: 'Invalid email format' });
                return;
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                res.status(400).json({ success: false, message: 'Invalid password format' });
                return;
            }

            const result = await authService.SignUpUser(email, password, displayName);
            res.status(201).json({ success: true, message: 'User created successfully', data: { user: result } });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sign up error';
            res.status(400).json({ success: false, message: 'Failed to create user', error: message });
        }
    },
    async verifyOTP(req: Request<{}, {}, VerifyOTPRequest>, res: Response<AuthResponse>): Promise<void> {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                res.status(400).json({ success: false, message: 'Email and OTP are required' });
                return;
            }
            const result = await authService.verifyOTP(email, otp);
            res.status(200).json({ success: true, message: 'OTP verified successfully', data: { user: result } });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Verify OTP error';
            res.status(400).json({ success: false, message: 'Failed to verify OTP', error: message });
        }
    },
    async resendOTP(req: Request<{}, {}, { email: string }>, res: Response<AuthResponse>): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ success: false, message: 'Email is required' });
                return;
            }
            const result = await authService.resendOTP(email);
            res.status(200).json({ success: true, message: 'OTP resent successfully' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Resend OTP error';
            res.status(400).json({ success: false, message: 'Failed to resend OTP', error: message });
        }
    },

    async loginUser(req: Request<{}, {}, LoginRequest>, res: Response<AuthResponse>): Promise<void> {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required' });
                return;
            }
            const user = await authService.loginUser(email, password);
            res.status(200).json({ success: true, message: 'User logged in successfully', data: { user } });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Login error';
            res.status(400).json({ success: false, message: 'Failed to log in user', error: message });
        }
    },
    async resetPassword(req: Request<{}, {}, ResetPasswordRequest>, res: Response<AuthResponse>): Promise<void> {
        try {
            const { email, newPassword } = req.body;
            if (!email || !newPassword) {
                res.status(400).json({ success: false, message: 'Email and new password are required' });
                return;
            }
            const user = await authService.resetPassword(email, newPassword);
            res.status(200).json({ success: true, message: 'Password reset successfully', data: { user } });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Reset password error';
            res.status(400).json({ success: false, message: 'Failed to reset password', error: message });
        }
    },
    async getCurrentUser(req: Request, res: Response<AuthResponse>): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const user = await authService.getUserProfilebyID(req.user.userId);
            res.status(200).json({ success: true, message: 'Current user fetched successfully', data: { user } });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Get current user error';
            res.status(400).json({ success: false, message: 'Failed to get current user', error: message });
        }
    },

    async updateProfile(req: Request<{}, {}, { displayName?: string, avatarUrl?: string }>, res: Response<AuthResponse>): Promise<void> {
        try {
            if (!req.user)
                res.status(401).json({ success: false, message: 'Unauthorized' });
            const { displayName, avatarUrl } = req.body;
            const updatedUser = await authService.updateProfile(req.user!.userId, { displayName, avatarUrl });
            res.status(200).json({ success: true, message: 'Profile updated successfully', data: { user: updatedUser } });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Update profile error';
            res.status(400).json({ success: false, message: 'Failed to update profile', error: message });
        }
    }
};