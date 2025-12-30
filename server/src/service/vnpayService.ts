import { VNPay, ProductCode, VnpLocale, dateFormat, HashAlgorithm } from 'vnpay';
import { settlementService } from './settlementService';
import { SettlementStatus } from '../type/settlement';
import { PaymentResponse } from '../type/vnpay';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize VNPay instance
const vnpay = new VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
    secureSecret: process.env.VNPAY_HASH_SECRET || 'DEMOSECRET',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    enableLog: true
});

export const vnpayService = {
    async createPaymentUrl(settlementId: string, returnUrl: string, ipAddr: string): Promise<PaymentResponse> {
        // Get settlement details
        const settlement = await settlementService.getSettlementById(settlementId);

        if (!settlement) {
            throw new Error('Settlement not found');
        }

        if (settlement.status !== SettlementStatus.PENDING) {
            throw new Error('Settlement is not in pending status');
        }

        // Generate unique transaction reference
        const txnRef = `${settlementId.substring(0, 8)}_${Date.now()}`;
        const createDate = dateFormat(new Date());

        // Create payment URL
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: settlement.amount,
            vnp_IpAddr: ipAddr,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toan settlement ${settlementId}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: createDate
        });

        // Update settlement with txnRef
        await prisma.settlement.update({
            where: { id: settlementId },
            data: { vnpayTxnRef: txnRef }
        });

        return {
            paymentUrl,
            settlementId,
            txnRef,
            amount: settlement.amount
        };
    },

    async verifyReturnUrl(query: Record<string, string>): Promise<{ isValid: boolean; settlementId?: string; message: string }> {
        try {
            const result = vnpay.verifyReturnUrl(query as any);

            if (!result.isVerified) {
                return { isValid: false, message: 'Invalid signature' };
            }

            if (!result.isSuccess) {
                return { isValid: false, message: 'Payment failed' };
            }

            // Extract settlement ID from txnRef
            const txnRef = query.vnp_TxnRef;
            const settlement = await prisma.settlement.findFirst({
                where: { vnpayTxnRef: txnRef }
            });

            if (!settlement) {
                return { isValid: false, message: 'Settlement not found' };
            }

            // Update settlement status
            await settlementService.updateSettlementStatus(settlement.id, SettlementStatus.COMPLETED, txnRef);

            return {
                isValid: true,
                settlementId: settlement.id,
                message: 'Payment successful'
            };
        } catch (error) {
            return {
                isValid: false,
                message: error instanceof Error ? error.message : 'Verification failed'
            };
        }
    },

    async handleIPN(query: Record<string, string>): Promise<{ RspCode: string; Message: string }> {
        try {
            const verify = vnpay.verifyIpnCall(query as any);

            if (!verify.isVerified) {
                return { RspCode: '97', Message: 'Fail checksum' };
            }

            const txnRef = query.vnp_TxnRef;
            const vnpAmount = parseInt(query.vnp_Amount || '0') / 100; // VNPay sends amount * 100

            // Find settlement by txnRef
            const settlement = await prisma.settlement.findFirst({
                where: { vnpayTxnRef: txnRef }
            });

            if (!settlement) {
                return { RspCode: '01', Message: 'Order not found' };
            }

            // Check if already processed
            if (settlement.status === 'COMPLETED') {
                return { RspCode: '02', Message: 'Order already confirmed' };
            }

            // Verify amount
            if (Number(settlement.amount) !== vnpAmount) {
                return { RspCode: '04', Message: 'Invalid amount' };
            }

            // Update settlement status based on response
            if (verify.isSuccess) {
                await settlementService.updateSettlementStatus(settlement.id, SettlementStatus.COMPLETED, txnRef);
            } else {
                await settlementService.updateSettlementStatus(settlement.id, SettlementStatus.FAILED, txnRef);
            }

            return { RspCode: '00', Message: 'Confirm Success' };
        } catch (error) {
            console.error('IPN Error:', error);
            return { RspCode: '99', Message: 'Unknown error' };
        }
    }
};
