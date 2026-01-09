"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groupController_1 = require("../controller/groupController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authMiddleware);
// Group CRUD
router.post('/', groupController_1.groupController.createGroup);
router.get('/', groupController_1.groupController.getUserGroups);
router.get('/:groupId', groupController_1.groupController.getGroupById);
router.patch('/:groupId', groupController_1.groupController.updateGroup);
router.delete('/:groupId', groupController_1.groupController.deleteGroup);
// Invites
router.get('/invites/pending', groupController_1.groupController.getPendingInvites); // Must be before :groupId routes
router.post('/:groupId/invites', groupController_1.groupController.createInvite);
router.post('/invites/accept', groupController_1.groupController.acceptInvite);
// Members
router.get('/:groupId/members', groupController_1.groupController.getGroupMembers);
router.patch('/:groupId/members/:memberId/role', groupController_1.groupController.updateMemberRole);
router.delete('/:groupId/members/:memberId', groupController_1.groupController.removeMember);
router.post('/:groupId/leave', groupController_1.groupController.leaveGroup);
// Balance
router.get('/:groupId/balance', groupController_1.groupController.getGroupBalance);
exports.default = router;
