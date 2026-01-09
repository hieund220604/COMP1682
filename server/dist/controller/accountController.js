"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountController = void 0;
const accountService_1 = require("../service/accountService");
const vnpayService_1 = require("../service/vnpayService");
const account_1 = require("../type/account");
exports.accountController = {
    async initiateTopUp(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { accountId, amount, returnUrl } = req.body;
            if (!accountId || !amount || !returnUrl) {
                res.status(400).json({
                    success: false,
                    error: { message: 'AccountID, amount and return URL are required', code: 'VALIDATION_ERROR' }
                });
                return;
            }
            // Get client IP
            const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            // Create pending top-up record
            const topUpId = await accountService_1.accountService.createTopUp(accountId, amount);
            // Generate VNPay URL
            const payment = await vnpayService_1.vnpayService.createTopUpUrl(topUpId, amount, returnUrl, ipAddr);
            res.status(200).json({
                success: true,
                data: {
                    id: topUpId,
                    accountId,
                    amount,
                    status: account_1.TopUpStatus.PENDING,
                    paymentUrl: payment.paymentUrl,
                    createdAt: new Date()
                }
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initiate top-up';
            res.status(400).json({ success: false, error: { message, code: 'TOPUP_ERROR' } });
        }
    }
};
