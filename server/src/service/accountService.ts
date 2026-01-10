import { prisma } from '../prisma';
import { TopUpStatus } from '../type/account';
import { vnpayService } from './vnpayService';

export const accountService = {
    async createTopUp(userId: string, amount: number): Promise<string> {
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
                status: TopUpStatus.PENDING
            }
        });

        return topUp.id;
    },

    async completeTopUp(topUpId: string, txnRef: string): Promise<void> {
        const topUp = await prisma.topUp.findUnique({
            where: { id: topUpId }
        });

        if (!topUp) {
            throw new Error('Top-up transaction not found');
        }

        if (topUp.status === TopUpStatus.COMPLETED) {
            return; // Already completed
        }

        // Transaction to update status and balance on User
        await prisma.$transaction([
            prisma.topUp.update({
                where: { id: topUpId },
                data: {
                    status: TopUpStatus.COMPLETED,
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

    async failTopUp(topUpId: string, txnRef: string): Promise<void> {
        await prisma.topUp.update({
            where: { id: topUpId },
            data: {
                status: TopUpStatus.FAILED,
                vnpayTxnRef: txnRef
            }
        });
    }
};
