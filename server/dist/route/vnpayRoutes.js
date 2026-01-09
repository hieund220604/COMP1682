"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vnpayController_1 = require("../controller/vnpayController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Create payment requires authentication
router.post('/', authMiddleware_1.authMiddleware, vnpayController_1.vnpayController.createPayment);
// VNPay callbacks - no auth required (called by VNPay)
router.get('/vnpay-return', vnpayController_1.vnpayController.vnpayReturn);
router.get('/vnpay-ipn', vnpayController_1.vnpayController.vnpayIPN);
exports.default = router;
