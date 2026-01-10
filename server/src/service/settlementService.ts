import { prisma } from '../prisma';
import {
    CreateSettlementRequest,
    SettlementResponse,
    SuggestedSettlement,
    SettlementStatus,
    UserSummary
} from '../type/settlement';



function transformUser(user: { id: string; email: string; displayName: string | null; avatarUrl: string | null }): UserSummary {
    return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? undefined,
        avatarUrl: user.avatarUrl ?? undefined
    };
}

export const settlementService = {
    async createSettlement(userId: string, groupId: string, data: CreateSettlementRequest): Promise<SettlementResponse> {
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
            status: settlement.status as SettlementStatus,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        };
    },

    async getSettlementsByGroup(userId: string, groupId: string): Promise<SettlementResponse[]> {
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
            status: settlement.status as SettlementStatus,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        }));
    },

    async getSuggestedSettlements(userId: string, groupId: string): Promise<SuggestedSettlement[]> {
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
        const balances = new Map<string, number>();
        const names = new Map<string, string>();

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
        const debtors: { userId: string; amount: number }[] = [];
        const creditors: { userId: string; amount: number }[] = [];

        balances.forEach((balance, odUserId) => {
            if (balance < -0.01) {
                debtors.push({ userId: odUserId, amount: Math.abs(balance) });
            } else if (balance > 0.01) {
                creditors.push({ userId: odUserId, amount: balance });
            }
        });

        // Sort by amount (largest first)
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        // Generate suggested settlements using greedy algorithm
        const suggestions: SuggestedSettlement[] = [];
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

            if (debtor.amount < 0.01) di++;
            if (creditor.amount < 0.01) ci++;
        }

        return suggestions;
    },

    async updateSettlementStatus(settlementId: string, status: SettlementStatus, vnpayTxnRef?: string): Promise<SettlementResponse> {
        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId }
        });

        if (!settlement) {
            throw new Error('Settlement not found');
        }

        // If settlement is being marked as COMPLETED, update user balances
        if (status === 'COMPLETED' && settlement.status !== 'COMPLETED') {
            const updatedSettlement = await prisma.$transaction(async (tx) => {
                // Decrease fromUser balance (they are paying)
                await tx.user.update({
                    where: { id: settlement.fromUserId },
                    data: {
                        balance: {
                            decrement: settlement.amount
                        }
                    }
                });

                // Increase toUser balance (they are receiving)
                await tx.user.update({
                    where: { id: settlement.toUserId },
                    data: {
                        balance: {
                            increment: settlement.amount
                        }
                    }
                });

                // Update settlement status
                return await tx.settlement.update({
                    where: { id: settlementId },
                    data: {
                        status,
                        vnpayTxnRef,
                        vnpayTransDate: new Date()
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
            });

            return {
                id: updatedSettlement.id,
                groupId: updatedSettlement.groupId,
                fromUser: transformUser(updatedSettlement.fromUser),
                toUser: transformUser(updatedSettlement.toUser),
                amount: Number(updatedSettlement.amount),
                currency: updatedSettlement.currency,
                status: updatedSettlement.status as SettlementStatus,
                settlementDate: updatedSettlement.settlementDate,
                note: updatedSettlement.note ?? undefined,
                vnpayTxnRef: updatedSettlement.vnpayTxnRef ?? undefined,
                createdAt: updatedSettlement.createdAt
            };
        }

        // For other status updates, just update the settlement without changing balances
        const updatedSettlement = await prisma.settlement.update({
            where: { id: settlementId },
            data: {
                status,
                vnpayTxnRef
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
            id: updatedSettlement.id,
            groupId: updatedSettlement.groupId,
            fromUser: transformUser(updatedSettlement.fromUser),
            toUser: transformUser(updatedSettlement.toUser),
            amount: Number(updatedSettlement.amount),
            currency: updatedSettlement.currency,
            status: updatedSettlement.status as SettlementStatus,
            settlementDate: updatedSettlement.settlementDate,
            note: updatedSettlement.note ?? undefined,
            vnpayTxnRef: updatedSettlement.vnpayTxnRef ?? undefined,
            createdAt: updatedSettlement.createdAt
        };
    },

    async getSettlementById(settlementId: string): Promise<SettlementResponse | null> {
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

        if (!settlement) return null;

        return {
            id: settlement.id,
            groupId: settlement.groupId,
            fromUser: transformUser(settlement.fromUser),
            toUser: transformUser(settlement.toUser),
            amount: Number(settlement.amount),
            currency: settlement.currency,
            status: settlement.status as SettlementStatus,
            settlementDate: settlement.settlementDate,
            note: settlement.note ?? undefined,
            vnpayTxnRef: settlement.vnpayTxnRef ?? undefined,
            createdAt: settlement.createdAt
        };
    },

    async getUserDebts(userId: string, groupId: string): Promise<{
        groupId: string;
        currency: string;
        iOwe: { userId: string; displayName?: string; avatarUrl?: string; amount: number }[];
        oweMe: { userId: string; displayName?: string; avatarUrl?: string; amount: number }[];
        netBalance: number;
    }> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const group = await prisma.group.findUnique({
            where: { id: groupId }
        });

        const members = await prisma.groupMember.findMany({
            where: { groupId, leftAt: null },
            include: {
                user: { select: { id: true, displayName: true, avatarUrl: true } }
            }
        });

        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: { shares: true }
        });

        const settlements = await prisma.settlement.findMany({
            where: { groupId, status: 'COMPLETED' }
        });

        // Calculate what each person owes to whom using a pairwise debt matrix
        // debt[A][B] = how much A owes B
        const debt = new Map<string, Map<string, number>>();
        const userInfo = new Map<string, { displayName?: string; avatarUrl?: string }>();

        members.forEach(m => {
            debt.set(m.userId, new Map());
            userInfo.set(m.userId, {
                displayName: m.user.displayName ?? undefined,
                avatarUrl: m.user.avatarUrl ?? undefined
            });
        });

        // For each expense, the payer is owed by each person in shares
        expenses.forEach(expense => {
            expense.shares.forEach(share => {
                if (share.userId !== expense.paidBy) {
                    const currentDebt = debt.get(share.userId)?.get(expense.paidBy) || 0;
                    debt.get(share.userId)?.set(expense.paidBy, currentDebt + Number(share.owedAmount));
                }
            });
        });

        // Subtract completed settlements
        settlements.forEach(s => {
            const currentDebt = debt.get(s.fromUserId)?.get(s.toUserId) || 0;
            debt.get(s.fromUserId)?.set(s.toUserId, currentDebt - Number(s.amount));
        });

        // Calculate what the current user owes and what others owe them
        const iOwe: { userId: string; displayName?: string; avatarUrl?: string; amount: number }[] = [];
        const oweMe: { userId: string; displayName?: string; avatarUrl?: string; amount: number }[] = [];
        let netBalance = 0;

        members.forEach(m => {
            if (m.userId === userId) return;

            // Net amount between current user and this member
            const iOweToThem = debt.get(userId)?.get(m.userId) || 0;
            const theyOweToMe = debt.get(m.userId)?.get(userId) || 0;
            const netAmount = theyOweToMe - iOweToThem;

            if (netAmount > 0.01) {
                // Others owe me
                oweMe.push({
                    userId: m.userId,
                    displayName: userInfo.get(m.userId)?.displayName,
                    avatarUrl: userInfo.get(m.userId)?.avatarUrl,
                    amount: Math.round(netAmount * 100) / 100
                });
                netBalance += netAmount;
            } else if (netAmount < -0.01) {
                // I owe others
                iOwe.push({
                    userId: m.userId,
                    displayName: userInfo.get(m.userId)?.displayName,
                    avatarUrl: userInfo.get(m.userId)?.avatarUrl,
                    amount: Math.round(Math.abs(netAmount) * 100) / 100
                });
                netBalance += netAmount;
            }
        });

        return {
            groupId,
            currency: group?.baseCurrency || 'VND',
            iOwe,
            oweMe,
            netBalance: Math.round(netBalance * 100) / 100
        };
    },

    async payWithBalance(userId: string, settlementId: string): Promise<{
        success: boolean;
        message: string;
        settlementId: string;
        amountPaid: number;
        newBalance: number;
    }> {
        const settlement = await prisma.settlement.findUnique({
            where: { id: settlementId },
            include: { fromUser: true }
        });

        if (!settlement) {
            throw new Error('Settlement not found');
        }

        if (settlement.fromUserId !== userId) {
            throw new Error('You can only pay settlements where you are the payer');
        }

        if (settlement.status !== 'PENDING') {
            throw new Error('Settlement is not in pending status');
        }

        // Check user balance
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const userBalance = Number(user.balance);
        const amount = Number(settlement.amount);

        if (userBalance < amount) {
            throw new Error(`Insufficient balance. Available: ${userBalance}, Required: ${amount}`);
        }

        // Execute payment in transaction
        const [updatedUser] = await prisma.$transaction([
            // Decrease payer balance
            prisma.user.update({
                where: { id: userId },
                data: { balance: { decrement: amount } }
            }),
            // Increase recipient balance
            prisma.user.update({
                where: { id: settlement.toUserId },
                data: { balance: { increment: amount } }
            }),
            // Update settlement status
            prisma.settlement.update({
                where: { id: settlementId },
                data: { status: 'COMPLETED' }
            })
        ]);

        return {
            success: true,
            message: 'Payment completed successfully',
            settlementId,
            amountPaid: amount,
            newBalance: Number(updatedUser.balance)
        };
    },

    /**
     * Quick pay: Tạo settlement và thanh toán ngay bằng balance
     */
    async quickPayDebt(userId: string, groupId: string, toUserId: string, amount: number, paymentMethod: 'BALANCE' | 'VNPAY'): Promise<{
        settlementId: string;
        status: string;
        paymentUrl?: string;
    }> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        if (userId === toUserId) {
            throw new Error('Cannot pay yourself');
        }

        // Create settlement
        const settlement = await prisma.settlement.create({
            data: {
                groupId,
                fromUserId: userId,
                toUserId,
                amount,
                currency: 'VND',
                status: 'PENDING'
            }
        });

        if (paymentMethod === 'BALANCE') {
            // Pay immediately with balance
            const result = await this.payWithBalance(userId, settlement.id);
            return {
                settlementId: settlement.id,
                status: 'COMPLETED'
            };
        } else {
            // Return settlement ID for VNPay payment
            return {
                settlementId: settlement.id,
                status: 'PENDING'
            };
        }
    },

    /**
     * Lấy các khoản tôi đang nợ (pending settlements where I am the payer)
     */
    async getMyPendingDebts(userId: string, groupId: string): Promise<{
        debts: {
            settlementId: string;
            toUser: UserSummary;
            amount: number;
            currency: string;
            status: string;
            createdAt: Date;
        }[];
        totalAmount: number;
    }> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const settlements = await prisma.settlement.findMany({
            where: {
                groupId,
                fromUserId: userId,
                status: 'PENDING'
            },
            include: {
                toUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const debts = settlements.map(s => ({
            settlementId: s.id,
            toUser: transformUser(s.toUser),
            amount: Number(s.amount),
            currency: s.currency,
            status: s.status,
            createdAt: s.createdAt
        }));

        return {
            debts,
            totalAmount: debts.reduce((sum, d) => sum + d.amount, 0)
        };
    },

    /**
     * Lấy các khoản người khác đang nợ tôi (settlements where I am the recipient)
     */
    async getMyPendingCredits(userId: string, groupId: string): Promise<{
        credits: {
            settlementId: string;
            fromUser: UserSummary;
            amount: number;
            currency: string;
            status: string;
            createdAt: Date;
        }[];
        totalPending: number;
        totalCompleted: number;
    }> {
        const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId, leftAt: null }
        });

        if (!membership) {
            throw new Error('You are not a member of this group');
        }

        const settlements = await prisma.settlement.findMany({
            where: {
                groupId,
                toUserId: userId
            },
            include: {
                fromUser: {
                    select: { id: true, email: true, displayName: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const credits = settlements.map(s => ({
            settlementId: s.id,
            fromUser: transformUser(s.fromUser),
            amount: Number(s.amount),
            currency: s.currency,
            status: s.status,
            createdAt: s.createdAt
        }));

        return {
            credits,
            totalPending: credits.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0),
            totalCompleted: credits.filter(c => c.status === 'COMPLETED').reduce((sum, c) => sum + c.amount, 0)
        };
    }
};
