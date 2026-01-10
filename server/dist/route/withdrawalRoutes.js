"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const withdrawalController_1 = require("../controller/withdrawalController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authMiddleware);
// Withdrawal routes
router.post('/', withdrawalController_1.withdrawalController.initiateWithdrawal);
router.post('/:withdrawalId/resend-otp', withdrawalController_1.withdrawalController.resendOTP);
router.post('/:withdrawalId/verify-otp', withdrawalController_1.withdrawalController.verifyOTP);
router.get('/:withdrawalId', withdrawalController_1.withdrawalController.getWithdrawalStatus);
router.get('/', withdrawalController_1.withdrawalController.getUserWithdrawals);
exports.default = router;
