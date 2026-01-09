"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settlementService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function transformUser(user) {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined
    };
}
exports.settlementService = {
    async createSettlement(userId, groupId, data) {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        // Verify recipient is a member
        const recipientMembership = await prisma.groupMember.findFirst({
            where: { groupId, userId: data.toUserId, leftAt: null }
        });
        if (!recipientMembership) {
            throw new Error('Recipient is not a member of this group');
        }
        if (userId === data.toUserId) {
            throw new Error('Cannot settle with yourself');
        }
        const settlement = await prisma.settlement.create({
            data: {
                groupId,
                fromUserId: userId,
                toUserId: data.toUserId,
                amount: data.amount,
                currency: data.currency || 'VND',
                note: data.note,
                status: 'PENDING'
            },
            include: {
                fromUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                toUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            }
        });
        return {
            id: settlement.id,
            groupId: settlement.groupId,
            fromUser: transformUser(settlement.fromUser),
            toUser: transformUser(settlement.toUser),
            amount: Number(settlement.amount),
            currency: settlement.currency,
            status: settlement.status,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        };
    },
    async getSettlementsByGroup(userId, groupId) {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        const settlements = await prisma.settlement.findMany({
            where: { groupId },
            include: {
                fromUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                toUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return settlements.map(settlement => ({
            id: settlement.id,
            groupId: settlement.groupId,
            fromUser: transformUser(settlement.fromUser),
            toUser: transformUser(settlement.toUser),
            amount: Number(settlement.amount),
            currency: settlement.currency,
            status: settlement.status,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        }));
    },
    async getSuggestedSettlements(userId, groupId) {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });
        if (!membership) {
            throw new Error('You are not a member of this group');
        }
        // Get group info for currency
        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });
        // Get all active members
        const members = await prisma.groupMember.findMany({
            where: { groupId, leftAt: null },
            include: {
                user: { select: { id: true, displayName: true } }
            }
        });
        // Get all expenses
        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: { shares: true }
        });
        // Get completed settlements
        const settlements = await prisma.settlement.findMany({
            where: { groupId, status: 'COMPLETED' }
        });
        // Calculate net balance for each member
        const balances = new Map();
        const names = new Map();
        members.forEach(m => {
            balances.set(m.userId, 0);
            names.set(m.userId, m.user.displayName || m.userId);
        });
        // Add what each person paid
        expenses.forEach(expense => {
            const current = balances.get(expense.paidBy) || 0;
            balances.set(expense.paidBy, current + Number(expense.amountTotal));
        });
        // Subtract what each person owes
        expenses.forEach(expense => {
            expense.shares.forEach(share => {
                const current = balances.get(share.userId) || 0;
                balances.set(share.userId, current - Number(share.owedAmount));
            });
        });
        // Add settlements
        settlements.forEach(s => {
            const fromBalance = balances.get(s.fromUserId) || 0;
            const toBalance = balances.get(s.toUserId) || 0;
            balances.set(s.fromUserId, fromBalance + Number(s.amount));
            balances.set(s.toUserId, toBalance - Number(s.amount));
        });
        // Separate into debtors (negative balance) and creditors (positive balance)
        const debtors = [];
        const creditors = [];
        balances.forEach((balance, odUserId) => {
            if (balance < -0.01) {
                debtors.push({ userId: odUserId, amount: Math.abs(balance) });
            }
            else if (balance > 0.01) {
                creditors.push({ userId: odUserId, amount: balance });
            }
        });
        // Sort by amount (largest first)
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);
        // Generate suggested settlements using greedy algorithm
        const suggestions = [];
        let di = 0, ci = 0;
        while (di < debtors.length && ci < creditors.length) {
            const debtor = debtors[di];
            const creditor = creditors[ci];
            const amount = Math.min(debtor.amount, creditor.amount);
            if (amount > 0.01) {
                suggestions.push({
                    fromUserId: debtor.userId,
                    fromUserName: names.get(debtor.userId),
                    toUserId: creditor.userId,
                    toUserName: names.get(creditor.userId),
                    amount: Math.round(amount * 100) / 100,
                    currency: group?.baseCurrency || 'VND'
                });
            }
            debtor.amount -= amount;
            creditor.amount -= amount;
            if (debtor.amount < 0.01)
                di++;
            if (creditor.amount < 0.01)
                ci++;
        }
        return suggestions;
    },
    async updateSettlementStatus(settlementId, status, vnpayTxnRef) {
        const settlement = await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                status,
                vnpayTxnRef,
                vnpayTransDate: status === 'COMPLETED' ? new Date() : undefined
            },
            include: {
                fromUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                toUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            }
        });
        return {
            id: settlement.id,
            groupId: settlement.groupId,
            fromUser: transformUser(settlement.fromUser),
            toUser: transformUser(settlement.toUser),
            amount: Number(settlement.amount),
            currency: settlement.currency,
            status: settlement.status,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        };
    },
    async getSettlementById(settlementId) {
        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: {
                fromUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                },
                toUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            }
        });
        if (!settlement)
            return null;
        return {
            id: settlement.id,
            groupId: settlement.groupId,
            fromUser: transformUser(settlement.fromUser),
            toUser: transformUser(settlement.toUser),
            amount: Number(settlement.amount),
            currency: settlement.currency,
            status: settlement.status,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        };
    }
};
