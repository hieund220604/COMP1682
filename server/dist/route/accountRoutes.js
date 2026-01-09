"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const accountController_1 = require("../controller/accountController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Initiate Top-Up
router.post('/top-up', authMiddleware_1.authMiddleware, accountController_1.accountController.initiateTopUp);
exports.default = router;
