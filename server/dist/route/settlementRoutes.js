"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settlementController_1 = require("../controller/settlementController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authMiddleware);
// Settlement routes
router.post('/:groupId/settlements', settlementController_1.settlementController.createSettlement);
router.get('/:groupId/settlements', settlementController_1.settlementController.getSettlementsByGroup);
router.get('/:groupId/settlements/suggested', settlementController_1.settlementController.getSuggestedSettlements);
exports.default = router;
