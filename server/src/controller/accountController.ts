import { Request, Response } from 'express';
import { accountService } from '../service/accountService';
import { vnpayService } from '../service/vnpayService';
import { CreateTopUpRequest, TopUpResponse, TopUpStatus } from '../type/account';
import { ApiResponse } from '../type/group';

export const accountController = {
    async initiateTopUp(
        req: Request<{}, {}, CreateTopUpRequest>,
        res: Response<ApiResponse<TopUpResponse>>
    ): Promise<void> {
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
            const ipAddr = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';

            // Create pending top-up record
            const topUpId = await accountService.createTopUp(accountId, amount);

            // Generate VNPay URL
            const payment = await vnpayService.createTopUpUrl(topUpId, amount, returnUrl, ipAddr);

            res.status(200).json({
                success: true,
                data: {
                    id: topUpId,
                    accountId,
                    amount,
                    status: TopUpStatus.PENDING,
                    paymentUrl: payment.paymentUrl,
                    createdAt: new Date()
                }
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to initiate top-up';
            res.status(400).json({ success: false, error: { message, code: 'TOPUP_ERROR' } });
        }
    }
};
