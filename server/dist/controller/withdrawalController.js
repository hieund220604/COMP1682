"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawalController = void 0;
const withdrawalService_1 = require("../service/withdrawalService");
exports.withdrawalController = {
    async initiateWithdrawal(req, res) {
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
            const withdrawal = await withdrawalService_1.withdrawalService.initiateWithdrawal(req.user.userId, req.body);
            res.status(201).json({ success: true, data: withdrawal });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initiate withdrawal';
            const statusCode = message.includes('Insufficient balance') ? 400 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'INITIATE_WITHDRAWAL_ERROR' } });
        }
    },
    async resendOTP(req, res) {
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
            const withdrawal = await withdrawalService_1.withdrawalService.getWithdrawalStatus(withdrawalId, req.user.userId);
            const result = await withdrawalService_1.withdrawalService.resendOTP(withdrawalId, req.user.email);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to resend OTP';
            res.status(400).json({ success: false, error: { message, code: 'RESEND_OTP_ERROR' } });
        }
    },
    async verifyOTP(req, res) {
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
            await withdrawalService_1.withdrawalService.getWithdrawalStatus(withdrawalId, req.user.userId);
            const result = await withdrawalService_1.withdrawalService.verifyOTP(withdrawalId, otp);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to verify OTP';
            const statusCode = message.includes('expired') ? 400 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'VERIFY_OTP_ERROR' } });
        }
    },
    async getWithdrawalStatus(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { withdrawalId } = req.params;
            const withdrawal = await withdrawalService_1.withdrawalService.getWithdrawalStatus(withdrawalId, req.user.userId);
            res.status(200).json({ success: true, data: withdrawal });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get withdrawal status';
            const statusCode = message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({ success: false, error: { message, code: 'GET_WITHDRAWAL_ERROR' } });
        }
    },
    async getUserWithdrawals(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const withdrawals = await withdrawalService_1.withdrawalService.getUserWithdrawals(req.user.userId);
            res.status(200).json({ success: true, data: withdrawals });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get withdrawals';
            res.status(400).json({ success: false, error: { message, code: 'GET_WITHDRAWALS_ERROR' } });
        }
    }
};
