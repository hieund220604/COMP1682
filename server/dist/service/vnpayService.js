"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpayService = void 0;
const vnpay_1 = require("vnpay");
const settlementService_1 = require("./settlementService");
const accountService_1 = require("./accountService");
const settlement_1 = require("../type/settlement");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Initialize VNPay instance
const vnpay = new vnpay_1.VNPay({
    tmnCode: process.env.VNPAY_TMN_CODE || 'DEMO',
    secureSecret: process.env.VNPAY_HASH_SECRET || 'DEMOSECRET',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: vnpay_1.HashAlgorithm.SHA512,
    enableLog: true
});
exports.vnpayService = {
    async createPaymentUrl(settlementId, returnUrl, ipAddr) {
        // Get settlement details
        const settlement = await settlementService_1.settlementService.getSettlementById(settlementId);
        if (!settlement) {
            throw new Error('Settlement not found');
        }
        if (settlement.status !== settlement_1.SettlementStatus.PENDING) {
            throw new Error('Settlement is not in pending status');
        }
        // Generate unique transaction reference
        const txnRef = `${settlementId.substring(0, 8)}_${Date.now()}`;
        const createDate = (0, vnpay_1.dateFormat)(new Date());
        // Create payment URL
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: settlement.amount,
            vnp_IpAddr: ipAddr,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toan settlement ${settlementId}`,
            vnp_OrderType: vnpay_1.ProductCode.Other,
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: vnpay_1.VnpLocale.VN,
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
    async createTopUpUrl(topUpId, amount, returnUrl, ipAddr) {
        // Generate unique transaction reference with TU_ prefix
        const txnRef = `TU_${topUpId.substring(0, 8)}_${Date.now()}`;
        const createDate = (0, vnpay_1.dateFormat)(new Date());
        // Create payment URL
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: amount,
            vnp_IpAddr: ipAddr,
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Nap tien tai khoan ${topUpId}`,
            vnp_OrderType: vnpay_1.ProductCode.Other,
            vnp_ReturnUrl: returnUrl,
            vnp_Locale: vnpay_1.VnpLocale.VN,
            vnp_CreateDate: createDate
        });
        // Update top-up with txnRef
        await prisma.topUp.update({
            where: { id: topUpId },
            data: { vnpayTxnRef: txnRef }
        });
        return {
            paymentUrl,
            settlementId: topUpId, // Reusing field name for consistency
            txnRef,
            amount: amount
        };
    },
    async verifyReturnUrl(query) {
        try {
            const result = vnpay.verifyReturnUrl(query);
            if (!result.isVerified) {
                return { isValid: false, message: 'Invalid signature' };
            }
            if (!result.isSuccess) {
                return { isValid: false, message: 'Payment failed' };
            }
            const txnRef = query.vnp_TxnRef;
            // Check if it is a TopUp transaction
            if (txnRef.startsWith('TU_')) {
                const topUp = await prisma.topUp.findFirst({
                    where: { vnpayTxnRef: txnRef }
                });
                if (!topUp) {
                    return { isValid: false, message: 'Top-up transaction not found' };
                }
                await accountService_1.accountService.completeTopUp(topUp.id, txnRef);
                return {
                    isValid: true,
                    settlementId: topUp.id,
                    message: 'Top-up successful'
                };
            }
            // Otherwise, handle as Settlement
            const settlement = await prisma.settlement.findFirst({
                where: { vnpayTxnRef: txnRef }
            });
            if (!settlement) {
                return { isValid: false, message: 'Settlement not found' };
            }
            await settlementService_1.settlementService.updateSettlementStatus(settlement.id, settlement_1.SettlementStatus.COMPLETED, txnRef);
            return {
                isValid: true,
                settlementId: settlement.id,
                message: 'Payment successful'
            };
        }
        catch (error) {
            return {
                isValid: false,
                message: error instanceof Error ? error.message : 'Verification failed'
            };
        }
    },
    async handleIPN(query) {
        try {
            const verify = vnpay.verifyIpnCall(query);
            if (!verify.isVerified) {
                return { RspCode: '97', Message: 'Fail checksum' };
            }
            const txnRef = query.vnp_TxnRef;
            const vnpAmount = parseInt(query.vnp_Amount || '0') / 100;
            // Handle TopUp
            if (txnRef.startsWith('TU_')) {
                const topUp = await prisma.topUp.findFirst({
                    where: { vnpayTxnRef: txnRef }
                });
                if (!topUp) {
                    return { RspCode: '01', Message: 'Top-up not found' };
                }
                if (topUp.status === 'COMPLETED') {
                    return { RspCode: '02', Message: 'Top-up already confirmed' };
                }
                if (Number(topUp.amount) !== vnpAmount) {
                    return { RspCode: '04', Message: 'Invalid amount' };
                }
                if (verify.isSuccess) {
                    await accountService_1.accountService.completeTopUp(topUp.id, txnRef);
                }
                else {
                    await accountService_1.accountService.failTopUp(topUp.id, txnRef);
                }
                return { RspCode: '00', Message: 'Confirm Success' };
            }
            // Handle Settlement (Existing Logic)
            const settlement = await prisma.settlement.findFirst({
                where: { vnpayTxnRef: txnRef }
            });
            if (!settlement) {
                return { RspCode: '01', Message: 'Order not found' };
            }
            if (settlement.status === 'COMPLETED') {
                return { RspCode: '02', Message: 'Order already confirmed' };
            }
            if (Number(settlement.amount) !== vnpAmount) {
                return { RspCode: '04', Message: 'Invalid amount' };
            }
            if (verify.isSuccess) {
                await settlementService_1.settlementService.updateSettlementStatus(settlement.id, settlement_1.SettlementStatus.COMPLETED, txnRef);
            }
            else {
                await settlementService_1.settlementService.updateSettlementStatus(settlement.id, settlement_1.SettlementStatus.FAILED, txnRef);
            }
            return { RspCode: '00', Message: 'Confirm Success' };
        }
        catch (error) {
            console.error('IPN Error:', error);
            return { RspCode: '99', Message: 'Unknown error' };
        }
    }
};
