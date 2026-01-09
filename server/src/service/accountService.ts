import { PrismaClient } from '@prisma/client';
import { TopUpStatus } from '../type/account';
import { vnpayService } from './vnpayService';

const prisma = new PrismaClient();

export const accountService = {
    async createTopUp(accountId: string, amount: number): Promise<string> {
        // Validate account
        const account = await prisma.account.findUnique({
            where: { id: accountId }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        // Create pending top-up
        const topUp = await prisma.topUp.create({
            data: {
                accountId,
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

        // Transaction to update status and balance
        await prisma.$transaction([
            prisma.topUp.update({
                where: { id: topUpId },
                data: {
                    status: TopUpStatus.COMPLETED,
                    vnpayTxnRef: txnRef
                }
            }),
            prisma.account.update({
                where: { id: topUp.accountId },
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
