"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expenseController_1 = require("../controller/expenseController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authMiddleware);
// Expense CRUD
router.post('/:groupId/expenses', expenseController_1.expenseController.createExpense);
router.get('/:groupId/expenses', expenseController_1.expenseController.getExpensesByGroup);
router.get('/:groupId/expenses/:expenseId', expenseController_1.expenseController.getExpenseById);
router.patch('/:groupId/expenses/:expenseId', expenseController_1.expenseController.updateExpense);
router.delete('/:groupId/expenses/:expenseId', expenseController_1.expenseController.deleteExpense);
exports.default = router;
