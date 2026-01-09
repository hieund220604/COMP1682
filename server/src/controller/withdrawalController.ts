import { Request, Response } from 'express';
import { withdrawalService } from '../service/withdrawalService';
import { CreateWithdrawalRequest, VerifyOtpRequest, WithdrawalResponse, WithdrawalSuccessResponse } from '../type/withdrawal';
import { ApiResponse } from '../type/group';

export const withdrawalController = {
    async initiateWithdrawal(
        req: Request<{}, {}, CreateWithdrawalRequest>,
        res: Response<ApiResponse<WithdrawalResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { amount, accountNumber, bankName, accountName } = req.body;

            if (!amount || !accountNumber || !bankName || !accountName) {
                res.status(400).json({
                    success: false,
                    error: { message: 'All fields are required: amount, accountNumber, bankName, accountName', code: 'VALIDATION_ERROR' }
                });
                return;
            }

            const withdrawal = await withdrawalService.initiateWithdrawal(req.user.userId, req.body);
            res.status(201).json({ success: true, data: withdrawal });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initiate withdrawal';
            const statusCode = message.includes('Insufficient balance') ? 400 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'INITIATE_WITHDRAWAL_ERROR' } });
        }
    },

    async resendOTP(
        req: Request<{ withdrawalId: string }, {}, {}>,
        res: Response<ApiResponse<WithdrawalSuccessResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { withdrawalId } = req.params;

            if (!withdrawalId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Withdrawal ID is required', code: 'VALIDATION_ERROR' }
                });
                return;
            }

            // Verify withdrawal belongs to user
            const withdrawal = await withdrawalService.getWithdrawalStatus(withdrawalId, req.user.userId);

            const result = await withdrawalService.resendOTP(withdrawalId, req.user.email);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resend OTP';
            res.status(400).json({ success: false, error: { message, code: 'RESEND_OTP_ERROR' } });
        }
    },

    async verifyOTP(
        req: Request<{ withdrawalId: string }, {}, VerifyOtpRequest>,
        res: Response<ApiResponse<WithdrawalSuccessResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { withdrawalId } = req.params;
            const { otp } = req.body;

            if (!otp) {
                res.status(400).json({
                    success: false,
                    error: { message: 'OTP is required', code: 'VALIDATION_ERROR' }
                });
                return;
            }

            // Verify withdrawal belongs to user
            await withdrawalService.getWithdrawalStatus(withdrawalId, req.user.userId);

            const result = await withdrawalService.verifyOTP(withdrawalId, otp);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to verify OTP';
            const statusCode = message.includes('expired') ? 400 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'VERIFY_OTP_ERROR' } });
        }
    },


    async getWithdrawalStatus(
        req: Request<{ withdrawalId: string }, {}, {}>,
        res: Response<ApiResponse<WithdrawalResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { withdrawalId } = req.params;

            const withdrawal = await withdrawalService.getWithdrawalStatus(withdrawalId, req.user.userId);
            res.status(200).json({ success: true, data: withdrawal });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get withdrawal status';
            const statusCode = message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'GET_WITHDRAWAL_ERROR' } });
        }
    },

    async getUserWithdrawals(
        req: Request,
        res: Response<ApiResponse<WithdrawalResponse[]>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const withdrawals = await withdrawalService.getUserWithdrawals(req.user.userId);
            res.status(200).json({ success: true, data: withdrawals });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get withdrawals';
            res.status(400).json({ success: false, error: { message, code: 'GET_WITHDRAWALS_ERROR' } });
        }
    }
};
