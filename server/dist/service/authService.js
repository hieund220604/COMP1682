"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../prisma");
const emailService_1 = require("./emailService");
exports.authService = {
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    },
    async comparePassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    },
    generateToken(userId, email) {
        const payload = { userId, email };
        const options = { expiresIn: '7d' };
        return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'default_secret', options);
    },
    verifyToken(token) {
        try {
            const decode = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'hieu2206');
            return decode;
        }
        catch (error) {
            return null;
        }
    },
    async SignUpUser(email, password, displayName) {
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('Email is already registered');
        }
        const hashedPassword = await this.hashPassword(password);
        const newUser = await prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                displayName: displayName || email.split('@')[0],
                status: "inactive"
            },
        });
        await emailService_1.emailService.sendOTP(email);
        return {
            userId: newUser.id,
            email: newUser.email,
            displayName: newUser.displayName,
            message: 'User registered successfully. Please verify your email to activate your account.'
        };
    },
    async verifyOTP(email, otp) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        if (!emailService_1.emailService.verifyOTP(email, otp)) {
            throw new Error('Invalid or expired OTP');
        }
        const updatedUser = await prisma_1.prisma.user.update({
            where: { email },
            data: { status: 'active' },
        });
        await emailService_1.emailService.sendWelcomeEmail(email, updatedUser.displayName || '');
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
    async loginUser(email, password) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
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
    async passwordResetRequest(email) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return 'If the email is registered, a password reset link has been sent.';
        }
        const resetOptions = { expiresIn: '1h' };
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, type: 'reset' }, process.env.JWT_SECRET || 'default_secret', resetOptions);
        await emailService_1.emailService.sendPasswordResetEmail(email, resetToken);
        return 'If the email is registered, a password reset link has been sent.';
    },
    async resetPassword(resetToken, newPassword) {
        try {
            const decoded = jsonwebtoken_1.default.verify(resetToken, process.env.JWT_SECRET || 'default_secret');
            if (decoded.type !== 'reset') {
                throw new Error('Invalid token type');
            }
            const passsowrdHash = await this.hashPassword(newPassword);
            const updatedUser = await prisma_1.prisma.user.update({
                where: { id: decoded.userId },
                data: { passwordHash: passsowrdHash },
            });
            ;
            return {
                email: updatedUser.email,
                message: 'Password has been reset successfully.'
            };
        }
        catch (error) {
            throw new Error('Invalid or expired reset token');
        }
    },
    async resendOTP(email) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.status === 'active') {
            throw new Error('Account is already active');
        }
        await emailService_1.emailService.sendOTP(email);
        return 'A new OTP has been sent to your email.';
    },
    async getUserProfilebyID(userId) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, displayName: true, avatarUrl: true, status: true, createdAt: true, updatedAt: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    },
    async updateProfile(userId, data) {
        const user = await prisma_1.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true, email: true, displayName: true, avatarUrl: true
            }
        });
        return user;
    }
};
