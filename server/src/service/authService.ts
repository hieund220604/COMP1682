import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { emailService } from './emailService';
import { JWTPayLoad } from '../type/auth';
import { error } from 'console';
import { get, STATUS_CODES } from 'http';
import { verify } from 'crypto';

const prisma = new PrismaClient();
export const authService = {
    async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },

    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword);
    },

    generateToken(userId: string, email: string): string {
        const payload: JWTPayLoad = { userId, email };
        const options: any = { expiresIn: '7d' };
        return jwt.sign(payload, process.env.JWT_SECRET || 'default_secret', options);
    },

    verifyToken(token: string): JWTPayLoad | null {
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET || 'hieu2206') as JWTPayLoad;
            return decode;
        }
        catch (error) {
            return null;
        }
    },

    async SignUpUser(email: string, password: string, displayName?: string): Promise<any> {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('Email is already registered');
        }
        const hashedPassword = await this.hashPassword(password);
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                displayName: displayName || email.split('@')[0],
                status: "inactive"
            },
        });
        await emailService.sendOTP(email);
        return {
            userId: newUser.id,
            email: newUser.email,
            displayName: newUser.displayName,
            message: 'User registered successfully. Please verify your email to activate your account.'
        };
    },

    async verifyOTP(email: string, otp: string): Promise<any> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        if (!emailService.verifyOTP(email, otp)) {
            throw new Error('Invalid or expired OTP');
        }
        const updatedUser = await prisma.user.update({
            where: { email },
            data: { status: 'active' },
        });
        await emailService.sendWelcomeEmail(email, updatedUser.displayName || '');
        return {
            user: {
                userId: updatedUser.id,
                email: updatedUser.email,
                displayName: updatedUser.displayName,
                message: 'Email verified successfully. Your account is now active.'
            },
            token: this.generateToken(updatedUser.id, updatedUser.email)
        };
    },

    async loginUser(email: string, password: string): Promise<any> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (user.status !== 'active') {
            throw new Error('Account is not active. Please verify your email.');
        }
        const isPasswordValid = await this.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = this.generateToken(user.id, user.email);
        return {
            user: {
                userId: user.id,
                email: user.email,
                displayName: user.displayName,
            },
            token
        };
    },

    async passwordResetRequest(email: string): Promise<string> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return 'If the email is registered, a password reset link has been sent.';
        }
        const resetOptions: any = { expiresIn: '1h' };
        const resetToken = jwt.sign({ userId: user.id, email: user.email, type: 'reset' }, process.env.JWT_SECRET || 'default_secret', resetOptions);
        await emailService.sendPasswordResetEmail(email, resetToken);
        return 'If the email is registered, a password reset link has been sent.';
    },

    async resetPassword(resetToken: string, newPassword: string): Promise<any> {
        try {
            const decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'default_secret') as any;
            if (decoded.type !== 'reset') {
                throw new Error('Invalid token type');
            }
            const passsowrdHash = await this.hashPassword(newPassword);
            const updatedUser = await prisma.user.update({
                where: { id: decoded.userId },
                data: { passwordHash: passsowrdHash },
            }
            );;
            return {
                email: updatedUser.email,
                message: 'Password has been reset successfully.'
            };
        }
        catch (error) {
            throw new Error('Invalid or expired reset token');
        }
    },
    async resendOTP(email: string): Promise<string> {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.status === 'active') {
            throw new Error('Account is already active');
        }
        await emailService.sendOTP(email);
        return 'A new OTP has been sent to your email.';
    },

    async getUserProfilebyID(userId: string): Promise<any> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, displayName: true, avatarUrl: true, status: true, createdAt: true, updatedAt: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    },

    async updateProfile(userId: string, data: { displayName?: string, avatarUrl?: string }): Promise<any> {
        const user = await prisma.user.update({
            where: { id: userId }
            , data,
            select: {
                id: true, email: true, displayName: true, avatarUrl: true
            }
        });
        return user;
    }
};
