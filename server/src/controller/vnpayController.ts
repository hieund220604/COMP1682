import { Request, Response } from 'express';
import { vnpayService } from '../service/vnpayService';
import { CreatePaymentRequest, PaymentResponse } from '../type/vnpay';
import { ApiResponse } from '../type/group';

export const vnpayController = {
    async createPayment(
        req: Request<{}, {}, CreatePaymentRequest>,
        res: Response<ApiResponse<PaymentResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { settlementId, returnUrl } = req.body;

            if (!settlementId || !returnUrl) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Settlement ID and return URL are required', code: 'VALIDATION_ERROR' }
                });
                return;
            }

            // Get client IP
            const ipAddr = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

            const payment = await vnpayService.createPaymentUrl(settlementId, returnUrl, ipAddr);
            res.status(200).json({ success: true, data: payment });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create payment';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_PAYMENT_ERROR' } });
        }
    },

    async vnpayReturn(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const query = req.query as Record<string, string>;
            const result = await vnpayService.verifyReturnUrl(query);

            if (result.isValid) {
                // Redirect to success page or return success response
                res.status(200).json({
                    success: true,
                    message: result.message,
                    data: { settlementId: result.settlementId }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Payment verification failed';
            res.status(400).json({ success: false, error: { message, code: 'VERIFY_PAYMENT_ERROR' } });
        }
    },

    async vnpayIPN(
        req: Request,
        res: Response
    ): Promise<void> {
        try {
            const query = req.query as Record<string, string>;
            const result = await vnpayService.handleIPN(query);

            // VNPay expects specific response format
            res.status(200).json(result);
        } catch (error) {
            res.status(200).json({
                RspCode: '99',
                Message: 'Unknown error'
            });
        }
    }
};
