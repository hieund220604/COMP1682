"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlementController = void 0;
const settlementService_1 = require("../service/settlementService");
exports.settlementController = {
    async createSettlement(req, res) {
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
            const settlement = await settlementService_1.settlementService.createSettlement(req.user.userId, groupId, req.body);
            res.status(201).json({ success: true, data: settlement });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create settlement';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_SETTLEMENT_ERROR' } });
        }
    },
    async getSettlementsByGroup(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const settlements = await settlementService_1.settlementService.getSettlementsByGroup(req.user.userId, groupId);
            res.status(200).json({ success: true, data: settlements });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get settlements';
            res.status(400).json({ success: false, error: { message, code: 'GET_SETTLEMENTS_ERROR' } });
        }
    },
    async getSuggestedSettlements(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const suggestions = await settlementService_1.settlementService.getSuggestedSettlements(req.user.userId, groupId);
            res.status(200).json({ success: true, data: suggestions });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get suggested settlements';
            res.status(400).json({ success: false, error: { message, code: 'GET_SUGGESTIONS_ERROR' } });
        }
    }
};
