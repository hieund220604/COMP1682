"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const debtController_1 = require("../controller/debtController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Get user's debts in a group (tổng hợp nợ)
router.get('/groups/:groupId/debts', authMiddleware_1.authMiddleware, debtController_1.debtController.getUserDebts);
// Get my pending debts (các khoản tôi đang nợ, chờ thanh toán)
router.get('/groups/:groupId/debts/pending', authMiddleware_1.authMiddleware, debtController_1.debtController.getMyPendingDebts);
// Get my pending credits (các khoản người khác đang nợ tôi)
router.get('/groups/:groupId/credits/pending', authMiddleware_1.authMiddleware, debtController_1.debtController.getMyPendingCredits);
// Quick pay debt (tạo settlement và thanh toán ngay)
router.post('/groups/:groupId/debts/quick-pay', authMiddleware_1.authMiddleware, debtController_1.debtController.quickPay);
// Pay settlement with balance
router.post('/settlements/:settlementId/pay-balance', authMiddleware_1.authMiddleware, debtController_1.debtController.payWithBalance);
// Pay settlement with VNPay
router.post('/settlements/:settlementId/pay-vnpay', authMiddleware_1.authMiddleware, debtController_1.debtController.payWithVNPay);
exports.default = router;
