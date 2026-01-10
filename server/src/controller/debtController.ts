import { Request, Response } from 'express';
import { settlementService } from '../service/settlementService';
import { vnpayService } from '../service/vnpayService';

export const debtController = {
    async getUserDebts(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;

            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            const debts = await settlementService.getUserDebts(userId, groupId);
            res.json({ success: true, data: debts });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Failed to get debts' }
            });
        }
    },

    async payWithBalance(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { settlementId } = req.params;

            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            const result = await settlementService.payWithBalance(userId, settlementId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Payment failed' }
            });
        }
    },

    async payWithVNPay(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { settlementId } = req.params;
            const { returnUrl } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            if (!returnUrl) {
                res.status(400).json({ success: false, error: { message: 'Return URL is required' } });
                return;
            }

            // Get client IP
            const ipAddr = req.headers['x-forwarded-for'] as string ||
                req.socket.remoteAddress ||
                '127.0.0.1';

            const result = await vnpayService.createPaymentUrl(settlementId, returnUrl, ipAddr);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Payment URL creation failed' }
            });
        }
    },

    /**
     * Quick pay: Trả nợ trực tiếp (tự động tạo settlement và thanh toán)
     */
    async quickPay(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;
            const { toUserId, amount, paymentMethod } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            if (!toUserId || !amount) {
                res.status(400).json({ success: false, error: { message: 'toUserId and amount are required' } });
                return;
            }

            const method = paymentMethod === 'VNPAY' ? 'VNPAY' : 'BALANCE';
            const result = await settlementService.quickPayDebt(userId, groupId, toUserId, amount, method);

            if (method === 'VNPAY' && result.status === 'PENDING') {
                // Need to redirect to VNPay
                const returnUrl = req.body.returnUrl || 'http://localhost:3000/payment-return';
                const ipAddr = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1';
                const vnpayResult = await vnpayService.createPaymentUrl(result.settlementId, returnUrl, ipAddr);
                res.json({ success: true, data: { ...result, paymentUrl: vnpayResult.paymentUrl } });
            } else {
                res.json({ success: true, data: result });
            }
        } catch (error) {
            res.status(400).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Quick pay failed' }
            });
        }
    },

    /**
     * Lấy các khoản tôi đang nợ (chờ thanh toán)
     */
    async getMyPendingDebts(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;

            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            const result = await settlementService.getMyPendingDebts(userId, groupId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Failed to get pending debts' }
            });
        }
    },

    /**
     * Lấy các khoản người khác đang nợ tôi
     */
    async getMyPendingCredits(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { groupId } = req.params;

            if (!userId) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
                return;
            }

            const result = await settlementService.getMyPendingCredits(userId, groupId);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: { message: error instanceof Error ? error.message : 'Failed to get pending credits' }
            });
        }
    }
};
