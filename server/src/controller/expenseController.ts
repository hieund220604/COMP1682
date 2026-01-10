import { Request, Response } from 'express';
import { expenseService } from '../service/expenseService';
import {
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseResponse
} from '../type/expense';
import { ApiResponse, PaginationMeta } from '../type/group';

export const expenseController = {
    async createExpense(
        req: Request<{ groupId: string }, {}, CreateExpenseRequest>,
        res: Response<ApiResponse<ExpenseResponse>>
    ): Promise<void> {
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
            } else {
                if (!shares || shares.length === 0) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Shares are required for this split type', code: 'VALIDATION_ERROR' }
                    });
                    return;
                }
            }

            const expense = await expenseService.createExpense(req.user.userId, groupId, req.body);
            res.status(201).json({ success: true, data: expense });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create expense';
            res.status(400).json({ success: false, error: { message, code: 'CREATE_EXPENSE_ERROR' } });
        }
    },

    async getExpenseById(
        req: Request<{ groupId: string; expenseId: string }>,
        res: Response<ApiResponse<ExpenseResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId, expenseId } = req.params;
            const expense = await expenseService.getExpenseById(req.user.userId, groupId, expenseId);
            res.status(200).json({ success: true, data: expense });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get expense';
            res.status(400).json({ success: false, error: { message, code: 'GET_EXPENSE_ERROR' } });
        }
    },

    async getExpensesByGroup(
        req: Request<{ groupId: string }>,
        res: Response<ApiResponse<ExpenseResponse[]>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const { expenses, total } = await expenseService.getExpensesByGroup(req.user.userId, groupId, page, limit);

            const meta: PaginationMeta = {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            };

            res.status(200).json({ success: true, data: expenses, meta });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to get expenses';
            res.status(400).json({ success: false, error: { message, code: 'GET_EXPENSES_ERROR' } });
        }
    },

    async updateExpense(
        req: Request<{ groupId: string; expenseId: string }, {}, UpdateExpenseRequest>,
        res: Response<ApiResponse<ExpenseResponse>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId, expenseId } = req.params;
            const expense = await expenseService.updateExpense(req.user.userId, groupId, expenseId, req.body);
            res.status(200).json({ success: true, data: expense });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update expense';
            res.status(400).json({ success: false, error: { message, code: 'UPDATE_EXPENSE_ERROR' } });
        }
    },

    async deleteExpense(
        req: Request<{ groupId: string; expenseId: string }>,
        res: Response<ApiResponse<null>>
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
                return;
            }

            const { groupId, expenseId } = req.params;
            await expenseService.deleteExpense(req.user.userId, groupId, expenseId);
            res.status(200).json({ success: true, data: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete expense';
            res.status(400).json({ success: false, error: { message, code: 'DELETE_EXPENSE_ERROR' } });
        }
    }
};
