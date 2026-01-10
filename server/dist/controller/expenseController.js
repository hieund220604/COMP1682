"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseController = void 0;
const expenseService_1 = require("../service/expenseService");
exports.expenseController = {
    async createExpense(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const { title, amountTotal, splitType, shares, items } = req.body;
            if (!title || !amountTotal || !splitType) {
                res.status(400).json({
                    success: false,
                    error: { message: 'Title, amount and split type are required', code: 'VALIDATION_ERROR' }
                });
                return;
            }
            // Validate: ITEM_BASED requires items, other types require shares
            if (splitType === 'ITEM_BASED') {
                if (!items || items.length === 0) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Items are required for ITEM_BASED split type', code: 'VALIDATION_ERROR' }
                    });
                    return;
                }
            }
            else {
                if (!shares || shares.length === 0) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Shares are required for this split type', code: 'VALIDATION_ERROR' }
                    });
                    return;
                }
            }
            const expense = await expenseService_1.expenseService.createExpense(req.user.userId, groupId, req.body);
            res.status(201).json({ success: true, data: expense });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create expense';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_EXPENSE_ERROR' } });
        }
    },
    async getExpenseById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId, expenseId } = req.params;
            const expense = await expenseService_1.expenseService.getExpenseById(req.user.userId, groupId, expenseId);
            res.status(200).json({ success: true, data: expense });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get expense';
            res.status(400).json({ success: false, error: { message, code: 'GET_EXPENSE_ERROR' } });
        }
    },
    async getExpensesByGroup(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { expenses, total } = await expenseService_1.expenseService.getExpensesByGroup(req.user.userId, groupId, page, limit);
            const meta = {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            };
            res.status(200).json({ success: true, data: expenses, meta });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get expenses';
            res.status(400).json({ success: false, error: { message, code: 'GET_EXPENSES_ERROR' } });
        }
    },
    async updateExpense(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId, expenseId } = req.params;
            const expense = await expenseService_1.expenseService.updateExpense(req.user.userId, groupId, expenseId, req.body);
            res.status(200).json({ success: true, data: expense });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update expense';
            res.status(400).json({ success: false, error: { message, code: 'UPDATE_EXPENSE_ERROR' } });
        }
    },
    async deleteExpense(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }
            const { groupId, expenseId } = req.params;
            await expenseService_1.expenseService.deleteExpense(req.user.userId, groupId, expenseId);
            res.status(200).json({ success: true, data: null });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete expense';
            res.status(400).json({ success: false, error: { message, code: 'DELETE_EXPENSE_ERROR' } });
        }
    }
};
