"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseService = void 0;
const prisma_1 = require("../prisma");
const expense_1 = require("../type/expense");
function transformUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined
    };
}
function calculateShares(amountTotal, splitType, shares) {
    switch (splitType) {
        case expense_1.SplitType.EQUAL:
            const equalAmount = amountTotal / shares.length;
            return shares.map(s => ({
                userId: s.userId,
                owedAmount: Math.round(equalAmount * 100) / 100
            }));
        case expense_1.SplitType.EXACT:
            return shares.map(s => ({
                userId: s.userId,
                owedAmount: s.amount || 0
            }));
        case expense_1.SplitType.PERCENT:
            return shares.map(s => ({
                userId: s.userId,
                owedAmount: Math.round((amountTotal * (s.percent || 0) / 100) * 100) / 100
            }));
        default:
            throw new Error('Invalid split type');
    }
}
function calculateSharesFromItems(items, payerId) {
    const userTotals = new Map();
    for (const item of items) {
        // Skip items assigned to the payer - they don't owe themselves
        if (item.assignedTo === payerId) {
            continue;
        }
        const itemTotal = item.price * (item.quantity || 1);
        const current = userTotals.get(item.assignedTo) || 0;
        userTotals.set(item.assignedTo, current + itemTotal);
    }
    return Array.from(userTotals.entries()).map(([userId, owedAmount]) => ({
        userId,
        owedAmount: Math.round(owedAmount * 100) / 100
    }));
}
exports.expenseService = {
    async createExpense(userId, groupId, data) {
        // Verify user is a member of the group
        const membership = await prisma_1.prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        // Get all valid member IDs
        const memberIds = await prisma_1.prisma.groupMember.findMany({
            where: { groupId, leftAt: null },
            select: { userId: true }
        });
        const validMemberIds = new Set(memberIds.map(m => m.userId));
        let calculatedShares = [];
        let itemsToCreate = [];
        if (data.splitType === expense_1.SplitType.ITEM_BASED) {
            // Validate items for ITEM_BASED split
            if (!data.items || data.items.length === 0) {
                throw new Error('At least one item is required for item-based split');
            }
            // Validate all item users are members
            for (const item of data.items) {
                if (!validMemberIds.has(item.assignedTo)) {
                    throw new Error(`User ${item.assignedTo} is not a member of this group`);
                }
            }
            // Calculate shares from items (excluding payer's own items)
            calculatedShares = calculateSharesFromItems(data.items, userId);
            itemsToCreate = data.items.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                assignedTo: item.assignedTo
            }));
        }
        else {
            // Validate shares for other split types
            if (!data.shares || data.shares.length === 0) {
                throw new Error('At least one share is required');
            }
            // Validate all share users are members
            for (const share of data.shares) {
                if (!validMemberIds.has(share.userId)) {
                    throw new Error(`User ${share.userId} is not a member of this group`);
                }
            }
            // Calculate shares
            calculatedShares = calculateShares(data.amountTotal, data.splitType, data.shares);
            // Validate total matches for EXACT split
            if (data.splitType === expense_1.SplitType.EXACT) {
                const totalShares = calculatedShares.reduce((sum, s) => sum + s.owedAmount, 0);
                if (Math.abs(totalShares - data.amountTotal) > 1) {
                    throw new Error('Sum of shares must equal total amount');
                }
            }
            // Validate percentages for PERCENT split
            if (data.splitType === expense_1.SplitType.PERCENT) {
                const totalPercent = data.shares.reduce((sum, s) => sum + (s.percent || 0), 0);
                if (Math.abs(totalPercent - 100) > 0.01) {
                    throw new Error('Percentages must sum to 100%');
                }
            }
        }
        // Create expense with shares (and items if ITEM_BASED)
        const expense = await prisma_1.prisma.expense.create({
            data: {
                groupId,
                title: data.title,
                amountTotal: data.amountTotal,
                currency: data.currency || 'VND',
                splitType: data.splitType,
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
                },
                items: itemsToCreate.length > 0 ? {
                    create: itemsToCreate
                } : undefined
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
                },
                items: {
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
            splitType: expense.splitType,
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
            items: expense.items.map(item => ({
                id: item.id,
                expenseId: item.expenseId,
                name: item.name,
                price: Number(item.price),
                quantity: item.quantity,
                assignedTo: item.assignedTo,
                user: transformUser(item.user)
            })),
            createdAt: expense.createdAt
        };
    },
    async getExpenseById(userId, groupId, expenseId) {
        const membership = await prisma_1.prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        const expense = await prisma_1.prisma.expense.findFirst({
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
            splitType: expense.splitType,
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
    async getExpensesByGroup(userId, groupId, page = 1, limit = 20) {
        const membership = await prisma_1.prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        const [expenses, total] = await Promise.all([
            prisma_1.prisma.expense.findMany({
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
            prisma_1.prisma.expense.count({ where: { groupId } })
        ]);
        return {
            expenses: expenses.map(expense => ({
                id: expense.id,
                groupId: expense.groupId,
                title: expense.title,
                amountTotal: Number(expense.amountTotal),
                currency: expense.currency,
                splitType: expense.splitType,
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
    async updateExpense(userId, groupId, expenseId, data) {
        const membership = await prisma_1.prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        const existingExpense = await prisma_1.prisma.expense.findFirst({
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
            const calculatedShares = calculateShares(data.amountTotal || Number(existingExpense.amountTotal), data.splitType, data.shares);
            // Delete existing shares and create new ones
            await prisma_1.prisma.expenseShare.deleteMany({ where: { expenseId } });
            sharesUpdate = {
                create: calculatedShares.map(s => ({
                    userId: s.userId,
                    owedAmount: s.owedAmount
                }))
            };
        }
        const expense = await prisma_1.prisma.expense.update({
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
            splitType: expense.splitType,
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
    async deleteExpense(userId, groupId, expenseId) {
        const membership = await prisma_1.prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        const expense = await prisma_1.prisma.expense.findFirst({
            where: { id: expenseId, groupId }
        });
        if (!expense) {
            throw new Error('Expense not found');
        }
        // Only payer or admin/owner can delete
        if (expense.paidBy !== userId && membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
            throw new Error('Only the payer or group admin can delete this expense');
        }
        await prisma_1.prisma.expense.delete({ where: { id: expenseId } });
    }
};
