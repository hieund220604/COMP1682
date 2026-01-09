import { PrismaClient } from '@prisma/client';
import { CreateWithdrawalRequest, WithdrawalResponse, WithdrawalSuccessResponse } from '../type/withdrawal';
import { emailService } from './emailService';

const prisma = new PrismaClient();

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function transformWithdrawal(withdrawal: {
    id: string;
    userId: string;
    amount: any;
    currency: string;
    accountNumber: string;
    bankName: string;
    accountName: string;
    status: string;
    otpExpiresAt: Date | null;
    verifiedAt: Date | null;
    createdAt: Date;
}): WithdrawalResponse {
    return {
        id: withdrawal.id,
        userId: withdrawal.userId,
        amount: Number(withdrawal.amount),
        currency: withdrawal.currency,
        accountNumber: withdrawal.accountNumber,
        bankName: withdrawal.bankName,
        accountName: withdrawal.accountName,
        status: withdrawal.status,
        otpExpiresAt: withdrawal.otpExpiresAt ?? undefined,
        verifiedAt: withdrawal.verifiedAt ?? undefined,
        createdAt: withdrawal.createdAt
    };
}

export const withdrawalService = {
    async initiateWithdrawal(userId: string, data: CreateWithdrawalRequest): Promise<WithdrawalResponse> {
        // Verify user exists and has enough balance
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Convert Decimal to number for comparison
        const userBalance = Number(user.balance);
        const requestAmount = Number(data.amount);

        if (userBalance < requestAmount) {
            throw new Error(`Insufficient balance. Available: ${userBalance}, Requested: ${requestAmount}`);
        }

        if (requestAmount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        // Generate 6-digit OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Create withdrawal record with PENDING status + OTP
        const withdrawal = await prisma.withdrawal.create({
            data: {
                userId,
                amount: data.amount,
                currency: 'VND',
                accountNumber: data.accountNumber,
                bankName: data.bankName,
                accountName: data.accountName,
                status: 'OTP_SENT',
                otp,
                otpExpiresAt
            }
        });

        // Send OTP to user email (use sendOTPEmail to send with pre-generated OTP)
        try {
            await emailService.sendOTPEmail(user.email, otp);
        } catch (error) {
            console.error('Failed to send OTP email:', error);
            // Don't fail the entire request, just log it
        }

        return transformWithdrawal(withdrawal);
    },

    async resendOTP(withdrawalId: string, userEmail: string): Promise<WithdrawalSuccessResponse> {
        // Verify withdrawal exists and is in valid status for resend
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId }
        });

        if (!withdrawal) {
            throw new Error('Withdrawal not found');
        }

        if (withdrawal.status !== 'OTP_SENT' && withdrawal.status !== 'PENDING') {
            throw new Error(`Cannot resend OTP for withdrawal in ${withdrawal.status} status`);
        }

        // Generate new 6-digit OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Update withdrawal with new OTP
        await prisma.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                otp,
                otpExpiresAt,
                status: 'OTP_SENT'
            }
        });

        // Send OTP via email (use sendOTPEmail to send with pre-generated OTP)
        try {
            await emailService.sendOTPEmail(userEmail, otp);
        } catch (error) {
            console.error('Failed to send OTP email:', error);
            // Don't throw - OTP was generated and stored, just log warning
        }

        return {
            id: withdrawalId,
            status: 'OTP_SENT',
            message: `OTP sent to ${userEmail}. Valid for 10 minutes.`
        };
    },

    async verifyOTP(withdrawalId: string, otp: string): Promise<any> {
        // Get withdrawal
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId },
            include: { user: true }
        });

        if (!withdrawal) {
            throw new Error('Withdrawal not found');
        }

        if (withdrawal.status !== 'OTP_SENT') {
            throw new Error(`Cannot verify OTP for withdrawal in ${withdrawal.status} status`);
        }

        // Check OTP is not expired
        if (!withdrawal.otpExpiresAt || withdrawal.otpExpiresAt < new Date()) {
            throw new Error('OTP has expired. Please request a new OTP.');
        }

        // Verify OTP
        if (withdrawal.otp !== otp) {
            throw new Error('Invalid OTP');
        }

        // Deduct balance in atomic transaction
        const [updated, _] = await prisma.$transaction([
            prisma.withdrawal.update({
                where: { id: withdrawalId },
                data: {
                    status: 'COMPLETED',
                    verifiedAt: new Date(),
                    otp: null // Clear OTP after verification
                }
            }),
            prisma.user.update({
                where: { id: withdrawal.userId },
                data: {
                    balance: {
                        decrement: withdrawal.amount
                    }
                }
            })
        ]);

        // Get updated user balance
        const userUpdated = await prisma.user.findUnique({
            where: { id: withdrawal.userId }
        });

        return {
            success: true,
            message: 'Withdrawal completed successfully',
            withdrawal: {
                id: updated.id,
                amount: Number(updated.amount),
                status: 'COMPLETED',
                accountNumber: updated.accountNumber,
                bankName: updated.bankName,
                accountName: updated.accountName,
                verifiedAt: updated.verifiedAt
            },
            user: {
                id: userUpdated!.id,
                balance: Number(userUpdated!.balance)
            }
        };
    },

    async getWithdrawalStatus(withdrawalId: string, userId: string): Promise<WithdrawalResponse> {
        const withdrawal = await prisma.withdrawal.findUnique({
            where: { id: withdrawalId }
        });

        if (!withdrawal) {
            throw new Error('Withdrawal not found');
        }

        if (withdrawal.userId !== userId) {
            throw new Error('Permission denied');
        }

        return transformWithdrawal(withdrawal);
    },

    async getUserWithdrawals(userId: string): Promise<WithdrawalResponse[]> {
        const withdrawals = await prisma.withdrawal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        return withdrawals.map(transformWithdrawal);
    }
};
