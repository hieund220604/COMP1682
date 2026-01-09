"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountService = void 0;
const client_1 = require("@prisma/client");
const account_1 = require("../type/account");
const prisma = new client_1.PrismaClient();
exports.accountService = {
    async createTopUp(userId, amount) {
        // Validate user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new Error('User not found');
        }
        // Create pending top-up
        const topUp = await prisma.topUp.create({
            data: {
                userId,
                amount,
                status: account_1.TopUpStatus.PENDING
            }
        });
        return topUp.id;
    },
    async completeTopUp(topUpId, txnRef) {
        const topUp = await prisma.topUp.findUnique({
            where: { id: topUpId }
        });
        if (!topUp) {
            throw new Error('Top-up transaction not found');
        }
        if (topUp.status === account_1.TopUpStatus.COMPLETED) {
            return; // Already completed
        }
        // Transaction to update status and balance on User
        await prisma.$transaction([
            prisma.topUp.update({
                where: { id: topUpId },
                data: {
                    status: account_1.TopUpStatus.COMPLETED,
                    vnpayTxnRef: txnRef
                }
            }),
            prisma.user.update({
                where: { id: topUp.userId },
                data: {
                    balance: {
                        increment: topUp.amount
                    }
                }
            })
        ]);
    },
    async failTopUp(topUpId, txnRef) {
        await prisma.topUp.update({
            where: { id: topUpId },
            data: {
                status: account_1.TopUpStatus.FAILED,
                vnpayTxnRef: txnRef
            }
        });
    }
};
