"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpayController = void 0;
const vnpayService_1 = require("../service/vnpayService");
exports.vnpayController = {
    async createPayment(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { settlementId } = req.body;
            if (!settlementId) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Settlement ID is required', code: 'VALIDATION_ERROR' }
                });
                return;
            }
            // Get client IP
            const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            // Get return URL from env
            const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:8080/api/payments/vnpay-return';
            const payment = await vnpayService_1.vnpayService.createPaymentUrl(settlementId, returnUrl, ipAddr);
            res.status(200).json({ success: true, data: payment });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create payment';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_PAYMENT_ERROR' } });
        }
    },
    async createTopUp(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { amount } = req.body;
            if (!amount) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Amount is required', code: 'VALIDATION_ERROR' }
                });
                return;
            }
            if (amount <= 0) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Amount must be greater than 0', code: 'VALIDATION_ERROR' }
                });
                return;
            }
            // Get client IP
            const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            // Get return URL from env
            const returnUrl = process.env.VNPAY_RETURN_URL || 'http://localhost:8080/api/payments/vnpay-return';
            // Create TopUp record with current user's ID
            const topUpId = await require('../service/accountService').accountService.createTopUp(req.user.userId, amount);
            // Generate payment URL
            const payment = await vnpayService_1.vnpayService.createTopUpUrl(topUpId, amount, returnUrl, ipAddr);
            res.status(200).json({ success: true, data: payment });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create top-up payment';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_TOPUP_ERROR' } });
        }
    },
    async vnpayReturn(req, res) {
        try {
            const query = req.query;
            const result = await vnpayService_1.vnpayService.verifyReturnUrl(query);
            if (result.isValid) {
                // Redirect to success page or return success response
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: { settlementId: result.settlementId }
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Payment verification failed';
            res.status(400).json({ success: false, error: { message, code: 'VERIFY_PAYMENT_ERROR' } });
        }
    },
    async vnpayIPN(req, res) {
        try {
            const query = req.query;
            const result = await vnpayService_1.vnpayService.handleIPN(query);
            // VNPay expects specific response format
            res.status(200).json(result);
        }
        catch (error) {
            res.status(200).json({
                RspCode: '99',
                Message: 'Unknown error'
            });
        }
    }
};
