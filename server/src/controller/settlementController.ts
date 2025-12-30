import { Request, Response } from 'express';
import { settlementService } from '../service/settlementService';
import {
    CreateSettlementRequest,
    SettlementResponse,
    SuggestedSettlement
} from '../type/settlement';
import { ApiResponse } from '../type/group';

export const settlementController = {
    async createSettlement(
        req: Request<{ groupId: string }, {}, CreateSettlementRequest>,
        res: Response<ApiResponse<SettlementResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId } = req.params;
            const { toUserId, amount } = req.body;

            if (!toUserId || !amount) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Recipient and amount are required', code: 'VALIDATION_ERROR' }
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

            const settlement = await settlementService.createSettlement(req.user.userId, groupId, req.body);
            res.status(201).json({ success: true, data: settlement });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create settlement';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_SETTLEMENT_ERROR' } });
        }
    },

    async getSettlementsByGroup(
        req: Request<{ groupId: string }>,
        res: Response<ApiResponse<SettlementResponse[]>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId } = req.params;
            const settlements = await settlementService.getSettlementsByGroup(req.user.userId, groupId);
            res.status(200).json({ success: true, data: settlements });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get settlements';
            res.status(400).json({ success: false, error: { message, code: 'GET_SETTLEMENTS_ERROR' } });
        }
    },

    async getSuggestedSettlements(
        req: Request<{ groupId: string }>,
        res: Response<ApiResponse<SuggestedSettlement[]>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId } = req.params;
            const suggestions = await settlementService.getSuggestedSettlements(req.user.userId, groupId);
            res.status(200).json({ success: true, data: suggestions });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get suggested settlements';
            res.status(400).json({ success: false, error: { message, code: 'GET_SUGGESTIONS_ERROR' } });
        }
    }
};
