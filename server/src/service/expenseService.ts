import { prisma } from '../prisma';
import {
    CreateExpenseRequest,
    UpdateExpenseRequest,
    ExpenseResponse,
    ExpenseShareResponse,
    SplitType,
    UserSummary
} from '../type/expense';

function transformUser(user: { id: string; email: string; displayName: string | null; avatarUrl: string | null }): UserSummary {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined
    };
}

function calculateShares(
    amountTotal: number,
    splitType: SplitType,
    shares: { userId: string; amount?: number; percent?: number }[]
): { userId: string; owedAmount: number }[] {
    switch (splitType) {
        case SplitType.EQUAL:
            const equalAmount = amountTotal / shares.length;
            return shares.map(s => ({
                userId: s.userId,
                owedAmount: Math.round(equalAmount * 100) / 100
            }));

        case SplitType.EXACT:
            return shares.map(s => ({
                userId: s.userId,
                owedAmount: s.amount || 0
            }));

        case SplitType.PERCENT:
            return shares.map(s => ({
                userId: s.userId,
                owedAmount: Math.round((amountTotal * (s.percent || 0) / 100) * 100) / 100
            }));

        default:
            throw new Error('Invalid split type');
    }
}

export const expenseService = {
    async createExpense(userId: string, groupId: string, data: CreateExpenseRequest): Promise<ExpenseResponse> {
        // Verify user is a member of the group
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        // Validate shares
        if (!data.shares || data.shares.length === 0) {
            throw new Error('At least one share is required');
        }

        // Validate all share users are members
        const memberIds = await prisma.groupMember.findMany({
            where: { groupId, leftAt: null },
            select: { userId: true }
        });
        const validMemberIds = new Set(memberIds.map(m => m.userId));

        for (const share of data.shares) {
            if (!validMemberIds.has(share.userId)) {
                throw new Error(`User ${share.userId} is not a member of this group`);
            }
        }

        // Calculate shares
        const calculatedShares = calculateShares(data.amountTotal, data.splitType, data.shares);

        // Validate total matches for EXACT split
        if (data.splitType === SplitType.EXACT) {
            const totalShares = calculatedShares.reduce((sum, s) => sum + s.owedAmount, 0);
            if (Math.abs(totalShares - data.amountTotal) > 1) {
                throw new Error('Sum of shares must equal total amount');
            }
        }

        // Validate percentages for PERCENT split
        if (data.splitType === SplitType.PERCENT) {
            const totalPercent = data.shares.reduce((sum, s) => sum + (s.percent || 0), 0);
            if (Math.abs(totalPercent - 100) > 0.01) {
                throw new Error('Percentages must sum to 100%');
            }
        }

        // Create expense with shares in transaction
        const expense = await prisma.expense.create({
            data: {
                groupId,
                title: data.title,
                amountTotal: data.amountTotal,
                currency: data.currency || 'VND',
                category: data.category,
                expenseType: data.expenseType,
                paidBy: userId,
                expenseDate: data.expenseDate || new Date(),
                note: data.note,
                shares: {
                    create: calculatedShares.map(s => ({
                        userId: s.userId,
                        owedAmount: s.owedAmount
                    }))
                }
            },
            include: {
                paidByUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                shares: {
                    include: {
                        user: {
                            select: { id: true, email: true, displayName: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        return {
            id: expense.id,
            groupId: expense.groupId,
            title: expense.title,
            amountTotal: Number(expense.amountTotal),
            currency: expense.currency,
            category: expense.category ?? undefined,
            expenseType: expense.expenseType ?? undefined,
            paidBy: transformUser(expense.paidByUser),
            expenseDate: expense.expenseDate,
            note: expense.note ?? undefined,
            shares: expense.shares.map(s => ({
                id: s.id,
                expenseId: s.expenseId,
                userId: s.userId,
                owedAmount: Number(s.owedAmount),
                shareNote: s.shareNote ?? undefined,
                user: transformUser(s.user)
            })),
            createdAt: expense.createdAt
        };
    },

    async getExpenseById(userId: string, groupId: string, expenseId: string): Promise<ExpenseResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const expense = await prisma.expense.findFirst({
            where: { id: expenseId, groupId },
            include: {
                paidByUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                shares: {
                    include: {
                        user: {
                            select: { id: true, email: true, displayName: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        if (!expense) {
            throw new Error('Expense not found');
        }

        return {
            id: expense.id,
            groupId: expense.groupId,
            title: expense.title,
            amountTotal: Number(expense.amountTotal),
            currency: expense.currency,
            category: expense.category ?? undefined,
            expenseType: expense.expenseType ?? undefined,
            paidBy: transformUser(expense.paidByUser),
            expenseDate: expense.expenseDate,
            note: expense.note ?? undefined,
            shares: expense.shares.map(s => ({
                id: s.id,
                expenseId: s.expenseId,
                userId: s.userId,
                owedAmount: Number(s.owedAmount),
                shareNote: s.shareNote ?? undefined,
                user: transformUser(s.user)
            })),
            createdAt: expense.createdAt
        };
    },

    async getExpensesByGroup(userId: string, groupId: string, page: number = 1, limit: number = 20): Promise<{ expenses: ExpenseResponse[]; total: number }> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where: { groupId },
                include: {
                    paidByUser: {
                        select: { id: true, email: true, displayName: true, avatarUrl: true }
                    },
                    shares: {
                        include: {
                            user: {
                                select: { id: true, email: true, displayName: true, avatarUrl: true }
                            }
                        }
                    }
                },
                orderBy: { expenseDate: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            prisma.expense.count({ where: { groupId } })
        ]);

        return {
            expenses: expenses.map(expense => ({
                id: expense.id,
                groupId: expense.groupId,
                title: expense.title,
                amountTotal: Number(expense.amountTotal),
                currency: expense.currency,
                category: expense.category ?? undefined,
                expenseType: expense.expenseType ?? undefined,
                paidBy: transformUser(expense.paidByUser),
                expenseDate: expense.expenseDate,
                note: expense.note ?? undefined,
                shares: expense.shares.map(s => ({
                    id: s.id,
                    expenseId: s.expenseId,
                    userId: s.userId,
                    owedAmount: Number(s.owedAmount),
                    shareNote: s.shareNote ?? undefined,
                    user: transformUser(s.user)
                })),
                createdAt: expense.createdAt
            })),
            total
        };
    },

    async updateExpense(userId: string, groupId: string, expenseId: string, data: UpdateExpenseRequest): Promise<ExpenseResponse> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const existingExpense = await prisma.expense.findFirst({
            where: { id: expenseId, groupId }
        });

        if (!existingExpense) {
            throw new Error('Expense not found');
        }

        // Only payer or admin/owner can update
        if (existingExpense.paidBy !== userId && membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
            throw new Error('Only the payer or group admin can update this expense');
        }

        // If shares are being updated, recalculate
        let sharesUpdate = undefined;
        if (data.shares && data.splitType) {
            const calculatedShares = calculateShares(
                data.amountTotal || Number(existingExpense.amountTotal),
                data.splitType,
                data.shares
            );

            // Delete existing shares and create new ones
            await prisma.expenseShare.deleteMany({ where: { expenseId } });
            sharesUpdate = {
                create: calculatedShares.map(s => ({
                    userId: s.userId,
                    owedAmount: s.owedAmount
                }))
            };
        }

        const expense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                title: data.title,
                amountTotal: data.amountTotal,
                currency: data.currency,
                category: data.category,
                expenseType: data.expenseType,
                expenseDate: data.expenseDate,
                note: data.note,
                shares: sharesUpdate
            },
            include: {
                paidByUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                shares: {
                    include: {
                        user: {
                            select: { id: true, email: true, displayName: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        return {
            id: expense.id,
            groupId: expense.groupId,
            title: expense.title,
            amountTotal: Number(expense.amountTotal),
            currency: expense.currency,
            category: expense.category ?? undefined,
            expenseType: expense.expenseType ?? undefined,
            paidBy: transformUser(expense.paidByUser),
            expenseDate: expense.expenseDate,
            note: expense.note ?? undefined,
            shares: expense.shares.map(s => ({
                id: s.id,
                expenseId: s.expenseId,
                userId: s.userId,
                owedAmount: Number(s.owedAmount),
                shareNote: s.shareNote ?? undefined,
                user: transformUser(s.user)
            })),
            createdAt: expense.createdAt
        };
    },

    async deleteExpense(userId: string, groupId: string, expenseId: string): Promise<void> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const expense = await prisma.expense.findFirst({
            where: { id: expenseId, groupId }
        });

        if (!expense) {
            throw new Error('Expense not found');
        }

        // Only payer or admin/owner can delete
        if (expense.paidBy !== userId && membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
            throw new Error('Only the payer or group admin can delete this expense');
        }

        await prisma.expense.delete({ where: { id: expenseId } });
    }
};
